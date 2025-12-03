const swaggerJsDoc = require("swagger-jsdoc");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sales Predictor API",
      version: "1.0.0",
      description: "API for sales forecasting and inventory management",
    },
    servers: [{ url: process.env.BASE_URL || "https://saleforecast-6aak.onrender.com/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
