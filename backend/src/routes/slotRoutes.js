const express = require("express");
const validate = require("../middlewares/validate");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const {
  createSlot,
  getSlotsByDoctor,
  deleteSlot,
} = require("../controllers/slotController");
const { createSlotSchema } = require("../validators/businessValidators");

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

module.exports = router;
