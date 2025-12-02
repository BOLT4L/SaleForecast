const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const productController = require("../controllers/productController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve all products
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: search
 *         name: string
 *         description: Search products by name
 *       - in: category
 *         name: string
 *         description: Filter products by category
 *     responses:
 *       200: { description: List of products retrieved successfully }
 *       403: { description: Unauthorized access }
 */
router.get("/", auth, productController.getProducts);

/**
 * @swagger
 * /api/products/lowStock:
 *   get:
 *     summary: Retrieve low stock products
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of low stock products retrieved successfully }
 *       403: { description: Unauthorized access }
 */
router.get("/lowStock", auth, productController.getLowStock);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number, minimum: 0 }
 *               stockQuantity: { type: integer, minimum: 0 }
 *               category: { type: string }
 *               description: { type: string }
 *               lowStockThreshold: { type: integer, minimum: 0 }
 *               reorderQuantity: { type: integer, minimum: 0 }
 *     responses:
 *       201: { description: Product created successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access }
 */
router.post(
  "/",
  auth,
  role("Manager"),
  [
    check("name", "Name is required").not().isEmpty(),
    check("price", "Valid price is required").isFloat({ min: 0 }),
    check("stockQuantity", "Valid quantity is required").isInt({ min: 0 }),
    check("lowStockThreshold", "Valid threshold is required")
      .optional()
      .isInt({ min: 0 }),
    check("reorderQuantity", "Valid quantity is required")
      .optional()
      .isInt({ min: 0 }),
    check("category", "Valid category is required").optional().isString(),
    check("description", "Valid description is required").optional().isString(),
  ],
  productController.createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ID of the product
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number, minimum: 0 }
 *               stockQuantity: { type: integer, minimum: 0 }
 *               category: { type: string }
 *               description: { type: string }
 *               lowStockThreshold: { type: integer, minimum: 0 }
 *               reorderQuantity: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: Product updated successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access }
 */
router.put(
  "/:id",
  auth,
  role("Manager", "Planner"),
  [
    check("name", "Name is required").optional().not().isEmpty(),
    check("price", "Valid price is required").optional().isFloat({ min: 0 }),
    check("stockQuantity", "Valid quantity is required")
      .optional()
      .isInt({ min: 0 }),
    check("lowStockThreshold", "Valid threshold is required")
      .optional()
      .isInt({ min: 0 }),
    check("reorderQuantity", "Valid quantity is required")
      .optional()
      .isInt({ min: 0 }),
    check("category", "Valid category is required").optional().isString(),
    check("description", "Valid description is required").optional().isString(),
  ],
  productController.updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ID of the product
 *     responses:
 *       200: { description: Product deleted successfully }
 *       403: { description: Unauthorized access }
 */
router.delete("/:id", auth, role("Manager"), productController.deleteProduct);

/**
 * @swagger
 * /api/products/updateSettings:
 *   put:
 *     summary: Update inventory settings
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lowStockThreshold: { type: integer, minimum: 0 }
 *               reorderQuantity: { type: integer, minimum: 0 }
 *               category: { type: string }
 *     responses:
 *       200: { description: Inventory settings updated successfully }
 *       400: { description: Validation error }
 *       403: { description: Unauthorized access }
 */
router.put(
  "/updateSettings",
  auth,
  role("Admin"),
  [
    check("lowStockThreshold", "Valid threshold is required")
      .optional()
      .isInt({ min: 0 }),
    check("reorderQuantity", "Valid quantity is required")
      .optional()
      .isInt({ min: 0 }),
    check("category", "Valid category is required").optional().isString(),
  ],
  productController.updateInventorySettings
);

/**
 * @swagger
 * /api/products/bulk-import:
 *   post:
 *     summary: Bulk import products from CSV
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing product data
 *     responses:
 *       201: { description: Products imported successfully }
 *       400: { description: Invalid CSV file or data }
 *       403: { description: Unauthorized access }
 */
router.post(
  "/bulk-import",
  auth,
  role("Manager"),
  upload.single("file"),
  productController.bulkImportProducts
);

/**
 * @swagger
 * /api/products/export:
 *   get:
 *     summary: Export all products as CSV
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: CSV file downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       404: { description: No products found }
 *       403: { description: Unauthorized access }
 */
router.get("/export", auth, productController.exportProducts);

module.exports = router;
