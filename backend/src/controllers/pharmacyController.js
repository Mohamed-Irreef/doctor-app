const Medicine = require("../models/Medicine");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { requirePatientProfileComplete } = require("../utils/profileCompletion");

const getMedicines = catchAsync(async (req, res) => {
  const filter = { active: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) filter.$text = { $search: req.query.q };

  const medicines = await Medicine.find(filter).sort({ createdAt: -1 }).lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Medicines fetched", medicines));
});

const getMedicineById = catchAsync(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id).lean();
  if (!medicine) throw new ApiError(404, "Medicine not found");
  return res
    .status(200)
    .json(new ApiResponse(200, "Medicine fetched", medicine));
});

const createOrder = catchAsync(async (req, res) => {
  await requirePatientProfileComplete(req.user._id);

  const ids = req.body.items.map((item) => item.medicineId);
  const medicines = await Medicine.find({ _id: { $in: ids }, active: true });

  if (medicines.length !== ids.length)
    throw new ApiError(400, "One or more medicines unavailable");

  const medMap = new Map(medicines.map((m) => [String(m._id), m]));
  const orderItems = [];
  let amount = 0;

  for (const item of req.body.items) {
    const med = medMap.get(item.medicineId);
    if (!med) throw new ApiError(400, "Medicine not found");
    if (med.stock < item.quantity)
      throw new ApiError(400, `Insufficient stock for ${med.name}`);

    med.stock -= item.quantity;
    med.inStock = med.stock > 0;
    await med.save();

    orderItems.push({
      medicine: med._id,
      name: med.name,
      quantity: item.quantity,
      unitPrice: med.price,
    });
    amount += med.price * item.quantity;
  }

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    amount,
    status: "ordered",
  });

  return res.status(201).json(new ApiResponse(201, "Order created", order));
});

const getOrders = catchAsync(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, "Orders fetched", orders));
});

module.exports = {
  getMedicines,
  getMedicineById,
  createOrder,
  getOrders,
};
