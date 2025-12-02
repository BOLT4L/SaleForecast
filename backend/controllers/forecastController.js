const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { PythonShell } = require("python-shell");
const Sale = require("../models/Sale");
const Forecast = require("../models/Forecast");
const Product = require("../models/Product");
const logger = require("../utils/logger");

const MIN_SALES_RECORDS = 10;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

const GLOBAL_DATA_ROLES = new Set(["Admin", "Owner"]);
const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
};

const executePythonScript = async (
  salesData,
  forecastPeriod,
  modelType,
  startDate,
  endDate,
  maxRetries = 3,
  context = {}
) => {
  const runId = context.runId || new mongoose.Types.ObjectId().toString();
  const contextLabel = context.label || "forecast";
  const dataScope = context.dataScope || "user";
  const productId = context.productId || "unknown";
  const productName = context.productName || "";
  const ownerUserId = context.userId || "unknown";

  logger.info(`[ForecastRun:${runId}] Invoking Python script`, {
    label: contextLabel,
    dataScope,
    productId,
    productName,
    userId: ownerUserId,
    forecastPeriod,
    modelType,
    dataPoints: salesData.length,
  });

  const options = {
    mode: "text",
    pythonPath: "python",
    pythonOptions: ["-u"],
    scriptPath: "./scripts",
    args: [
      JSON.stringify(salesData),
      forecastPeriod,
      modelType,
      startDate,
      endDate,
    ],
  };

  let attempt = 0;
  while (attempt < maxRetries) {
    const attemptNumber = attempt + 1;
    logger.info(
      `[ForecastRun:${runId}] Python attempt ${attemptNumber} starting`
    );
    try {
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Python script timed out after 30 seconds"));
        }, 30000);

        const shell = new PythonShell("forecast.py", options);
        let output = "";
        let errorOutput = "";

        shell.on("message", (message) => {
          const trimmed = message.trim();
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            output = trimmed;
          } else if (trimmed) {
            logger.info(`[ForecastRun:${runId}] python> ${trimmed}`);
          }
        });

        shell.on("stderr", (stderr) => {
          errorOutput += stderr + "\n";
          const trimmed = stderr.trim();
          if (trimmed) {
            logger.error(`[ForecastRun:${runId}] python err> ${trimmed}`);
          }
        });

        shell.on("close", () => {
          clearTimeout(timeout);
          if (errorOutput) {
            try {
              const parsedError = JSON.parse(errorOutput);
              if (parsedError.error) {
                return reject(new Error(parsedError.error));
              }
            } catch {
              // Ignore non-JSON stderr unless it contains a valid error
            }
          }
          if (!output) {
            return reject(new Error("Empty response from Python script"));
          }
          try {
            const parsed = JSON.parse(output.trim());
            if (parsed.error) {
              return reject(new Error(parsed.error));
            }
            logger.info(`[ForecastRun:${runId}] Python completed`, {
              label: contextLabel,
              productId,
              dataScope,
              predictions: parsed.predictions?.length || 0,
            });
            resolve(parsed);
          } catch (parseErr) {
            reject(
              new Error(
                `Invalid output format: ${parseErr.message}, Output: ${output}`
              )
            );
          }
        });

        shell.on("error", (err) => {
          clearTimeout(timeout);
          logger.error(
            `[ForecastRun:${runId}] Python process error: ${err.message}`
          );
          reject(new Error(`Python error: ${err.message}`));
        });
      });
      return result;
    } catch (error) {
      attempt++;
      logger.warn(
        `[ForecastRun:${runId}] Python attempt ${attemptNumber} failed: ${error.message}`
      );
      if (attempt === maxRetries) {
        logger.error(
          `[ForecastRun:${runId}] All attempts failed: ${error.message}`
        );
        throw error;
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

const ensureObjectId = (value, fieldName = "id") => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return new mongoose.Types.ObjectId(value);
};

const aggregateProductSales = async ({
  userObjectId,
  productObjectId,
  historyStart,
  useGlobalSales = false,
}) => {
  const matchStage = {
    "items.productId": productObjectId,
  };

  if (!useGlobalSales) {
    matchStage.userId = userObjectId;
  }

  if (historyStart) {
    matchStage.date = { $gte: historyStart };
  }

  return Sale.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $match: {
        "items.productId": productObjectId,
      },
    },
    {
      $project: {
        date: "$date",
        quantity: "$items.quantity",
        price: "$items.price",
        promotion: { $ifNull: ["$items.promotion", false] },
      },
    },
    { $sort: { date: 1 } },
  ]);
};

