const { validationResult } = require("express-validator");
const Forecast = require("../models/Forecast");
const Sale = require("../models/Sale");
const { PythonShell } = require("python-shell");

const retrainForecast = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { modelType } = req.body;

  try {
    const sales = await Sale.find().sort({ date: 1 });
    if (sales.length < 10) {
      return res
        .status(400)
        .json({ error: "Insufficient sales data for retraining" });
    }

    const options = {
      mode: "text",
      pythonOptions: ["-u"],
      args: [JSON.stringify(sales), "Monthly", modelType], // Default to Monthly
    };

    PythonShell.run("scripts/forecast.py", options, async (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Retraining error" });
      }

      const forecastData = JSON.parse(results[0]);
      const forecast = new Forecast({
        predictedSales: forecastData.predictedSales,
        confidenceLevel: forecastData.confidenceLevel,
        forecastPeriod: "Monthly",
        modelType,
        features: {
          seasonality: forecastData.seasonality,
          promotion: forecastData.promotion,
          laggedSales: forecastData.laggedSales,
          economicTrend: forecastData.economicTrend,
        },
        metrics: {
          rmse: forecastData.rmse,
          mae: forecastData.mae,
          mape: forecastData.mape,
        },
        alert: {
          isActive: forecastData.mape > 20,
          message: forecastData.mape > 20 ? "High prediction error" : "",
        },
      });

      await forecast.save();
      res.status(201).json({ message: "Model retrained", forecast });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const updateForecastSettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { seasonality, promotion, economicTrend } = req.body;

  try {
    // Update default features for future forecasts (mock implementation)
    res.json({
      message: "Forecast settings updated",
      settings: { seasonality, promotion, economicTrend },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { retrainForecast, updateForecastSettings };
