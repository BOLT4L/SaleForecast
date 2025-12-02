const logger = require("../utils/logger");

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    logger.info(
      "Checking role:",
      req.user?.role,
      "Allowed roles:",
      allowedRoles
    );
    console.log(
      "Checking role:",
      req.user?.role,
      "Allowed roles:",
      allowedRoles
    );

    // Allow Owner role to bypass all checks
    if (req.user?.role === "Owner") {
      logger.info(
        `Owner role detected for user ${req.user?.id}. Access granted.`
      );
      return next();
    }

    if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt by user ${req.user?.id} with role ${
          req.user?.role || "undefined"
        }`
      );
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};
