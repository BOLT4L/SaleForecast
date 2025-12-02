const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const marketBasketController = require("../controllers/marketBasketController");

/**
 * @swagger
 * /api/marketbasket:
 *   post:
 *     summary: Generate market basket analysis
 *     tags: [MarketBasket]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               minSupport: { type: number, minimum: 0, maximum: 1, default: 0.01 }
 *               minConfidence: { type: number, minimum: 0, maximum: 1, default: 0.5 }
 *             required: [startDate, endDate]
 *     responses:
 *       201: { description: Analysis generated }
 *       400: { description: Insufficient data or invalid input }
 */
router.post(
  "/",
  auth,
  role("Manager", "Admin"),
  [
    check("startDate", "Valid start date is required").isISO8601(),
    check("endDate", "Valid end date is required").isISO8601(),
    check("minSupport", "Minimum support must be between 0 and 1")
      .optional()
      .isFloat({ min: 0, max: 1 }),
    check("minConfidence", "Minimum confidence must be between 0 and 1")
      .optional()
      .isFloat({ min: 0, max: 1 }),
  ],
  marketBasketController.generateMarketBasket
);

/**
 * @swagger
 * /api/marketbasket:
 *   get:
 *     summary: List market basket analyses
 *     tags: [MarketBasket]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Analyses list }
 */
router.get("/", auth, marketBasketController.getMarketBaskets);

module.exports = router;
