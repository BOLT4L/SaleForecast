const express = require("express");
const router = express.Router();
const {
  retrainForecast,
  updateForecastSettings,
} = require("../controllers/forecastAdminController");
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

router.post(
  "/retrain",
  [
    auth,
    role("Admin"),
    check("modelType", "Valid model type is required").isIn([
      "ARIMA",
      "RandomForest",
    ]),
  ],
  retrainForecast
);

router.post(
  "/settings",
  [
    auth,
    role(["Admin"]),
    check("seasonality", "Valid seasonality is required").isIn([
      "Timkat",
      "Meskel",
      "Weekday",
      "Weekend",
      "None",
    ]),
    check("promotion", "Promotion must be a boolean").isBoolean(),
    check("economicTrend", "Valid economic trend is required").isIn([
      "Stable",
      "Inflation",
      "Recession",
    ]),
  ],
  updateForecastSettings
);

module.exports = router;
