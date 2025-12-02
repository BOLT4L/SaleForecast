const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const forecastController = require("../controllers/forecastController");

/**
 * @swagger
 * /api/forecasts/generate:
 *   post:
 *     summary: Generate a new forecast
 *     tags: [Forecasts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forecastPeriod: { type: string, enum: ['Daily', 'Weekly', 'Monthly'] }
 *               modelType: { type: string, enum: ['ARIMA', 'RandomForest'] }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       201: { description: Forecast generated successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access }
 */
router.post(
  "/generate",
  auth,
  role("Manager", "Admin", "Owner"),
  [
    check("productId", "Valid product is required").isMongoId(),
    check("forecastPeriod", "Valid period is required").isIn([
      "Daily",
      "Weekly",
      "Monthly",
    ]),
    check("modelType", "Valid model is required").isIn([
      "ARIMA",
      "RandomForest",
    ]),
    check("startDate", "Valid start date is required").isISO8601(),
    check("endDate", "Valid end date is required").isISO8601(),
    check("useGlobalSales", "useGlobalSales must be boolean")
      .optional()
      .isBoolean(),
  ],
  forecastController.generateForecast
);

/**
 * @swagger
 * /api/forecasts/generate/batch:
 *   post:
 *     summary: Generate forecasts for all products or by category
 *     tags: [Forecasts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forecastPeriod: { type: string, enum: ['Daily', 'Weekly', 'Monthly'] }
 *               modelType: { type: string, enum: ['ARIMA', 'RandomForest'] }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               scope:
 *                 type: string
 *                 enum: [all, category]
 *                 description: "all = all products, category = filter by product category"
 *               category:
 *                 type: string
 *                 description: "Required when scope is 'category'"
 *     responses:
 *       201: { description: Batch forecasts generated successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access }
 */
router.post(
  "/generate/batch",
  auth,
  role("Manager", "Admin", "Owner"),
  [
    check("forecastPeriod", "Valid period is required").isIn([
      "Daily",
      "Weekly",
      "Monthly",
    ]),
    check("modelType", "Valid model is required").isIn([
      "ARIMA",
      "RandomForest",
    ]),
    check("startDate", "Valid start date is required").isISO8601(),
    check("endDate", "Valid end date is required").isISO8601(),
    check("scope", "Scope must be 'all' or 'category'")
      .optional()
      .isIn(["all", "category"]),
    check("category", "Category is required when scope is 'category'")
      .optional()
      .isString(),
  ],
  forecastController.generateBatchForecasts
);

/**
 * @swagger
 * /api/forecasts:
 *   get:
 *     summary: Retrieve all forecasts
 *     tags: [Forecasts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of forecasts retrieved successfully }
 *       403: { description: Unauthorized access }
 */
router.get(
  "/",
  auth,
  role("Manager", "Admin", "Owner"),
  forecastController.listForecasts
);

/**
 * @swagger
 * /api/forecasts/updateSettings:
 *   put:
 *     summary: Update forecast settings
 *     tags: [Forecasts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               features:
 *                 type: object
 *                 properties:
 *                   seasonality: { type: string }
 *                   economicTrend: { type: string }
 *     responses:
 *       200: { description: Forecast settings updated successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access }
 */
router.put(
  "/updateSettings",
  auth,
  role("Admin", "Owner"),
  [
    check("features.seasonality", "Valid seasonality is required")
      .optional()
      .notEmpty(),
    check("features.economicTrend", "Valid trend is required")
      .optional()
      .notEmpty(),
  ],
  forecastController.updateForecastSettings
);

/**
 * @swagger
 * /api/forecasts/retrain:
 *   post:
 *     summary: Retrain a forecast model
 *     tags: [Forecasts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forecastPeriod: { type: string, enum: ['Daily', 'Weekly', 'Monthly'] }
 *               modelType: { type: string, enum: ['ARIMA', 'RandomForest'] }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       200: { description: Forecast model retrained successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access }
 */
router.post(
  "/retrain",
  auth,
  role("Admin", "Owner"),
  [
    check("productId", "Valid product is required").isMongoId(),
    check("forecastPeriod", "Valid period is required")
      .optional()
      .isIn(["Daily", "Weekly", "Monthly"]),
    check("modelType", "Valid model is required")
      .optional()
      .isIn(["ARIMA", "RandomForest"]),
    check("startDate", "Valid start date is required").isISO8601(),
    check("endDate", "Valid end date is required").isISO8601(),
    check("useGlobalSales", "useGlobalSales must be boolean")
      .optional()
      .isBoolean(),
  ],
  forecastController.retrainForecast
);

/**
 * @swagger
 * /api/forecasts/predict-price:
 *   post:
 *     summary: Recommend a selling price for a product
 *     tags: [Forecasts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *               initialCost: { type: number }
 *               profitMargin: { type: number }
 *     responses:
 *       200: { description: Price recommendation generated }
 *       400: { description: Validation error }
 *       404: { description: Forecast not found }
 */
router.post(
  "/predict-price",
  auth,
  role("Manager", "Admin", "Owner"),
  [
    check("productId", "Valid product is required").isMongoId(),
    check("initialCost", "initialCost must be greater than 0").isFloat({
      gt: 0,
    }),
    check("profitMargin", "profitMargin must be zero or positive").isFloat({
      min: 0,
    }),
  ],
  forecastController.predictPrice
);

module.exports = router;
