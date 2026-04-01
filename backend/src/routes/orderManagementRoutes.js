const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  listOrders,
  approveOrder,
  rejectOrder,
  updateOrderStatus,
} = require("../controllers/orderManagementController");
const {
  listOrdersQuerySchema,
  updateOrderStatusV1Schema,
} = require("../validators/ecosystemValidators");

const router = express.Router();

router.use(protectRoute, authorizeRoles("pharmacy_admin", "admin"));

router.get("/", validate(listOrdersQuerySchema, "query"), listOrders);
router.put("/:id/approve", approveOrder);
router.put("/:id/reject", rejectOrder);
router.put(
  "/:id/status",
  validate(updateOrderStatusV1Schema),
  updateOrderStatus,
);

module.exports = router;
