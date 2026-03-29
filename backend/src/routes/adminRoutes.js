const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  getDashboard,
  getPatients,
  getDoctors,
  getDoctorRequests,
  approveDoctor,
  getAppointments,
  getLabs,
  createLab,
  updateLab,
  deleteLab,
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getPayments,
  getOrders,
  updateOrderStatus,
  getNotifications,
  createNotification,
  getSettings,
  updateSettings,
  getReviews,
  deleteReview,
  getSlots,
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
router.get("/doctors/requests", getDoctorRequests);
router.put("/doctors/approve", validate(approveDoctorSchema), approveDoctor);
router.get("/appointments", getAppointments);
router.get("/labs", getLabs);
router.post("/labs", validate(createLabSchema), createLab);
router.put("/labs/:id", updateLab);
router.delete("/labs/:id", deleteLab);
router.get("/medicines", getMedicines);
router.post("/medicines", validate(createMedicineSchema), createMedicine);
router.put("/medicines/:id", updateMedicine);
router.delete("/medicines/:id", deleteMedicine);
router.get("/payments", getPayments);
router.get("/orders", getOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.get("/slots", getSlots);
router.get("/notifications", getNotifications);
router.post(
  "/notifications",
  validate(createNotificationSchema),
  createNotification,
);
router.get("/settings", getSettings);
router.put("/settings", validate(updateSettingsSchema), updateSettings);
router.get("/reviews", getReviews);
router.delete("/reviews/:id", deleteReview);
router.get("/revenue", getRevenueBreakdown);
router.get("/subscriptions", getSubscriptions);

module.exports = router;
