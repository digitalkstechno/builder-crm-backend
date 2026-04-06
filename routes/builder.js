const express = require("express");
const router = express.Router();
const { registerBuilder, extraManualRegister, createOrder, checkPhoneStatus, savePaymentInfo, builderLogin, getBuilderProfile, getAllBuilders, renewSubscription } = require("../controller/builderController");

router.post("/login", builderLogin);
router.get("/profile/:userId", getBuilderProfile);
router.get("/all", getAllBuilders);
router.post("/check-phone-status", checkPhoneStatus);
router.post("/save-payment-info", savePaymentInfo);
router.post("/create-order", createOrder);
router.post("/register", registerBuilder);
router.post("/extra-register", extraManualRegister);
router.post("/renew-subscription", renewSubscription);

module.exports = router;
