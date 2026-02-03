const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  getCurrentSubscription,
  createCheckoutSession,
  verifyPayment,
} = require("../controllers/subscriptionController");

// Get current user's subscription
router.get("/", auth, getCurrentSubscription);

// Start a new checkout session with Chapa
router.post("/checkout", auth, createCheckoutSession);

// Verify payment after redirect back from Chapa
router.get("/verify/:txRef", auth, verifyPayment);

module.exports = router;


