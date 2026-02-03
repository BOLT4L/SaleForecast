const axios = require("axios");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const logger = require("../utils/logger");

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || "https://api.chapa.co";

if (!CHAPA_SECRET_KEY) {
  logger.warn(
    "CHAPA_SECRET_KEY is not set. Chapa payment integration will not work until it is configured."
  );
}

const getCurrentSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
    }).lean();

    return res.json(subscription || null);
  } catch (error) {
    logger.error(`Failed to get subscription for user ${req.user.id}: ${error.message}`);
    return res.status(500).json({ error: "Failed to fetch subscription" });
  }
};

const createCheckoutSession = async (req, res) => {
  if (!CHAPA_SECRET_KEY) {
    return res.status(500).json({
      error: "Payment provider is not configured. Please contact support.",
    });
  }

  const { plan = "premium" } = req.body || {};

  // Simple fixed pricing for now; adjust amounts/plans as needed
  const amount = plan === "premium" ? 10 : 5; // Example amounts
  const currency = "ETB";

  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const txRef = `sub_${req.user.id}_${Date.now()}`;

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const callbackUrl = `${baseUrl}/api/subscription/webhook/${txRef}`;
    const returnUrl = `${frontendUrl}/settings?tab=payment&tx_ref=${txRef}`;

    const chapaResponse = await axios.post(
      `${CHAPA_BASE_URL}/v1/transaction/initialize`,
      {
        amount,
        currency,
        email: user.email,
        first_name: user.username,
        last_name: "",
        tx_ref: txRef,
        callback_url: callbackUrl,
        return_url: returnUrl,
        customization: {
          title: "Subscription Payment",
          description: `${plan} plan subscription`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      }
    );

    const data = chapaResponse.data;

    if (!data?.data?.checkout_url) {
      logger.error("Unexpected Chapa initialize response:", data);
      return res.status(500).json({ error: "Failed to initialize payment" });
    }

    await Subscription.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          plan,
          chapaTxRef: txRef,
          chapaPaymentStatus: "initialized",
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      checkoutUrl: data.data.checkout_url,
      txRef,
    });
  } catch (error) {
    logger.error(
      `Failed to initialize Chapa payment for user ${req.user.id}: ${error.message}`
    );
    return res.status(500).json({
      error: "Failed to start payment. Please try again.",
    });
  }
};

const verifyPayment = async (req, res) => {
  if (!CHAPA_SECRET_KEY) {
    return res.status(500).json({
      error: "Payment provider is not configured. Please contact support.",
    });
  }

  const { txRef } = req.params;

  try {
    const chapaResponse = await axios.get(
      `${CHAPA_BASE_URL}/v1/transaction/verify/${txRef}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      }
    );

    const data = chapaResponse.data;
    const status = data?.data?.status || data?.status;

    if (status !== "success") {
      await Subscription.findOneAndUpdate(
        { user: req.user.id },
        {
          $set: {
            chapaPaymentStatus: status,
          },
        }
      );

      return res.status(400).json({
        error: "Payment not successful",
        status,
      });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    const subscription = await Subscription.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          status: "active",
          plan: "premium",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          chapaTxRef: txRef,
          chapaPaymentStatus: status,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return res.json({ subscription });
  } catch (error) {
    logger.error(
      `Failed to verify Chapa payment for user ${req.user.id}, txRef ${txRef}: ${error.message}`
    );
    return res.status(500).json({
      error: "Failed to verify payment. Please contact support.",
    });
  }
};

module.exports = {
  getCurrentSubscription,
  createCheckoutSession,
  verifyPayment,
};