const buildForecastDataset = (salesEntries = []) => {
  const dailyBuckets = salesEntries.reduce((acc, entry) => {
    const dateKey = new Date(entry.date).toISOString().split("T")[0];
    const quantity = Number(entry.quantity) || 0;
    const price = Number(entry.price) || 0;
    const revenue = quantity * price;

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        totalAmount: 0,
        promotion: false,
      };
    }
    acc[dateKey].totalAmount += revenue;
    acc[dateKey].promotion = acc[dateKey].promotion || !!entry.promotion;
    return acc;
  }, {});

  return Object.values(dailyBuckets).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

const calculateStdDev = (values = []) => {
  if (!values.length) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(Math.max(variance, 0));
};

const determineTrend = (values = []) => {
  if (!values || values.length < 3) return "Insufficient data";
  const half = Math.max(1, Math.floor(values.length / 2));
  const avg = (arr) =>
    arr.reduce((sum, val) => sum + val, 0) / (arr.length || 1);
  const earlyAvg = avg(values.slice(0, half));
  const lateAvg = avg(values.slice(-half));
  if (!earlyAvg) return "Insufficient data";
  const delta = (lateAvg - earlyAvg) / earlyAvg;
  if (delta > 0.05) return "Rising";
  if (delta < -0.05) return "Falling";
  return "Stable";
};

const monthsBetween = (start, end) => {
  if (!start || !end) return 1;
  const diff = end.getTime() - start.getTime();
  return Math.max(diff / (DAY_IN_MS * 30), 1);
};

const describeBehaviour = (frequency, repeatRate) => {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return "Insufficient data";
  }
  let label = "Regular buyers";
  if (frequency < 0.5) label = "Infrequent buyers";
  else if (frequency >= 2) label = "High-frequency buyers";

  if (repeatRate >= 0.6) {
    label += " (loyal)";
  } else if (repeatRate <= 0.2) {
    label += " (occasional)";
  }
  return label;
};

