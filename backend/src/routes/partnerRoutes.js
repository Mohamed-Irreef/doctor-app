const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");
const {
  getLabDashboard,
  createLabTest,
  getLabTests,
  updateLabTest,
  deleteLabTest,
  getLabBookings,
  updateLabBookingStatus,
  approveLabBooking,
  rejectLabBooking,
  getLabMasterData,
  addLabMasterDataItem,
  updateLabMasterDataItem,
  deleteLabMasterDataItem,
  getLabSettings,
  updateLabSettings,
  getPharmacyDashboard,
  getPartnerMedicineCategories,
  createMedicineByPartner,
  getPartnerMedicines,
  updatePartnerMedicine,
  deletePartnerMedicine,
  getPartnerOrders,
  updatePartnerOrderStatus,
} = require("../controllers/partnerController");
const {
  createPartnerLabTestSchema,
  createPartnerMedicineSchema,
  updateLabBookingStatusSchema,
  updateOrderStatusSchema,
  updateLabSettingsSchema,
} = require("../validators/ecosystemValidators");

const router = express.Router();

router.get(
  "/partner/lab/dashboard",
  protectRoute,
  authorizeRoles("lab_admin"),
  getLabDashboard,
);
router.get(
  "/partner/lab/tests",
  protectRoute,
  authorizeRoles("lab_admin"),
  getLabTests,
);
router.post(
  "/partner/lab/tests",
  protectRoute,
  authorizeRoles("lab_admin"),
  upload.fields([
    { name: "testImageFile", maxCount: 1 },
    { name: "reportSampleFile", maxCount: 1 },
  ]),
  validate(createPartnerLabTestSchema),
  createLabTest,
);
router.put(
  "/partner/lab/tests/:id",
  protectRoute,
  authorizeRoles("lab_admin"),
  upload.fields([
    { name: "testImageFile", maxCount: 1 },
    { name: "reportSampleFile", maxCount: 1 },
  ]),
  validate(createPartnerLabTestSchema.partial()),
  updateLabTest,
);
router.delete(
  "/partner/lab/tests/:id",
  protectRoute,
  authorizeRoles("lab_admin"),
  deleteLabTest,
);
router.get(
  "/partner/lab/bookings",
  protectRoute,
  authorizeRoles("lab_admin"),
  getLabBookings,
);
router.put(
  "/partner/lab/bookings/:id/status",
  protectRoute,
  authorizeRoles("lab_admin"),
  validate(updateLabBookingStatusSchema),
  updateLabBookingStatus,
);
router.put(
  "/partner/lab/bookings/:id/approve",
  protectRoute,
  authorizeRoles("lab_admin"),
  approveLabBooking,
);
router.put(
  "/partner/lab/bookings/:id/reject",
  protectRoute,
  authorizeRoles("lab_admin"),
  rejectLabBooking,
);
router.get(
  "/partner/lab/master-data",
  protectRoute,
  authorizeRoles("lab_admin"),
  getLabMasterData,
);
router.get(
  "/partner/lab/settings",
  protectRoute,
  authorizeRoles("lab_admin"),
  getLabSettings,
);
router.put(
  "/partner/lab/settings",
  protectRoute,
  authorizeRoles("lab_admin"),
  validate(updateLabSettingsSchema),
  updateLabSettings,
);
router.post(
  "/partner/lab/master-data/:group/items",
  protectRoute,
  authorizeRoles("lab_admin"),
  addLabMasterDataItem,
);
router.put(
  "/partner/lab/master-data/:group/items/:itemId",
  protectRoute,
  authorizeRoles("lab_admin"),
  updateLabMasterDataItem,
);
router.delete(
  "/partner/lab/master-data/:group/items/:itemId",
  protectRoute,
  authorizeRoles("lab_admin"),
  deleteLabMasterDataItem,
);

router.get(
  "/partner/pharmacy/medicine-categories",
  protectRoute,
  authorizeRoles("pharmacy_admin"),
  getPartnerMedicineCategories,
);
router.get(
  "/partner/pharmacy/dashboard",
  protectRoute,
  authorizeRoles("pharmacy_admin"),
  getPharmacyDashboard,
);
router.get(
  "/partner/pharmacy/medicines",
  protectRoute,
  authorizeRoles("pharmacy_admin"),
  getPartnerMedicines,
);
router.post(
  "/partner/pharmacy/medicines",
  protectRoute,
  authorizeRoles("pharmacy_admin"),
  upload.fields([
    { name: "medicineImageFile", maxCount: 1 },
    { name: "medicinePdfFile", maxCount: 1 },
  ]),
  validate(createPartnerMedicineSchema),
  createMedicineByPartner,
);
router.put(
  "/partner/pharmacy/medicines/:id",
  protectRoute,
  authorizeRoles("pharmacy_admin"),
  upload.fields([
    { name: "medicineImageFile", maxCount: 1 },
    { name: "medicinePdfFile", maxCount: 1 },
  ]),
  validate(createPartnerMedicineSchema.partial()),
  updatePartnerMedicine,
);
router.delete(
  "/partner/pharmacy/medicines/:id",
  protectRoute,
  authorizeRoles("pharmacy_admin"),
  deletePartnerMedicine,
);
router.get(
  "/partner/pharmacy/orders",
  protectRoute,
  authorizeRoles("pharmacy_admin"),
  getPartnerOrders,
);
router.put(
  "/partner/pharmacy/orders/:id/status",
  protectRoute,
  authorizeRoles("pharmacy_admin"),
  validate(updateOrderStatusSchema),
  updatePartnerOrderStatus,
);

module.exports = router;
