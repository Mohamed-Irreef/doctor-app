const express = require("express");
const authRoutes = require("./authRoutes");
const doctorRoutes = require("./doctorRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const slotRoutes = require("./slotRoutes");
const labRoutes = require("./labRoutes");
const pharmacyRoutes = require("./pharmacyRoutes");
const commerceRoutes = require("./commerceRoutes");
const paymentRoutes = require("./paymentRoutes");
const adminRoutes = require("./adminRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const miscRoutes = require("./miscRoutes");
const planRoutes = require("./planRoutes");
const businessRoutes = require("./businessRoutes");
const partnerRoutes = require("./partnerRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/slots", slotRoutes);
router.use("/labs", labRoutes);
router.use("/pharmacy", pharmacyRoutes);
router.use("/", commerceRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);
router.use("/", businessRoutes);
router.use("/", partnerRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/plans", planRoutes);
router.use("/", miscRoutes);

module.exports = router;
