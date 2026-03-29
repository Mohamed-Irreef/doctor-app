const express = require("express");
const validate = require("../middlewares/validate");
const { protectRoute } = require("../middlewares/auth");
const {
  registerPatient,
  login,
  googleAuth,
  me,
  updatePatientProfile,
} = require("../controllers/authController");
const {
  registerPatientSchema,
  loginSchema,
  googleAuthSchema,
  updatePatientProfileSchema,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", validate(registerPatientSchema), registerPatient);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleAuthSchema), googleAuth);
router.get("/me", protectRoute, me);
router.put(
  "/profile",
  protectRoute,
  validate(updatePatientProfileSchema),
  updatePatientProfile,
);

module.exports = router;
