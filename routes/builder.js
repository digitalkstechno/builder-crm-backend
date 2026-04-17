const express = require("express");
const router = express.Router();
const { registerBuilder, extraManualRegister, createOrder, checkPhoneStatus, savePaymentInfo, builderLogin, getBuilderProfile, getAllBuilders, renewSubscription, getWebsiteDetails, updateWebsiteDetails } = require("../controller/builderController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/login", builderLogin);
router.get("/profile/:userId", getBuilderProfile);
router.get("/all", getAllBuilders);
router.post("/check-phone-status", checkPhoneStatus);
router.post("/save-payment-info", savePaymentInfo);
router.post("/create-order", createOrder);
router.post("/register", registerBuilder);
router.post("/extra-register", extraManualRegister);
router.post("/renew-subscription", renewSubscription);
router.get("/:builderId/website", authMiddleware, getWebsiteDetails);
router.put("/:builderId/website", authMiddleware, upload.fields([{ name: "logo", maxCount: 1 }, { name: "heroImage", maxCount: 1 }]), updateWebsiteDetails);

module.exports = router;
