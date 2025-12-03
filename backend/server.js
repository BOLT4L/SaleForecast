const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const connectDB = require("./config/db");
const swaggerSpec = require("./config/swagger");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB (non-blocking - server will start even if DB connection fails)
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB on startup:", err.message);
  console.log("Server will continue to run. Please fix MongoDB connection and restart.");
});

// Middleware - CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://saleforecast-6aak.onrender.com/",

].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow if origin is in allowed list or if in development
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        // In production, only allow specified origins
        if (process.env.FRONTEND_URL && origin.includes(process.env.FRONTEND_URL)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true, // If you need to send cookies or auth headers
  })
);

// Configure Helmet with CSP that allows API connections
const frontendUrl = process.env.FRONTEND_URL || "https://saleforecast-6aak.onrender.com/";
const backendUrl = process.env.BASE_URL || `https://saleforecast-6aak.onrender.com/api`;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          frontendUrl,
          backendUrl,
          "https://saleforecast-6aak.onrender.com/",
          
        ],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for React dev
        styleSrc: ["'self'", "'unsafe-inline'"], // Needed for inline styles
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static files for reports
app.use("/reports", express.static(path.join(__dirname, "reports")));

// API routes
app.use("/api", require("./routes/index"));

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve frontend static files in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "..", "frontend", "dist");
  const fs = require("fs");
  
  // Check if frontend build exists
  if (fs.existsSync(frontendPath)) {
    // Serve static files from frontend/dist
    app.use(express.static(frontendPath));
    
    // For all non-API routes, serve index.html (SPA routing)
    app.get("*", (req, res, next) => {
      // Skip API routes and Swagger docs
      if (req.path.startsWith("/api") || req.path.startsWith("/api-docs")) {
        return next();
      }
      res.sendFile(path.join(frontendPath, "index.html"));
    });
    
    console.log("Frontend static files will be served from:", frontendPath);
  } else {
    console.warn("⚠️  Frontend build not found. Frontend will not be served.");
    console.warn("   Build frontend with: cd frontend && npm run build");
  }
}

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at https://saleforecast-6aak.onrender.com/api`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

// Handle server errors (like port already in use)
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`Port ${PORT} is already in use. Please free the port or use a different port.`);
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.log(`\nTo fix this, run one of these commands:`);
    console.log(`1. Find and kill the process: netstat -ano | findstr ":${PORT}"`);
    console.log(`2. Or change PORT in .env file to a different port\n`);
    process.exit(1);
  } else {
    logger.error(`Server error: ${err.message}`);
    console.error(`Server error: ${err.message}`);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.error(`Unhandled Rejection: ${err.message}`);
  // Don't exit on unhandled rejection - let the server continue
  // process.exit(1);
});
