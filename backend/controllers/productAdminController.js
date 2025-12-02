const { validationResult } = require("express-validator");
const Product = require("../models/Product");

const updateInventorySettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { productId, lowStockThreshold, reorderQuantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.lowStockThreshold = lowStockThreshold;
    product.reorderQuantity = reorderQuantity;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { updateInventorySettings };
