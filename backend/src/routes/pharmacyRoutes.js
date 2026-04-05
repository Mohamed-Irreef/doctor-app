const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  getMedicineCategories,
  getMedicines,
  getMedicineById,
  createOrder,
  getOrders,
} = require("../controllers/pharmacyController");
const { createOrderSchema } = require("../validators/businessValidators");

const router = express.Router();

router.get("/medicine-categories", getMedicineCategories);
router.get("/medicines", getMedicines);
router.get("/medicines/:id", getMedicineById);
router.post(
  "/orders",
  protectRoute,
  authorizeRoles("patient"),
  validate(createOrderSchema),
  createOrder,
);
router.get("/orders", protectRoute, getOrders);

module.exports = router;
