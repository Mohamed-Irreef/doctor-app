const express = require("express");
const validate = require("../middlewares/validate");
const {
  registerLabPartner,
  registerPharmacyPartner,
} = require("../controllers/businessController");
const {
  registerLabPartnerSchema,
  registerPharmacyPartnerSchema,
} = require("../validators/ecosystemValidators");

const router = express.Router();

router.post(
  "/business/register/lab",
  validate(registerLabPartnerSchema),
  registerLabPartner,
);
router.post(
  "/business/register/pharmacy",
  validate(registerPharmacyPartnerSchema),
  registerPharmacyPartner,
);

module.exports = router;
