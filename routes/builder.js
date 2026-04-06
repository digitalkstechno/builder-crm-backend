const express = require("express");
const router = express.Router();
const { registerBuilder, extraManualRegister, createOrder, checkPhoneStatus, savePaymentInfo, builderLogin, getBuilderProfile } = require("../controller/builderController");

router.post("/login", builderLogin);
router.get("/profile/:userId", getBuilderProfile);
router.post("/check-phone-status", checkPhoneStatus);
router.post("/save-payment-info", savePaymentInfo);
router.post("/create-order", createOrder);
router.post("/register", registerBuilder);
router.post("/extra-register", extraManualRegister);

module.exports = router;
