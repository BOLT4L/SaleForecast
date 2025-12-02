const express = require("express");
const router = express.Router();
const {
  updateInventorySettings,
} = require("../controllers/productAdminController");
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

router.post(
  "/settings",
  [
    auth,
    role("Admin"),
    check("productId", "Valid product ID is required").isMongoId(),
    check(
      "lowStockThreshold",
      "Low stock threshold must be non-negative"
    ).isInt({ min: 0 }),
    check("reorderQuantity", "Reorder quantity must be non-negative").isInt({
      min: 0,
    }),
  ],
  updateInventorySettings
);

module.exports = router;
