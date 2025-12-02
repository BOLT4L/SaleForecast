const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dataScope: {
      type: String,
      enum: ["user", "global"],
      default: "user",
    },
    product: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      category: {
        type: String,
        default: "Uncategorized",
        trim: true,
      },
    },
    predictions: [
      {
        date: {
          type: Date,
          required: true,
        },
        predictedSales: {
          type: Number,
          required: true,
          min: 0,
        },
        confidenceLevel: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        confidenceUpper: {
          type: Number,
          required: true,
          min: 0,
        },
        confidenceLower: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    forecastPeriod: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
      required: true,
    },
    modelType: {
      type: String,
      enum: ["ARIMA", "RandomForest"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    features: {
      seasonality: {
        type: String,
        default: "None",
      },
      promotion: {
        type: Boolean,
        default: false,
      },
      laggedSales: {
        type: Number,
        default: 0,
        min: 0,
      },
      economicTrend: {
        type: String,
        default: "Stable",
      },
    },
    metrics: {
      rmse: { type: Number, default: 0, min: 0 },
      mae: { type: Number, default: 0, min: 0 },
      mape: { type: Number, default: 0, min: 0 },
    },
    alert: {
      isActive: { type: Boolean, default: false },
      message: { type: String, default: "" },
    },
    insights: {
      price: {
        average: { type: Number, default: 0, min: 0 },
        min: { type: Number, default: 0, min: 0 },
        max: { type: Number, default: 0, min: 0 },
        volatility: { type: Number, default: 0, min: 0 },
        trend: {
          type: String,
          enum: ["Rising", "Falling", "Stable", "Insufficient data"],
          default: "Insufficient data",
        },
      },
      demand: {
        totalUnits: { type: Number, default: 0, min: 0 },
        totalRevenue: { type: Number, default: 0, min: 0 },
        avgQuantityPerOrder: { type: Number, default: 0, min: 0 },
        avgPurchaseIntervalDays: { type: Number, default: 0, min: 0 },
        purchaseFrequencyPerMonth: { type: Number, default: 0, min: 0 },
        repeatPurchaseRate: { type: Number, default: 0, min: 0 },
        purchaseCount: { type: Number, default: 0, min: 0 },
        lastPurchaseDate: { type: Date },
        behaviourLabel: {
          type: String,
          default: "Insufficient data",
        },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Forecast", forecastSchema);
