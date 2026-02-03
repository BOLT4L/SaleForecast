const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      default: "free",
    },
    status: {
      type: String,
      enum: ["trial", "active", "expired", "canceled", "past_due"],
      default: "trial",
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    chapaTxRef: {
      type: String,
    },
    chapaPaymentStatus: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);


