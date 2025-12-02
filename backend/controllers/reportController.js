const { validationResult } = require("express-validator");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Forecast = require("../models/Forecast");
const Product = require("../models/Product");
const Report = require("../models/Report");
const logger = require("../utils/logger");

// Helper: Add a styled table to PDF with page break handling
function addTableToPDF(doc, headers, rows, title, options = {}) {
  const {
    startX = 50,
    startY = doc.y,
    colWidths = [],
    rowHeight = 20,
    cellPadding = 5,
    reportType,
    startDate,
    endDate,
  } = options;

  const headerBgColor = "#4A90E2";
  const alternateRowColor = "#F5F5F5";
  const borderColor = "#000000";
  const textColor = "#333333";
  const pageHeight = doc.page.height - doc.page.margins.bottom;

  const calculatedWidths = colWidths.length
    ? colWidths
    : headers.map(() => (doc.page.width - 2 * startX) / headers.length);

  // Draw title
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(textColor)
    .text(title, startX, startY, { underline: true });
  doc.moveDown(0.5);

  let y = doc.y;
  logger.info(`Starting table '${title}' at y=${y}`);

  // Helper to draw table headers
  function drawHeaders() {
    doc.font("Helvetica-Bold").fontSize(10);
    headers.forEach((header, i) => {
      doc
        .fillColor(headerBgColor)
        .rect(
          startX + calculatedWidths.slice(0, i).reduce((a, b) => a + b, 0),
          y,
          calculatedWidths[i],
          rowHeight
        )
        .fill();
      doc
        .fillColor("#FFFFFF")
        .text(
          header,
          startX +
            calculatedWidths.slice(0, i).reduce((a, b) => a + b, 0) +
            cellPadding,
          y + cellPadding,
          {
            width: calculatedWidths[i] - 2 * cellPadding,
            align: "left",
            ellipsis: true,
          }
        );
      doc
        .strokeColor(borderColor)
        .rect(
          startX + calculatedWidths.slice(0, i).reduce((a, b) => a + b, 0),
          y,
          calculatedWidths[i],
          rowHeight
        )
        .stroke();
    });
    y += rowHeight;
  }

  // Draw initial headers
  drawHeaders();

  // Draw rows
  doc.font("Helvetica").fontSize(10);
  rows.forEach((row, rowIndex) => {
    // Check if row will fit on the current page (header + one row height)
    if (y + rowHeight > pageHeight - 20) {
      doc.addPage();
      y = doc.page.margins.top;
      addHeaderFooter(doc, reportType, startDate, endDate);
      y = 100;
      logger.info(
        `Added new page for table '${title}' at row ${rowIndex}, y=${y}`
      );
      drawHeaders();
    }

    const fillColor = rowIndex % 2 === 0 ? alternateRowColor : "#FFFFFF";
    row.forEach((cell, colIndex) => {
      doc
        .fillColor(fillColor)
        .rect(
          startX +
            calculatedWidths.slice(0, colIndex).reduce((a, b) => a + b, 0),
          y,
          calculatedWidths[colIndex],
          rowHeight
        )
        .fill();
      doc
        .fillColor(textColor)
        .text(
          cell.toString(),
          startX +
            calculatedWidths.slice(0, colIndex).reduce((a, b) => a + b, 0) +
            cellPadding,
          y + cellPadding,
          {
            width: calculatedWidths[colIndex] - 2 * cellPadding,
            align: "left",
            ellipsis: true,
          }
        );
      doc
        .strokeColor(borderColor)
        .rect(
          startX +
            calculatedWidths.slice(0, colIndex).reduce((a, b) => a + b, 0),
          y,
          calculatedWidths[colIndex],
          rowHeight
        )
        .stroke();
    });
    y += rowHeight;
  });

  doc.y = y + 5; // Reduced spacing after table
  logger.info(`Finished table '${title}' at y=${doc.y}`);
}

