const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is not set in environment variables");
      console.log("Please set MONGO_URI in your .env file");
      return;
    }

    // Determine if SSL should be used (only for Atlas connections)
    const useSSL = process.env.MONGO_URI.includes("mongodb+srv://") || process.env.MONGO_URI.includes("ssl=true");
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Only add SSL option if it's an Atlas connection
    if (useSSL) {
      options.ssl = true;
    }

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("MongoDB connected successfully");
    
    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });

  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.log("\nTroubleshooting tips:");
    console.log("1. Make sure MongoDB is running (local) or connection string is correct (Atlas)");
    console.log("2. Check your MONGO_URI in .env file");
    console.log("3. For local MongoDB: mongodb://localhost:27017/sales-forecast");
    console.log("4. For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/sales-forecast");
    console.log("\nServer will continue to run, but database features will not work until MongoDB is connected.");
    // Don't exit - allow server to start and retry connection
  }
};

module.exports = connectDB;
