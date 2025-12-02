const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const reportController = require("../controllers/reportController");
const mongoose = require("mongoose");
const Report = require("../models/Report");
const Sale = require("../models/Sale");
const logger = require("../utils/logger");

/**
 * @swagger
 * /api/reports/generate:
 *   post:
 *     summary: Generate a new report
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType: { type: string, enum: ['Sales', 'Forecast', 'Inventory', 'Performance'] }
 *               format: { type: string, enum: ['csv', 'pdf'] }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       201: { description: Report generated successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access (requires Manager, Planner, or Owner role; Performance requires Admin or Owner) }
 */
router.post(
  "/generate",
  auth,
  role("Manager", "Planner", "Owner"),
  [
    check("reportType", "Valid report type is required").isIn([
      "Sales",
      "Forecast",
      "Inventory",
      "Performance",
    ]),
    check("format", "Valid format is required").isIn(["csv", "pdf"]),
    check("startDate", "Valid start date is required").isISO8601().toDate(),
    check("endDate", "Valid end date is required").isISO8601().toDate(),
    body().custom(({ startDate, endDate }) => {
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error("Start date must be before end date");
      }
      return true;
    }),
  ],
  reportController.generateReport
);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Retrieve all reports for the authenticated user
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: reportType
 *         schema: { type: string, enum: ['Sales', 'Forecast', 'Inventory', 'Performance'] }
 *         description: Filter reports by type
 *     responses:
 *       200: { description: List of reports retrieved successfully }
 *       403: { description: Unauthorized access }
 */
router.get("/", auth, reportController.getReports);

/**
 * @swagger
 * /api/reports/download/{id}:
 *   get:
 *     summary: Download a report by ID
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ID of the report
 *     responses:
 *       200: { description: Report downloaded successfully }
 *       400: { description: Invalid report ID }
 *       404: { description: Report not found or access denied }
 */
router.get(
  "/download/:id",
  auth,
  [check("id", "Valid report ID is required").isMongoId()],
  reportController.downloadReport
);

/**
 * @swagger
 * /api/reports/details/{id}:
 *   get:
 *     summary: Retrieve detailed data for a report by ID
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ID of the report
 *     responses:
 *       200:
 *         description: Report details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
 *                   type: object
 *                   properties:
 *                     _id: { type: string, description: Report ID }
 *                     userId: { type: string, description: User ID }
 *                     reportType: { type: string, enum: ['Sales', 'Forecast', 'Inventory', 'Performance'] }
 *                     format: { type: string, enum: ['csv', 'pdf'] }
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         startDate: { type: string, format: date }
 *                         endDate: { type: string, format: date }
 *                     filePath: { type: string, description: Path to the report file }
 *                     createdAt: { type: string, format: date-time }
 *                 downloadLink: { type: string, description: URL to download the report }
 *                 data:
 *                   type: object
 *                   description: Sales report data (only for Sales reports)
 *                   properties:
 *                     totalSales:
 *                       type: object
 *                       properties:
 *                         totalSales: { type: number, description: Total sales amount }
 *                         averageSale: { type: number, description: Average sale amount }
 *                     topProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId: { type: string, description: Product ID }
 *                           productName: { type: string, description: Product name }
 *                           totalSales: { type: number, description: Total sales for the product }
 *                           quantity: { type: number, description: Total quantity sold }
 *                     salesByDay:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date: { type: string, description: Date in YYYY-MM-DD format }
 *                           sales: { type: number, description: Total sales for the day }
 *       400:
 *         description: Invalid report ID or date range
 *       404:
 *         description: Report not found or access denied
 *       500:
 *         description: Server error
 */
router.get(
  "/details/:id",
  auth,
  [check("id", "Valid report ID is required").isMongoId()],
  async (req, res) => {
    const { id } = req.params;

    try {
      const report = await Report.findById(id);
      if (!report || report.userId.toString() !== req.user.id) {
        logger.warn(
          `Report not found or access denied for ID: ${id}, user: ${req.user.id}`
        );
        return res
          .status(404)
          .json({ error: "Report not found or access denied" });
      }

      if (report.reportType !== "Sales") {
        return res.status(200).json({
          report,
          downloadLink: `/api/reports/download/${report._id}`,
        });
      }

      const start = new Date(report.dateRange.startDate);
      const end = new Date(report.dateRange.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        logger.error(`Invalid date range for report ID: ${id}`);
        return res.status(400).json({ error: "Invalid date range in report" });
      }

      const reportData = {
        totalSales: await Sale.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(req.user.id),
              date: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              totalSales: { $ifNull: ["$totalSales", 0] },
              averageSale: {
                $cond: [
                  { $eq: ["$count", 0] },
                  0,
                  { $divide: ["$totalSales", "$count"] },
                ],
              },
              _id: 0,
            },
          },
        ]).then((result) => ({
          totalSales: result[0]?.totalSales || 0,
          averageSale: result[0]?.averageSale || 0,
        })),
        topProducts: await Sale.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(req.user.id),
              date: { $gte: start, $lte: end },
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              totalSales: {
                $sum: { $multiply: ["$items.quantity", "$items.price"] },
              },
              quantity: { $sum: "$items.quantity" },
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              productId: "$_id",
              productName: {
                $ifNull: ["$product.name", "Unknown Product"],
              },
              totalSales: 1,
              quantity: 1,
            },
          },
          { $sort: { totalSales: -1 } },
          { $limit: 5 },
        ]),
        salesByDay: await Sale.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(req.user.id),
              date: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              sales: { $sum: "$totalAmount" },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { date: "$_id", _id: 0, sales: 1 } },
        ]),
      };

      return res.status(200).json({
        report,
        downloadLink: `/api/reports/download/${id}`,
        data: reportData,
      });
    } catch (error) {
      logger.error(`Get report details error: ${error.message}`, error);
      res.status(500).json({ error: "Failed to fetch report details" });
    }
  }
);

module.exports = router;
