const express = require("express");
const router = express.Router();
const multer = require("multer");
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const saleController = require("../controllers/saleController");

const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * /api/sales/upload:
 *   post:
 *     summary: Upload sales data via file
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Sales data uploaded successfully }
 *       400: { description: Invalid file or data }
 *       403: { description: Unauthorized access }
 */
router.post(
  "/upload",
  auth,
  role("Manager", "Owner", "Admin"),
  upload.single("file"),
  saleController.uploadSales
);

router.post("/", auth, saleController.createSale);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Retrieve all sales
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of sales retrieved successfully }
 *       403: { description: Unauthorized access }
 */
router.get("/", auth, saleController.getSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Retrieve a sale by ID
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ID of the sale
 *     responses:
 *       200: { description: Sale retrieved successfully }
 *       400: { description: Invalid sale ID }
 *       403: { description: Unauthorized access }
 */
router.get("/:id", auth, saleController.getSale);

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: Update a sale by ID
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ID of the sale
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalAmount: { type: number, minimum: 0 }
 *               date: { type: string, format: date }
 *     responses:
 *       200: { description: Sale updated successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access }
 */
router.put(
  "/:id",
  auth,
  role("Manager", "Admin", "Owner"),
  [
    check("totalAmount", "Valid total amount is required")
      .optional()
      .isFloat({ min: 0 }),
    check("date", "Valid date is required").optional().isISO8601(),
  ],
  saleController.updateSale
);

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: Delete a sale by ID
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ID of the sale
 *     responses:
 *       200: { description: Sale deleted successfully }
 *       400: { description: Invalid sale ID }
 *       403: { description: Unauthorized access }
 */
router.delete(
  "/:id",
  auth,
  role("Manager", "Admin", "Owner"),
  saleController.deleteSale
);

module.exports = router;
