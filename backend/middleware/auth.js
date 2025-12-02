// authMiddleware.js
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

module.exports = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract userId instead of id or _id
    if (!decoded.userId) {
      logger.error("Token missing user ID");
      return res.status(401).json({ error: "Invalid token: missing user ID" });
    }

    req.user = {
      id: decoded.userId, // <-- Use userId here
      role: decoded.role || "User",
    };

    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);
    res.status(401).json({ error: "Invalid token" });
  }
};
