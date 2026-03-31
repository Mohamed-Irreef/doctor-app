const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  getDashboard,
  getPatients,
  deletePatient,
  getDoctors,
  deleteDoctor,
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
  getSystemErrors,
  getAuditLogs,
} = require("../controllers/adminController");
const {
  getEcosystemMetrics,
  getPendingPartners,
  getApprovedPartners,
  getPartnerDetails,
  togglePartnerBan,
  deletePartner,
  approvePartner,
  rejectPartner,
  getLabApprovalRequests,
  decideLabApproval,
  getPharmacyApprovalRequests,
  decidePharmacyApproval,
  getPendingContentApprovals,
  decideLabTestContent,
  decideMedicineContent,
} = require("../controllers/adminEcosystemController");
const {
  approveDoctorSchema,
  createLabSchema,
  createMedicineSchema,
} = require("../validators/adminValidators");
const {
  createNotificationSchema,
  updateSettingsSchema,
} = require("../validators/businessValidators");
const { approvalDecisionSchema } = require("../validators/ecosystemValidators");

const router = express.Router();

router.use(protectRoute, authorizeRoles("admin"));

router.get("/dashboard", getDashboard);
router.get("/patients", getPatients);
router.delete("/patients/:id", deletePatient);
router.get("/doctors", getDoctors);
router.delete("/doctors/:id", deleteDoctor);
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
router.get("/errors", getSystemErrors);
router.get("/audit-logs", getAuditLogs);
router.get("/ecosystem/metrics", getEcosystemMetrics);
router.get("/partners/pending", getPendingPartners);
router.get("/partners/approved", getApprovedPartners);
router.get("/partners/:id", getPartnerDetails);
router.put("/partners/:id/ban", togglePartnerBan);
router.delete("/partners/:id", deletePartner);
router.put("/partners/:id/approve", approvePartner);
router.put("/partners/:id/reject", rejectPartner);
router.get("/approvals/labs", getLabApprovalRequests);
router.put(
  "/approvals/labs/:id",
  validate(approvalDecisionSchema),
  decideLabApproval,
);
router.get("/approvals/pharmacies", getPharmacyApprovalRequests);
router.put(
  "/approvals/pharmacies/:id",
  validate(approvalDecisionSchema),
  decidePharmacyApproval,
);
router.get("/content/pending", getPendingContentApprovals);
router.put(
  "/content/lab-tests/:id/decision",
  validate(approvalDecisionSchema),
  decideLabTestContent,
);
router.put(
  "/content/medicines/:id/decision",
  validate(approvalDecisionSchema),
  decideMedicineContent,
);

module.exports = router;
