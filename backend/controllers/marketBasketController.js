const { validationResult } = require("express-validator");
const { PythonShell } = require("python-shell");
const Sale = require("../models/Sale");
const MarketBasket = require("../models/MarketBasket");
const logger = require("../utils/logger");

const generateMarketBasket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    startDate,
    endDate,
    minSupport = 0.01,
    minConfidence = 0.5,
  } = req.body;

  try {
    const sales = await Sale.find({
      userId: req.user.id,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).lean();

    if (sales.length < 10) {
      return res
        .status(400)
        .json({ error: "Insufficient sales data for analysis" });
    }

    const options = {
      mode: "text",
      pythonPath: "python",
      scriptPath: "./scripts",
      args: [JSON.stringify(sales), minSupport, minConfidence],
    };

    const result = await new Promise((resolve, reject) => {
      const shell = new PythonShell("marketBasket.py", options);
      let output = "";
      let errorOutput = "";

      shell.on("message", (message) => {
        if (message.trim().startsWith("{") && message.trim().endsWith("}")) {
          output = message;
        }
      });

      shell.on("stderr", (stderr) => {
        errorOutput += stderr + "\n";
      });

      shell.on("close", () => {
        if (errorOutput.includes('{"error":')) {
          try {
            const parsedError = JSON.parse(errorOutput.match(/{.*}/)[0]);
            return reject(new Error(parsedError.error));
          } catch (e) {
            logger.error(`Market Basket stderr: ${errorOutput}`);
          }
        }
        if (!output) {
          return reject(new Error("No valid output from Python script"));
        }
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error(`Invalid JSON output: ${e.message}`));
        }
      });

      shell.on("error", (err) => {
        reject(new Error(`Python execution error: ${err.message}`));
      });
    });

    const marketBasket = new MarketBasket({
      userId: req.user.id,
      analysisDate: new Date(),
      dateRange: { startDate: new Date(startDate), endDate: new Date(endDate) },
      minSupport,
      minConfidence,
      itemsets: result.itemsets,
      rules: result.rules,
    });

    await marketBasket.save();
    logger.info(`Market Basket Analysis generated: ${marketBasket._id}`);
    res.status(201).json(marketBasket);
  } catch (error) {
    logger.error(`Generate market basket error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

const getMarketBaskets = async (req, res) => {
  try {
    const analyses = await MarketBasket.find({ userId: req.user.id })
      .populate("itemsets.items", "name")
      .populate("rules.antecedents", "name")
      .populate("rules.consequents", "name")
      .sort({ analysisDate: -1 })
      .limit(50);
    res.json(analyses);
  } catch (error) {
    logger.error(`Get market baskets error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { generateMarketBasket, getMarketBaskets };