const computeInsights = (salesEntries = []) => {
  if (!salesEntries.length) {
    return {
      price: {
        average: 0,
        min: 0,
        max: 0,
        volatility: 0,
        trend: "Insufficient data",
      },
      demand: {
        totalUnits: 0,
        totalRevenue: 0,
        avgQuantityPerOrder: 0,
        avgPurchaseIntervalDays: 0,
        purchaseFrequencyPerMonth: 0,
        repeatPurchaseRate: 0,
        purchaseCount: 0,
        behaviourLabel: "Insufficient data",
      },
    };
  }

  const enriched = salesEntries.map((entry) => {
    const quantity = Number(entry.quantity) || 0;
    const price = Number(entry.price) || 0;
    return {
      date: new Date(entry.date),
      quantity,
      price,
      revenue: quantity * price,
    };
  });

  const totalUnits = enriched.reduce((sum, e) => sum + e.quantity, 0);
  const totalRevenue = enriched.reduce((sum, e) => sum + e.revenue, 0);
  const pricePoints = enriched
    .map((e) => e.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  const uniqueDates = Array.from(
    new Set(enriched.map((e) => e.date.toISOString().split("T")[0]))
  )
    .map((dateStr) => new Date(dateStr))
    .sort((a, b) => a - b);

  const intervals =
    uniqueDates.length > 1
      ? uniqueDates
          .slice(1)
          .map(
            (date, idx) =>
              (date.getTime() - uniqueDates[idx].getTime()) / DAY_IN_MS
          )
      : [];

  const avgPurchaseIntervalDays = intervals.length
    ? intervals.reduce((sum, val) => sum + val, 0) / intervals.length
    : 0;
  const purchaseFrequencyPerMonth =
    uniqueDates.length > 1
      ? uniqueDates.length /
        monthsBetween(uniqueDates[0], uniqueDates[uniqueDates.length - 1])
      : uniqueDates.length;
  const repeatPurchaseRate = intervals.length
    ? intervals.filter((gap) => gap <= 30).length / intervals.length
    : 0;
  const avgQuantityPerOrder = uniqueDates.length
    ? totalUnits / uniqueDates.length
    : totalUnits;

  return {
    price: {
      average: totalUnits ? totalRevenue / totalUnits : 0,
      min: pricePoints.length ? Math.min(...pricePoints) : 0,
      max: pricePoints.length ? Math.max(...pricePoints) : 0,
      volatility: calculateStdDev(pricePoints),
      trend: determineTrend(pricePoints),
    },
    demand: {
      totalUnits,
      totalRevenue,
      avgQuantityPerOrder,
      avgPurchaseIntervalDays,
      purchaseFrequencyPerMonth,
      repeatPurchaseRate,
      purchaseCount: uniqueDates.length,
      lastPurchaseDate: uniqueDates[uniqueDates.length - 1] || null,
      behaviourLabel: describeBehaviour(
        purchaseFrequencyPerMonth,
        repeatPurchaseRate
      ),
    },
  };
};

const prepareForecastContext = async ({
  userId,
  productId,
  startDate,
  useGlobalSales = false,
}) => {
  const productObjectId = ensureObjectId(productId, "productId");
  const userObjectId = useGlobalSales
    ? null
    : ensureObjectId(userId, "userId");
  const product = await Product.findById(productObjectId).lean();
  if (!product) {
    throw new Error("Product not found");
  }

  const historyStart = startDate
    ? new Date(
        startDate.getFullYear() - 1,
        startDate.getMonth(),
        startDate.getDate()
      )
    : new Date(new Date().setFullYear(new Date().getFullYear() - 1));

  const rawSales = await aggregateProductSales({
    userObjectId,
    productObjectId,
    historyStart,
    useGlobalSales,
  });

  if (rawSales.length < MIN_SALES_RECORDS) {
    throw new Error(
      "At least 10 sales records are required for this product forecast"
    );
  }

  const salesData = buildForecastDataset(rawSales);
  if (salesData.length < MIN_SALES_RECORDS) {
    throw new Error(
      "Not enough distinct sales dates to build a reliable forecast"
    );
  }

  const insights = computeInsights(rawSales);
  return { product, salesData, insights };
};

const clamp = (value, min, max) => {
  if (Number.isFinite(min) && value < min) return min;
  if (Number.isFinite(max) && value > max) return max;
  return value;
};

const generateForecast = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    forecastPeriod,
    modelType,
    startDate,
    endDate,
    productId,
    useGlobalSales: useGlobalSalesInput,
  } = req.body;
  const useGlobalSales = parseBoolean(useGlobalSalesInput);
  const dataScope = useGlobalSales ? "global" : "user";

  try {
    if (!productId) {
      logger.error("Missing productId");
      return res.status(400).json({ error: "productId is required" });
    }

    if (useGlobalSales && !GLOBAL_DATA_ROLES.has(req.user.role)) {
      logger.warn(
        `User ${req.user.id} attempted global forecast without permission`
      );
      return res.status(403).json({
        error: "Global forecasts are restricted to Admin/Owner accounts",
      });
    }

    if (!startDate || !endDate) {
      logger.error("Missing startDate or endDate");
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }
    if (!["Daily", "Weekly", "Monthly"].includes(forecastPeriod)) {
      logger.error(`Invalid forecastPeriod: ${forecastPeriod}`);
      return res.status(400).json({ error: "Invalid forecast period" });
    }
    if (!["ARIMA", "RandomForest"].includes(modelType)) {
      logger.error(`Invalid modelType: ${modelType}`);
      return res.status(400).json({ error: "Invalid model type" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      logger.error(
        `Invalid date format: startDate=${startDate}, endDate=${endDate}`
      );
      return res.status(400).json({ error: "Invalid date format" });
    }
    if (start >= end) {
      logger.error("startDate is not before endDate");
      return res
        .status(400)
        .json({ error: "startDate must be before endDate" });
    }

    logger.info("Forecast request received", {
      userId: req.user.id,
      productId,
      forecastPeriod,
      modelType,
      dataScope,
    });

    const { product, salesData, insights } = await prepareForecastContext({
      userId: req.user.id,
      productId,
      startDate: start,
      useGlobalSales,
    });

    logger.info("Sales dataset prepared", {
      productId: product._id,
      productName: product.name,
      dataPoints: salesData.length,
      dataScope,
    });

    const result = await executePythonScript(
      salesData,
      forecastPeriod,
      modelType,
      startDate,
      endDate,
      3,
      {
        label: "single",
        productId: product._id.toString(),
        productName: product.name,
        dataScope,
        userId: req.user.id,
      }
    );

    if (!Array.isArray(result.predictions) || result.predictions.length === 0) {
      logger.error("Python script returned empty or invalid predictions");
      return res.status(500).json({ error: "Invalid forecast predictions" });
    }

    logger.info("Python predictions generated", {
      productId: product._id,
      productName: product.name,
      dataScope,
      predictions: result.predictions.length,
      metrics: result.metrics,
    });

    const formattedPredictions = result.predictions.map((pred) => {
      const predDate = new Date(pred.date);
      if (isNaN(predDate.getTime())) {
        throw new Error(`Invalid prediction date: ${pred.date}`);
      }
      const predictedSales = Number(pred.predictedSales) || 0;
      return {
        date: predDate,
        predictedSales,
        confidenceLevel: Number(pred.confidenceLevel) || 0,
        confidenceUpper: Number(pred.confidenceUpper) || predictedSales * 1.1,
        confidenceLower: Number(pred.confidenceLower) || predictedSales * 0.9,
      };
    });

    const forecast = new Forecast({
      userId: req.user.id,
      dataScope,
      product: {
        productId: product._id,
        name: product.name,
        category: product.category || "Uncategorized",
      },
      insights,
      predictions: formattedPredictions,
      forecastPeriod,
      modelType,
      startDate: start,
      endDate: end,
      features: {
        seasonality: result.features?.seasonality || "None",
        promotion: !!result.features?.promotion,
        laggedSales: Number(result.features?.laggedSales) || 0,
        economicTrend: result.features?.economicTrend || "Stable",
      },
      metrics: {
        rmse: Number(result.metrics?.rmse) || 0,
        mae: Number(result.metrics?.mae) || 0,
        mape: Number(result.metrics?.mape) || 0,
      },
      alert: {
        isActive: (Number(result.metrics?.mape) || 0) > 20,
        message:
          (Number(result.metrics?.mape) || 0) > 20
            ? "High prediction error"
            : "",
      },
    });

    await forecast.save();
    logger.info(
      `Forecast generated: ${forecast._id} for product ${product.name} (scope: ${dataScope})`
    );
    res.status(201).json(forecast);
  } catch (error) {
    logger.error(`Forecast generation failed: ${error.message}`);
    res
      .status(500)
      .json({ error: `Failed to generate forecast: ${error.message}` });
  }
};

const generateBatchForecasts = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    forecastPeriod,
    modelType,
    startDate,
    endDate,
    scope = "all",
    category,
  } = req.body;

  try {
    logger.info("Batch forecast request received", {
      userId: req.user.id,
      scope,
      category,
      forecastPeriod,
      modelType,
    });

    if (!startDate || !endDate) {
      logger.error("Missing startDate or endDate for batch forecast");
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }
    if (!["Daily", "Weekly", "Monthly"].includes(forecastPeriod)) {
      logger.error(`Invalid batch forecastPeriod: ${forecastPeriod}`);
      return res.status(400).json({ error: "Invalid forecast period" });
    }
    if (!["ARIMA", "RandomForest"].includes(modelType)) {
      logger.error(`Invalid batch modelType: ${modelType}`);
      return res.status(400).json({ error: "Invalid model type" });
    }
    if (!["all", "category"].includes(scope)) {
      logger.error(`Invalid batch scope: ${scope}`);
      return res.status(400).json({ error: "Invalid scope" });
    }
    if (scope === "category" && !category) {
      logger.error("Missing category for category batch forecast");
      return res
        .status(400)
        .json({ error: "category is required when scope is 'category'" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      logger.error(
        `Invalid batch date format: startDate=${startDate}, endDate=${endDate}`
      );
      return res.status(400).json({ error: "Invalid date format" });
    }
    if (start >= end) {
      logger.error("Batch startDate is not before endDate");
      return res
        .status(400)
        .json({ error: "startDate must be before endDate" });
    }

    const productQuery = {};
    if (scope === "category") {
      productQuery.category = category;
    }

    const products = await Product.find(productQuery).lean();
    if (!products.length) {
      return res.status(404).json({ error: "No products found for forecast" });
    }

    const createdForecasts = [];
    const failures = [];

    for (const product of products) {
      try {
        const { salesData, insights } = await prepareForecastContext({
          userId: req.user.id,
          productId: product._id.toString(),
          startDate: start,
        });

        logger.info("Batch dataset prepared", {
          productId: product._id,
          productName: product.name,
          dataPoints: salesData.length,
          scope,
        });

        const result = await executePythonScript(
          salesData,
          forecastPeriod,
          modelType,
          startDate,
          endDate,
          3,
          {
            label: "batch",
            productId: product._id.toString(),
            productName: product.name,
            dataScope: "user",
            userId: req.user.id,
          }
        );

        if (
          !Array.isArray(result.predictions) ||
          result.predictions.length === 0
        ) {
          throw new Error("Python script returned empty or invalid predictions");
        }

        const formattedPredictions = result.predictions.map((pred) => {
          const predDate = new Date(pred.date);
          if (isNaN(predDate.getTime())) {
            throw new Error(`Invalid prediction date: ${pred.date}`);
          }
          const predictedSales = Number(pred.predictedSales) || 0;
          return {
            date: predDate,
            predictedSales,
            confidenceLevel: Number(pred.confidenceLevel) || 0,
            confidenceUpper:
              Number(pred.confidenceUpper) || predictedSales * 1.1,
            confidenceLower:
              Number(pred.confidenceLower) || predictedSales * 0.9,
          };
        });

        const forecast = new Forecast({
          userId: req.user.id,
          dataScope: "user",
          product: {
            productId: product._id,
            name: product.name,
            category: product.category || "Uncategorized",
          },
          insights,
          predictions: formattedPredictions,
          forecastPeriod,
          modelType,
          startDate: start,
          endDate: end,
          features: {
            seasonality: result.features?.seasonality || "None",
            promotion: !!result.features?.promotion,
            laggedSales: Number(result.features?.laggedSales) || 0,
            economicTrend: result.features?.economicTrend || "Stable",
          },
          metrics: {
            rmse: Number(result.metrics?.rmse) || 0,
            mae: Number(result.metrics?.mae) || 0,
            mape: Number(result.metrics?.mape) || 0,
          },
          alert: {
            isActive: (Number(result.metrics?.mape) || 0) > 20,
            message:
              (Number(result.metrics?.mape) || 0) > 20
                ? "High prediction error"
                : "",
          },
        });

        await forecast.save();
        logger.info("Batch forecast saved", {
          forecastId: forecast._id,
          productId: product._id,
          productName: product.name,
        });
        createdForecasts.push(forecast);
      } catch (err) {
        logger.warn(
          `Batch forecast failed for product ${product._id}: ${err.message}`
        );
        failures.push({
          productId: product._id,
          name: product.name,
          category: product.category || "Uncategorized",
          error: err.message,
        });
      }
    }

    logger.info(
      `Batch forecast completed. Success: ${createdForecasts.length}, Failures: ${failures.length}`
    );

    res.status(201).json({
      scope,
      category: scope === "category" ? category : undefined,
      totalProducts: products.length,
      successfulForecasts: createdForecasts.length,
      failures,
      forecasts: createdForecasts,
    });
  } catch (error) {
    logger.error(`Batch forecast generation failed: ${error.message}`);
    res
      .status(500)
      .json({ error: `Failed to generate batch forecasts: ${error.message}` });
  }
};
const listForecasts = async (req, res) => {
  try {
    const { forecastPeriod, productId, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };
    if (forecastPeriod) {
      if (!["Daily", "Weekly", "Monthly"].includes(forecastPeriod)) {
        logger.error(`Invalid forecastPeriod: ${forecastPeriod}`);
        return res.status(400).json({ error: "Invalid forecast period" });
      }
      query.forecastPeriod = forecastPeriod;
    }

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.error(`Invalid productId: ${productId}`);
        return res.status(400).json({ error: "Invalid productId" });
      }
      query["product.productId"] = new mongoose.Types.ObjectId(productId);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      logger.error(`Invalid page or limit: page=${page}, limit=${limit}`);
      return res.status(400).json({ error: "Invalid page or limit" });
    }
    const skip = (pageNum - 1) * limitNum;

    const [forecasts, total] = await Promise.all([
      Forecast.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Forecast.countDocuments(query),
    ]);

    logger.info(`Forecasts found: ${forecasts.length}, Total: ${total}`);
    res.json({
      forecasts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error(`List forecasts error: ${error.message}`);
    res
      .status(500)
      .json({ error: `Failed to list forecasts: ${error.message}` });
  }
};

const updateForecastSettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { features } = req.body;

  try {
    const forecasts = await Forecast.find({ userId: req.user.id });
    if (!forecasts.length) {
      logger.error(`No forecasts found for user: ${req.user.id}`);
      return res.status(404).json({ error: "No forecasts found" });
    }

    // Validate features
    const validFeatures = [
      "seasonality",
      "promotion",
      "laggedSales",
      "economicTrend",
    ];
    const invalidFeatures = Object.keys(features || {}).filter(
      (key) => !validFeatures.includes(key)
    );
    if (invalidFeatures.length) {
      logger.error(`Invalid feature keys: ${invalidFeatures.join(", ")}`);
      return res
        .status(400)
        .json({ error: `Invalid feature keys: ${invalidFeatures.join(", ")}` });
    }

    // Update forecasts
    await Forecast.updateMany(
      { userId: req.user.id },
      { $set: { features: { ...forecasts[0].features, ...features } } }
    );

    logger.info(`Forecast settings updated for user: ${req.user.id}`);
    res.json({ message: "Forecast settings updated" });
  } catch (error) {
    logger.error(`Update forecast settings error: ${error.message}`);
    res
      .status(500)
      .json({ error: `Failed to update settings: ${error.message}` });
  }
};

