const cron = require("node-cron");
const { retrainForecast } = require("../controllers/forecastAdminController");

const scheduleRetraining = () => {
  // Run every Sunday at midnight
  cron.schedule("0 0 * * 0", async () => {
    console.log("Running scheduled model retraining");
    try {
      await retrainForecast(
        { body: { modelType: "RandomForest" } },
        { json: () => {} }
      );
      console.log("Retraining completed");
    } catch (error) {
      console.error("Retraining error:", error);
    }
  });
};

module.exports = scheduleRetraining;
