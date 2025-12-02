const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const sanitize = (req, res, next) => {
  // Sanitize against MongoDB injection
  mongoSanitize()(req, res, () => {
    // Sanitize against XSS
    xss()(req, res, next);
  });
};

module.exports = sanitize;
