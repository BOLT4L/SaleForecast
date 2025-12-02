const fs = require("fs");
const csv = require("fast-csv");
const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");
const XLSX = require("xlsx");
const { parseStringPromise } = require("xml2js");

const createSale = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(`Validation errors: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!["Manager", "Admin", "Owner"].includes(req.user.role)) {
      logger.error(`Access denied for user ${req.user.id}`);
      return res.status(403).json({ error: "Access denied" });
    }

    if (mongoose.connection.readyState !== 1) {
      logger.error("MongoDB not connected");
      return res.status(500).json({ error: "Database connection error" });
    }

    const { date, totalAmount, items, promotion } = req.body;

    const saleData = {
      userId: req.user.id,
      date: new Date(date),
      totalAmount: parseFloat(totalAmount),
      items: items.map((item) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        promotion: !!item.promotion,
      })),
      promotion: !!promotion,
    };

    const sale = new Sale(saleData);
    await sale.save();

    // Populate productId to include name, matching frontend expectations
    const populatedSale = await Sale.findById(sale._id)
      .populate("items.productId", "name")
      .lean();

    logger.info(`Sale created: ${sale._id} by user ${req.user.id}`);
    res.status(201).json(populatedSale);
  } catch (error) {
    logger.error(`Create sale error: ${error.message}`);
    res.status(500).json({ error: error.message || "Failed to create sale" });
  }
};



// -------------------------------
//  Detect & Parse File
// -------------------------------
const parseUploadedFile = async (filePath, originalName) => {
  const ext = originalName.split(".").pop().toLowerCase();

  if (ext === "csv") return parseCSV(filePath);
  if (ext === "xls" || ext === "xlsx") return parseExcel(filePath);
  if (ext === "xml") return parseXML(filePath);

  throw new Error(`Unsupported file type: .${ext}`);
};

// -------------------------------
//  Parse CSV
// -------------------------------
const parseCSV = async (filePath) => {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true, trim: true }))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
};

// -------------------------------
//  Parse Excel
// -------------------------------
const parseExcel = async (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
};

// -------------------------------
//  Parse XML
// -------------------------------
const parseXML = async (filePath) => {
  const xml = fs.readFileSync(filePath, "utf8");
  const json = await parseStringPromise(xml);

  // Assumes XML shape <sales><record>...</record></sales>
  return json.sales?.record || [];
};

// -------------------------------
//  Normalize Rows -> Required Shape
// -------------------------------
const normalizeRows = (rows) => {
  return rows.map((row) => ({
    date: row.date,
    total_amount: parseFloat(row.total_amount || row.totalAmount || row.amount),
    items: normalizeItems(row.items),
  }));
};

// Normalize items field
const normalizeItems = (raw) => {
  if (!raw) return [];

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("Invalid items JSON structure");
    }
  }

  return raw;
};

// -------------------------------
//  Map product names → productId
// -------------------------------
const mapProducts = async (rows) => {
  const missing = new Set();

  for (const row of rows) {
    for (const item of row.items) {
      if (!item.productId) {
        const product = await Product.findOne({
          name: item.name?.trim(),
        });

        if (!product) {
          missing.add(item.name);
        } else {
          item.productId = product._id.toString();
        }
      }
    }
  }

  if (missing.size > 0) {
    return {
      error: "MISSING_PRODUCTS",
      missing: [...missing],
    };
  }

  return { rows };
};

// -------------------------------
//  Main uploadSales Handler
// -------------------------------
const uploadSales = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    // Step 1: Parse file
    const parsedRows = await parseUploadedFile(
      req.file.path,
      req.file.originalname
    );
    

    // Step 2: Normalize
    const normalized = normalizeRows(parsedRows);

    // Step 3: Map products
    const mapped = await mapProducts(normalized);

    if (mapped.error === "MISSING_PRODUCTS") {
      return res.status(400).json(mapped);
    }

    // Step 4: Save sales to DB
    const salesToInsert = mapped.rows.map((row) => ({
      userId: req.user.id,
      date: new Date(row.date),
      totalAmount: parseFloat(row.total_amount),
      items: row.items.map((i) => ({
        productId: i.productId,
        quantity: parseInt(i.quantity),
        price: parseFloat(i.price),
        promotion: !!i.promotion,
      })),
      promotion: row.items.some((i) => i.promotion),
    }));

    await Sale.insertMany(salesToInsert);

    fs.unlinkSync(filePath);
    return res.status(201).json({
      message: "Sales uploaded successfully",
      count: salesToInsert.length,
    });
  } catch (err) {
    logger.error("Upload error: " + err.message);

    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }

    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadSales,
};


const getSales = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      promotion,
      minAmount,
      maxAmount,
      productId,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { userId: req.user.id };

    // DATE FILTER (supports start only, end only, or both)
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // PROMOTION FILTER (apply only if sent)
    if (promotion === "true") query.promotion = true;
    if (promotion === "false") query.promotion = false;

    // AMOUNT FILTER (works for 0)
    if (minAmount != null || maxAmount != null) {
      query.totalAmount = {};
      if (minAmount != null) query.totalAmount.$gte = Number(minAmount);
      if (maxAmount != null) query.totalAmount.$lte = Number(maxAmount);
    }

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.error(`Invalid productId filter: ${productId}`);
        return res.status(400).json({ error: "Invalid productId" });
      }
      query["items.productId"] = new mongoose.Types.ObjectId(productId);
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate("items.productId", "name")
        .sort({ date: -1, _id: -1 })   // <-- IMPORTANT FIX
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Sale.countDocuments(query),
    ]);
    
    res.json({
      sales,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
    console.log("QUERY RECEIVED:", req.query);
console.log("PAGE RECEIVED:", page);
console.log("LIMIT RECEIVED:", limit);



  } catch (error) {
    logger.error(`Get sales error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate(
      "items.productId",
      "name"
    );
    if (!sale || sale.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: "Sale not found" });
    }
    res.json(sale);
  } catch (error) {
    logger.error(`Get sale error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const updateSale = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale || sale.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const { date, totalAmount, items, promotion } = req.body;

    if (date) sale.date = new Date(date);
    if (totalAmount !== undefined) sale.totalAmount = parseFloat(totalAmount);
    if (promotion !== undefined) sale.promotion = !!promotion;
    if (items) {
      sale.items = items.map((item) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        promotion: !!item.promotion,
      }));
    }

    await sale.save();
    logger.info(`Sale updated: ${sale._id}`);
    res.json(sale);
  } catch (error) {
    logger.error(`Update sale error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale || sale.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: "Sale not found" });
    }

    await sale.deleteOne();
    logger.info(`Sale deleted: ${sale._id}`);
    res.json({ message: "Sale deleted" });
  } catch (error) {
    logger.error(`Delete sale error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  uploadSales,
  getSales,
  getSale,
  updateSale,
  createSale,
  deleteSale,
};
