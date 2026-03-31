const express = require("express");
const validate = require("../middlewares/validate");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const {
  createSlot,
  getSlotsByDoctor,
  deleteSlot,
  updateSlot,
  bulkCopySlots,
} = require("../controllers/slotController");
const {
  createSlotSchema,
  updateSlotSchema,
  bulkCopySlotSchema,
} = require("../validators/businessValidators");

const router = express.Router();

router.post(
  "/",
  protectRoute,
  authorizeRoles("doctor"),
  validate(createSlotSchema),
  createSlot,
);
router.get("/:doctorId", protectRoute, getSlotsByDoctor);
router.delete(
  "/:id",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  deleteSlot,
);
router.patch(
  "/:id",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  validate(updateSlotSchema),
  updateSlot,
);
router.post(
  "/bulk-copy",
  protectRoute,
  authorizeRoles("doctor"),
  validate(bulkCopySlotSchema),
  bulkCopySlots,
);

module.exports = router;
