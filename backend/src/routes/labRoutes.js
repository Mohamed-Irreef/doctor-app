const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  getLabs,
  getLabById,
  bookLab,
} = require("../controllers/labController");
const { bookLabSchema } = require("../validators/businessValidators");

const router = express.Router();

router.get("/", getLabs);
router.get("/:id", getLabById);
router.post(
  "/book",
  protectRoute,
  authorizeRoles("patient"),
  validate(bookLabSchema),
  bookLab,
);

module.exports = router;
