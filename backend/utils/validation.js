const { check } = require("express-validator");

const validateRegister = [
  check("username", "Username is required").not().isEmpty(),
  check("email", "Valid email is required").isEmail(),
  check("password", "Password must be at least 8 characters").isLength({
    min: 8,
  }),
  check("role", "Valid role is required").isIn([
    "Manager",
    "Planner",
    "Owner",
    "Admin",
  ]),
];

const validateLogin = [
  check("username", "Username is required").not().isEmpty(),
  check("password", "Password is required").not().isEmpty(),
];

const validateForecast = [
  check("forecastPeriod", "Valid period is required").isIn([
    "Daily",
    "Weekly",
    "Monthly",
  ]),
  check("modelType", "Valid model is required").isIn(["ARIMA", "RandomForest"]),
  check("startDate", "Valid start date is required").isISO8601(),
  check("endDate", "Valid end date is required").isISO8601(),
];

const validateReport = [
  check("reportType", "Valid report type is required").isIn([
    "Sales",
    "Forecast",
    "Inventory",
    "Performance",
  ]),
  check("format", "Valid format is required").isIn(["csv", "pdf"]),
  check("startDate", "Valid start date is required").isISO8601(),
  check("endDate", "Valid end date is required").isISO8601(),
];

const validateMarketBasket = [
  check("startDate", "Valid start date is required").isISO8601(),
  check("endDate", "Valid end date is required").isISO8601(),
];

const validateUser = [
  check("username", "Username is required").not().isEmpty(),
  check("email", "Valid email is required").isEmail(),
  check("password", "Password must be at least 8 characters").isLength({
    min: 8,
  }),
  check("role", "Valid role is required").isIn([
    "Manager",
    "Planner",
    "Owner",
    "Admin",
  ]),
];

const validateUpdateUser = [
  check("username", "Username is required").optional().not().isEmpty(),
  check("email", "Valid email is required").optional().isEmail(),
  check("password", "Password must be at least 8 characters")
    .optional()
    .isLength({ min: 8 }),
  check("role", "Valid role is required")
    .optional()
    .isIn(["Manager", "Planner", "Owner", "Admin"]),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForecast,
  validateReport,
  validateMarketBasket,
  validateUser,
  validateUpdateUser,
};
