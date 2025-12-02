const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/sales", require("./sales"));
router.use("/forecasts", require("./forecasts"));
router.use("/products", require("./products"));
router.use("/reports", require("./reports"));
router.use("/marketbasket", require("./marketBasket"));
router.use("/users", require("./users"));

module.exports = router;
