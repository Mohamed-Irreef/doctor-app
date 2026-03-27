const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  getDashboard,
  getPatients,
  getDoctors,
  approveDoctor,
  getAppointments,
  createLab,
  createMedicine,
  getPayments,
  createNotification,
  updateSettings,
  getReviews,
  deleteReview,
  getRevenueBreakdown,
  getSubscriptions,
} = require("../controllers/adminController");
const {
  approveDoctorSchema,
  createLabSchema,
  createMedicineSchema,
} = require("../validators/adminValidators");
const {
  createNotificationSchema,
  updateSettingsSchema,
} = require("../validators/businessValidators");

const router = express.Router();

router.use(protectRoute, authorizeRoles("admin"));

router.get("/dashboard", getDashboard);
router.get("/patients", getPatients);
router.get("/doctors", getDoctors);
router.put("/doctors/approve", validate(approveDoctorSchema), approveDoctor);
router.get("/appointments", getAppointments);
router.post("/labs", validate(createLabSchema), createLab);
router.post("/medicines", validate(createMedicineSchema), createMedicine);
router.get("/payments", getPayments);
router.post(
  "/notifications",
  validate(createNotificationSchema),
  createNotification,
);
router.put("/settings", validate(updateSettingsSchema), updateSettings);
router.get("/reviews", getReviews);
router.delete("/reviews/:id", deleteReview);
router.get("/revenue", getRevenueBreakdown);
router.get("/subscriptions", getSubscriptions);

module.exports = router;