// Helper: Add header and footer
function addHeaderFooter(doc, reportType, startDate, endDate) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#4A90E2")
    .text(`${reportType} Report`, 50, 30, { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#333333")
    .text(`Date Range: ${startDate} to ${endDate}`, 50, 50, {
      align: "center",
    });
  doc
    .moveTo(50, 70)
    .lineTo(pageWidth - 50, 70)
    .stroke();

  doc.font("Helvetica").fontSize(8).fillColor("#666666");
  doc.text(
    `Generated on: ${new Date().toLocaleDateString()}`,
    50,
    pageHeight - 50,
    { align: "left" }
  );
  doc.text(`Page ${doc.page.number}`, pageWidth - 100, pageHeight - 50, {
    align: "right",
  });
}

const generateReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { reportType, format, startDate, endDate } = req.body;

  if (reportType === "Performance" && req.user.role !== "Admin") {
    logger.info(`Checking role: ${req.user.role}`);
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    let data;
    let fields;
    let reportData = {};

    switch (reportType) {
      case "Sales":
        if (!mongoose.isValidObjectId(req.user.id)) {
          logger.error(`Invalid user ID: ${req.user.id}`);
          return res.status(400).json({ error: "Invalid user ID" });
        }

        data = await Sale.find({
          userId: req.user.id,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }).populate("items.productId", "name");

        logger.info(`Sales data retrieved: ${data.length} records`);

        const validSales = data.filter(
          (sale) =>
            typeof sale.totalAmount === "number" && !isNaN(sale.totalAmount)
        );
        if (data.length !== validSales.length) {
          logger.warn(
            `Found ${
              data.length - validSales.length
            } sales with invalid totalAmount`
          );
        }

        reportData = {
          totalSales: validSales.length
            ? validSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
            : 0,
          averageSale: validSales.length
            ? validSales.reduce((sum, sale) => sum + sale.totalAmount, 0) /
              validSales.length
            : 0,
          topProducts: await Sale.aggregate([
            {
              $match: {
                userId: req.user.id,
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
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
            { $unwind: "$product" },
            {
              $project: {
                productId: "$_id",
                productName: "$product.name",
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
                userId: req.user.id,
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
              },
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                sales: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", sales: 1, _id: 0 } },
          ]),
        };
        logger.info(
          `Report data prepared: totalSales=${reportData.totalSales}, averageSale=${reportData.averageSale}`
        );
        break;
      case "Forecast":
        data = await Forecast.find({
          userId: req.user.id,
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });
        fields = [
          "predictedSales",
          "confidenceLevel",
          "forecastPeriod",
          "metrics.rmse",
          "alert",
        ];
        break;
      case "Inventory":
        data = await Product.find({}).select(
          "name stockQuantity category lastRestocked"
        );
        fields = ["name", "stockQuantity", "category", "lastRestocked"];
        break;
      case "Performance":
        data = await Forecast.find({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }).select("metrics modelType forecastPeriod");
        fields = [
          "modelType",
          "forecastPeriod",
          "metrics.rmse",
          "metrics.mae",
          "metrics.mape",
        ];
        break;
      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    if (!data.length && reportType !== "Sales") {
      return res.status(400).json({ error: "No data for the selected range" });
    }

    const filename = `${reportType}_${Date.now()}.${format}`;
    const filePath = path.join(__dirname, "../reports", filename);

    if (format === "csv") {
      try {
        const parser = new Parser({ fields });
        const csv = parser.parse(data);
        await fs.writeFile(filePath, csv);
      } catch (parseError) {
        logger.error(`CSV parsing error: ${parseError.message}`);
        throw parseError;
      }
    } else if (format === "pdf") {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = require("fs").createWriteStream(filePath);
      doc.pipe(stream);

      addHeaderFooter(doc, reportType, startDate, endDate);

      doc.y = 100;

      if (reportType === "Sales") {
        doc.font("Helvetica-Bold").fontSize(12).fillColor("#333333");
        doc.text(
          `Total Sales: $${(typeof reportData.totalSales === "number"
            ? reportData.totalSales
            : 0
          ).toFixed(2)}`,
          50
        );
        doc.text(
          `Average Sale: $${(typeof reportData.averageSale === "number"
            ? reportData.averageSale
            : 0
          ).toFixed(2)}`,
          50
        );
        doc.moveDown(1); // Reduced spacing

        // Check space before each table
        const pageHeight = doc.page.height - doc.page.margins.bottom;
        const minTableHeight = 60; // Title + header + at least one row

        if (doc.y + minTableHeight > pageHeight) {
          doc.addPage();
          addHeaderFooter(doc, reportType, startDate, endDate);
          doc.y = 100;
          logger.info(`Added new page before Top Products table, y=${doc.y}`);
        }
        addTableToPDF(
          doc,
          ["Product Name", "Quantity Sold", "Total Sales ($)"],
          reportData.topProducts.map((p) => [
            p.productName || "Unknown",
            p.quantity.toString(),
            (typeof p.totalSales === "number" ? p.totalSales : 0).toFixed(2),
          ]),
          "Top Products",
          { colWidths: [200, 100, 100], reportType, startDate, endDate }
        );

        if (doc.y + minTableHeight > pageHeight) {
          doc.addPage();
          addHeaderFooter(doc, reportType, startDate, endDate);
          doc.y = 100;
          logger.info(`Added new page before Sales by Day table, y=${doc.y}`);
        }
        addTableToPDF(
          doc,
          ["Date", "Sales ($)"],
          reportData.salesByDay.map((d) => [
            d.date,
            (typeof d.sales === "number" ? d.sales : 0).toFixed(2),
          ]),
          "Sales by Day",
          { colWidths: [200, 100], reportType, startDate, endDate }
        );

        if (doc.y + minTableHeight > pageHeight) {
          doc.addPage();
          addHeaderFooter(doc, reportType, startDate, endDate);
          doc.y = 100;
          logger.info(`Added new page before Detailed Sales table, y=${doc.y}`);
        }
        const salesRows = [];
        data.forEach((sale) => {
          sale.items.forEach((item) => {
            salesRows.push([
              new Date(sale.date).toLocaleDateString(),
              item.productId ? item.productId.name : "Unknown",
              item.quantity.toString(),
              (typeof item.price === "number" ? item.price : 0).toFixed(2),
              (typeof item.quantity === "number" &&
              typeof item.price === "number"
                ? item.quantity * item.price
                : 0
              ).toFixed(2),
            ]);
          });
        });
        addTableToPDF(
          doc,
          ["Date", "Product Name", "Quantity", "Price ($)", "Total ($)"],
          salesRows,
          "Detailed Sales",
          { colWidths: [100, 150, 80, 80, 80], reportType, startDate, endDate }
        );
      } else {
        const rows = data.map((item) =>
          fields.map((key) => {
            const value = key
              .split(".")
              .reduce((acc, part) => acc && acc[part], item);
            return value !== null && value !== undefined
              ? value.toString()
              : "";
          })
        );
        if (doc.y + 60 > pageHeight) {
          doc.addPage();
          addHeaderFooter(doc, reportType, startDate, endDate);
          doc.y = 100;
          logger.info(
            `Added new page before ${reportType} Data table, y=${doc.y}`
          );
        }
        addTableToPDF(doc, fields, rows, `${reportType} Data`, {
          colWidths: fields.map(() => (doc.page.width - 100) / fields.length),
          reportType,
          startDate,
          endDate,
        });
      }

      doc.end();
      await new Promise((resolve) => stream.on("finish", resolve));
    }

    const report = new Report({
      userId: req.user.id,
      reportType,
      format,
      filePath: `/reports/${filename}`,
      dateRange: { startDate, endDate },
    });

    await report.save();
    logger.info(`Report generated: ${report._id}`);
    res.status(201).json({
      report,
      downloadLink: report.filePath,
      data: reportType === "Sales" ? reportData : undefined,
    });
  } catch (error) {
    logger.error(`Generate report error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const getReports = async (req, res) => {
  const { reportType } = req.query;
  const query = { userId: req.user.id };
  if (reportType) {
    query.reportType = reportType;
  }

  try {
    const reports = await Report.find(query);
    res.json(reports);
  } catch (error) {
    logger.error(`Get reports error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const downloadReport = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: "Invalid report ID" });
  }

  try {
    const report = await Report.findById(id);
    if (!report || report.userId.toString() !== req.user.id) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(404)
        .json({ error: "Report not found or access denied" });
    }

    if (!report.filePath || typeof report.filePath !== "string") {
      logger.error(`Invalid or missing filePath for report ID: ${id}`);
      res.setHeader("Content-Type", "application/json");
      return res
        .status(400)
        .json({ error: "Report file path is invalid or missing" });
    }

    const filePath = path.join(
      __dirname,
      "..",
      report.filePath.replace(/^\/+/, "")
    );
    try {
      await fs.access(filePath);
      res.setHeader(
        "Content-Type",
        report.format === "csv" ? "text/csv" : "application/pdf"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${path.basename(report.filePath)}`
      );
      res.sendFile(filePath, (err) => {
        if (err) {
          logger.error(`File send error for report ID ${id}: ${err.message}`);
          res.setHeader("Content-Type", "application/json");
          res.status(500).json({ error: "Failed to send report file" });
        }
      });
    } catch (fileError) {
      logger.error(
        `File access error for report ID ${id}: ${fileError.message}`
      );
      res.setHeader("Content-Type", "application/json");
      return res.status(404).json({ error: "Report file not found" });
    }
  } catch (error) {
    logger.error(`Download report error: ${error.message}`);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { generateReport, getReports, downloadReport };
