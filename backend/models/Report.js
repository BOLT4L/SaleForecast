const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["Sales", "Forecast", "Inventory", "Performance"],
      required: true,
    },
    format: {
      type: String,
      enum: ["csv", "pdf"],
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