const retrainForecast = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    forecastPeriod = "Monthly",
    modelType = "RandomForest",
    startDate,
    endDate,
    productId,
    useGlobalSales: useGlobalSalesInput,
  } = req.body;
  const useGlobalSales = parseBoolean(useGlobalSalesInput);
  const dataScope = useGlobalSales ? "global" : "user";

  try {
    if (!productId) {
      logger.error("Missing productId");
      return res.status(400).json({ error: "productId is required" });
    }

    if (!startDate || !endDate) {
      logger.error("Missing startDate or endDate");
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }
    if (!["Daily", "Weekly", "Monthly"].includes(forecastPeriod)) {
      logger.error(`Invalid forecastPeriod: ${forecastPeriod}`);
      return res.status(400).json({ error: "Invalid forecast period" });
    }
    if (!["ARIMA", "RandomForest"].includes(modelType)) {
      logger.error(`Invalid modelType: ${modelType}`);
      return res.status(400).json({ error: "Invalid model type" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      logger.error(
        `Invalid date format: startDate=${startDate}, endDate=${endDate}`
      );
      return res.status(400).json({ error: "Invalid date format" });
    }
    if (start >= end) {
      logger.error("startDate is not before endDate");
      return res
        .status(400)
        .json({ error: "startDate must be before endDate" });
    }

    logger.info("Retrain forecast request received", {
      userId: req.user.id,
      productId,
      forecastPeriod,
      modelType,
      dataScope,
    });

    const { product, salesData, insights } = await prepareForecastContext({
      userId: req.user.id,
      productId,
      startDate: start,
      useGlobalSales,
    });

    logger.info("Retrain dataset prepared", {
      productId: product._id,
      productName: product.name,
      dataPoints: salesData.length,
      dataScope,
    });

    const result = await executePythonScript(
      salesData,
      forecastPeriod,
      modelType,
      startDate,
      endDate,
      3,
      {
        label: "retrain",
        productId: product._id.toString(),
        productName: product.name,
        dataScope,
        userId: req.user.id,
      }
    );

    if (!Array.isArray(result.predictions) || result.predictions.length === 0) {
      logger.error("Python script returned empty or invalid predictions");
      return res.status(500).json({ error: "Invalid forecast predictions" });
    }

    const formattedPredictions = result.predictions.map((pred) => {
      const predDate = new Date(pred.date);
      if (isNaN(predDate.getTime())) {
        throw new Error(`Invalid prediction date: ${pred.date}`);
      }
      const predictedSales = Number(pred.predictedSales) || 0;
      return {
        date: predDate,
        predictedSales,
        confidenceLevel: Number(pred.confidenceLevel) || 0,
        confidenceUpper: Number(pred.confidenceUpper) || predictedSales * 1.1,
        confidenceLower: Number(pred.confidenceLower) || predictedSales * 0.9,
      };
    });

    const forecast = new Forecast({
      userId: req.user.id,
      dataScope,
      product: {
        productId: product._id,
        name: product.name,
        category: product.category || "Uncategorized",
      },
      insights,
      predictions: formattedPredictions,
      forecastPeriod,
      modelType,
      startDate: start,
      endDate: end,
      features: {
        seasonality: result.features?.seasonality || "None",
        promotion: !!result.features?.promotion,
        laggedSales: Number(result.features?.laggedSales) || 0,
        economicTrend: result.features?.economicTrend || "Stable",
      },
      metrics: {
        rmse: Number(result.metrics?.rmse) || 0,
        mae: Number(result.metrics?.mae) || 0,
        mape: Number(result.metrics?.mape) || 0,
      },
      alert: {
        isActive: (Number(result.metrics?.mape) || 0) > 20,
        message:
          (Number(result.metrics?.mape) || 0) > 20
            ? "High prediction error"
            : "",
      },
    });

    await forecast.save();
    logger.info(
      `Forecast retrained: ${forecast._id} for product ${product.name} (scope: ${dataScope})`
    );
    res.status(201).json(forecast);
  } catch (error) {
    logger.error(`Retrain forecast error: ${error.message}`);
    res
      .status(500)
      .json({ error: `Failed to retrain forecast: ${error.message}` });
  }
};

const predictPrice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { productId, initialCost, profitMargin } = req.body;

  try {
    const productObjectId = ensureObjectId(productId, "productId");
    const cost = Number(initialCost);
    const margin = Number(profitMargin);

    if (!Number.isFinite(cost) || cost <= 0) {
      return res
        .status(400)
        .json({ error: "initialCost must be a positive number" });
    }
    if (!Number.isFinite(margin) || margin < 0) {
      return res
        .status(400)
        .json({ error: "profitMargin must be zero or a positive number" });
    }

    const forecast = await Forecast.findOne({
      userId: req.user.id,
      "product.productId": productObjectId,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!forecast) {
      return res
        .status(404)
        .json({ error: "No forecast found for the selected product" });
    }

    if (!forecast.predictions?.length) {
      return res
        .status(400)
        .json({ error: "Forecast does not contain prediction data" });
    }

    const avgForecastDemand =
      forecast.predictions.reduce(
        (sum, pred) => sum + (Number(pred.predictedSales) || 0),
        0
      ) / forecast.predictions.length;

    const demandInsights = forecast.insights?.demand || {};
    const historicalAvgUnits =
      demandInsights.purchaseCount > 0
        ? (demandInsights.totalUnits || 0) / demandInsights.purchaseCount
        : avgForecastDemand || 1;

    const demandRatio =
      historicalAvgUnits > 0 ? avgForecastDemand / historicalAvgUnits : 1;

    const basePrice = cost * (1 + margin / 100);
    const adjustmentRatio = clamp(1 + (demandRatio - 1) * 0.5, 0.8, 1.2);
    const rawRecommendation = basePrice * adjustmentRatio;

    const priceInsights = forecast.insights?.price || {};
    const minBand = priceInsights.min
      ? Math.max(priceInsights.min * 0.95, cost * 1.01)
      : cost * 1.05;
    const maxBand = priceInsights.max
      ? priceInsights.max * 1.1
      : rawRecommendation * 1.2;

    const recommendedPrice = clamp(rawRecommendation, minBand, maxBand);

    res.json({
      product: forecast.product,
      recommendedPrice,
      priceBand: { min: minBand, max: maxBand },
      expectedMarginPerUnit: recommendedPrice - cost,
      inputs: {
        initialCost: cost,
        profitMargin: margin,
        demandRatio,
      },
      reference: {
        avgForecastDemand,
        historicalAvgUnits,
        priceInsights,
        demandInsights,
      },
    });
  } catch (error) {
    logger.error(`Price prediction error: ${error.message}`);
    res
      .status(500)
      .json({ error: `Failed to predict price: ${error.message}` });
  }
};

module.exports = {
  generateForecast,
  generateBatchForecasts,
  listForecasts,
  updateForecastSettings,
  retrainForecast,
  predictPrice,
};
