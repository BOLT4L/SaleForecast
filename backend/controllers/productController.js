const { validationResult } = require("express-validator");
const Product = require("../models/Product");
const logger = require("../utils/logger");
const { sendEmail } = require("../utils/email");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const fs = require("fs");
const stream = require("stream");

const getProducts = async (req, res) => {
  const { search, category } = req.query;
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  if (category) {
    query.category = category;
  }

  try {
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    logger.error(`Get products error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const getLowStock = async (req, res) => {
  try {
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;
    const products = await Product.find({
      stockQuantity: { $lt: threshold },
    }).sort({ stockQuantity: 1 });
    res.json({ products });
  } catch (error) {
    logger.error(`Get low stock error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const product = new Product({
      ...req.body,
      lastRestocked: new Date(),
    });
    await product.save();
    logger.info(`Product created: ${product._id}`);
    res.status(201).json(product);
  } catch (error) {
    logger.error(`Create product error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    Object.assign(product, req.body);
    if (req.body.stockQuantity !== undefined) {
      product.lastRestocked = new Date();
    }
    await product.save();

    if (
      req.body.stockQuantity !== undefined &&
      process.env.ADMIN_EMAIL &&
      product.stockQuantity > product.lowStockThreshold
    ) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "Product Restocked",
        text: `Product ${product.name} restocked. New quantity: ${product.stockQuantity}`,
      });
    }

    logger.info(`Product updated: ${product._id}`);
    res.json(product);
  } catch (error) {
    logger.error(`Update product error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await product.deleteOne();
    logger.info(`Product deleted: ${product._id}`);
    res.json({ message: "Product deleted" });
  } catch (error) {
    logger.error(`Delete product error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const updateInventorySettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { lowStockThreshold, reorderQuantity, category } = req.body;
  const updateFields = {};
  if (lowStockThreshold !== undefined)
    updateFields.lowStockThreshold = lowStockThreshold;
  if (reorderQuantity !== undefined)
    updateFields.reorderQuantity = reorderQuantity;

  try {
    const query = category ? { category } : {};
    const result = await Product.updateMany(query, { $set: updateFields });
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "No products found for update" });
    }
    logger.info(
      `Inventory settings updated for ${result.modifiedCount} products`
    );
    res.json({
      message: "Inventory settings updated",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error(`Update inventory settings error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const bulkImportProducts = async (req, res) => {
  console.log("bulkImportProducts received file:", req.file);
  if (!req.file) {
    console.log("No file received, headers:", req.headers);
    return res.status(400).json({ error: "No CSV file uploaded" });
  }

  if (req.file.mimetype !== "text/csv") {
    return res.status(400).json({ error: "File must be a CSV" });
  }

  try {
    const products = [];
    const errors = [];
    let rowIndex = 0;
    const expectedHeaders = [
      "name",
      "price",
      "stockQuantity",
      "category",
      "description",
      "lowStockThreshold",
      "reorderQuantity",
    ];

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    let headersChecked = false;

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on("headers", (headers) => {
          // Validate CSV headers
          const missingHeaders = expectedHeaders.filter(
            (h) => !headers.includes(h)
          );
          if (
            missingHeaders.includes("name") ||
            missingHeaders.includes("price") ||
            missingHeaders.includes("stockQuantity")
          ) {
            errors.push(
              "Missing required headers: " + missingHeaders.join(", ")
            );
            reject(new Error("Invalid CSV headers"));
          }
          headersChecked = true;
        })
        .on("data", (row) => {
          rowIndex++;
          try {
            const product = {
              name: row.name?.trim(),
              price: parseFloat(row.price),
              stockQuantity: parseInt(row.stockQuantity),
              category: row.category?.trim() || undefined,
              description: row.description?.trim() || undefined,
              lowStockThreshold: row.lowStockThreshold
                ? parseInt(row.lowStockThreshold)
                : 10,
              reorderQuantity: row.reorderQuantity
                ? parseInt(row.reorderQuantity)
                : 50,
              lastRestocked: new Date(),
            };

            // Validate required fields
            if (!product.name) {
              errors.push(`Row ${rowIndex}: Missing name`);
              return;
            }
            if (isNaN(product.price) || product.price < 0) {
              errors.push(`Row ${rowIndex}: Invalid price`);
              return;
            }
            if (isNaN(product.stockQuantity) || product.stockQuantity < 0) {
              errors.push(`Row ${rowIndex}: Invalid stock quantity`);
              return;
            }
            if (
              !isNaN(product.lowStockThreshold) &&
              product.lowStockThreshold < 0
            ) {
              errors.push(`Row ${rowIndex}: Invalid low stock threshold`);
              return;
            }
            if (
              !isNaN(product.reorderQuantity) &&
              product.reorderQuantity < 0
            ) {
              errors.push(`Row ${rowIndex}: Invalid reorder quantity`);
              return;
            }

            products.push(product);
          } catch (err) {
            errors.push(`Row ${rowIndex}: Invalid data format`);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (products.length === 0) {
      return res.status(400).json({ error: "No valid products found in CSV" });
    }

    const operations = products.map((product) => ({
      updateOne: {
        filter: { name: product.name },
        update: {
          $set: product,
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(operations);
    logger.info(
      `Bulk imported ${result.upsertedCount} new and updated ${result.modifiedCount} products`
    );

    res.status(201).json({
      message: "Products imported successfully",
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      errors,
    });
  } catch (error) {
    logger.error(`Bulk import products error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const exportProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    if (!products.length) {
      return res.status(404).json({ error: "No products found" });
    }

    const fields = [
      "name",
      "price",
      "stockQuantity",
      "category",
      "description",
      "lowStockThreshold",
      "reorderQuantity",
    ];
    const parser = new Parser({ fields });
    const csvData = parser.parse(products);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=products_export_${Date.now()}.csv`
    );
    res.send(csvData);
  } catch (error) {
    logger.error(`Export products error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getProducts,
  getLowStock,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventorySettings,
  bulkImportProducts,
  exportProducts,
};
