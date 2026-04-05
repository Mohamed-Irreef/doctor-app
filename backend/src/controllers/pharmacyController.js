const Medicine = require("../models/Medicine");
const PharmacyPartnerProfile = require("../models/PharmacyPartnerProfile");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { requirePatientProfileComplete } = require("../utils/profileCompletion");
const { sendPharmacyOrderPlacedEmail } = require("../services/emailService");
const {
  normalizePharmacyOrderStatus,
} = require("../services/pharmacyOrderStateMachine");
const { logError } = require("../utils/logger");
const {
  MEDICINE_FILTER_CATEGORIES,
  normalizeMedicineCategory,
} = require("../constants/medicineCategories");

const getMedicineCategories = catchAsync(async (_req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Medicine categories fetched", {
      categories: MEDICINE_FILTER_CATEGORIES,
    }),
  );
});

const getMedicines = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query;
  const filter = {
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  };
  if (query.category) {
    const category = normalizeMedicineCategory(query.category, {
      allowAll: true,
    });
    if (category && category !== "All") {
      filter.category = category;
    }
  }
  if (query.q) filter.$text = { $search: query.q };

  const medicines = await Medicine.find(filter).sort({ createdAt: -1 }).lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Medicines fetched", medicines));
});

const getMedicineById = catchAsync(async (req, res) => {
  const medicine = await Medicine.findOne({
    _id: req.params.id,
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  }).lean();
  if (!medicine) throw new ApiError(404, "Medicine not found");

  const pharmacySelect =
    "pharmacyName companyLogo profilePhoto supportPhone supportEmail address city state pincode licenseNumber operationalHours approvalStatus isApproved";

  let profile = null;
  if (medicine.owner) {
    profile = await PharmacyPartnerProfile.findOne({ user: medicine.owner })
      .select(pharmacySelect)
      .lean();
  }

  // Legacy medicines may have no owner or broken linkage. Use latest approved profile as fallback.
  if (!profile) {
    profile = await PharmacyPartnerProfile.findOne({})
      .sort({ updatedAt: -1 })
      .select(pharmacySelect)
      .lean();
  }

  const pharmacy = profile
    ? {
        pharmacyName: profile.pharmacyName || "",
        logo: profile.companyLogo || profile.profilePhoto || "",
        supportPhone: profile.supportPhone || "",
        supportEmail: profile.supportEmail || "",
        registrationId: profile.licenseNumber || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        pincode: profile.pincode || "",
        operationalHours: profile.operationalHours || "",
      }
    : null;

  const payload = {
    ...medicine,
    pharmacy,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, "Medicine fetched", payload));
});

const createOrder = catchAsync(async (req, res) => {
  await requirePatientProfileComplete(req.user._id);

  const ids = req.body.items.map((item) => item.medicineId);
  const medicines = await Medicine.find({
    _id: { $in: ids },
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  });

  if (medicines.length !== ids.length)
    throw new ApiError(400, "One or more medicines unavailable");

  const medMap = new Map(medicines.map((m) => [String(m._id), m]));
  const orderItems = [];
  let amount = 0;
  let requiresPrescription = false;
  let maxDeliveryHours = 24;

  for (const item of req.body.items) {
    const med = medMap.get(item.medicineId);
    if (!med) throw new ApiError(400, "Medicine not found");
    if (med.stock < item.quantity)
      throw new ApiError(400, `Insufficient stock for ${med.name}`);

    if (item.quantity < (med.minOrderQuantity || 1)) {
      throw new ApiError(
        400,
        `${med.name} minimum order quantity is ${med.minOrderQuantity || 1}`,
      );
    }

    if (item.quantity > (med.maxOrderQuantity || 20)) {
      throw new ApiError(
        400,
        `${med.name} maximum order quantity is ${med.maxOrderQuantity || 20}`,
      );
    }

    med.stock -= item.quantity;
    med.inStock = med.stock > 0;
    await med.save();

    requiresPrescription =
      requiresPrescription || Boolean(med.prescriptionRequired);
    maxDeliveryHours = Math.max(
      maxDeliveryHours,
      Number(med.deliveryEtaHours || 24),
    );

    orderItems.push({
      medicine: med._id,
      name: med.name,
      category: med.category,
      image: med.image,
      prescriptionRequired: Boolean(med.prescriptionRequired),
      quantity: item.quantity,
      unitPrice: med.price,
    });
    amount += med.price * item.quantity;
  }

  if (requiresPrescription && !req.body.prescription?.url) {
    throw new ApiError(
      400,
      "Prescription is required for one or more medicines",
    );
  }

  const deliveryAddress =
    req.body.deliveryAddress || req.user.address || "Address not provided";

  const prescriptionUrl = req.body.prescription?.url;
  const prescriptionVerified =
    !requiresPrescription ||
    Boolean(req.body.prescription?.verified || prescriptionUrl);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    amount,
    status: "placed",
    paymentStatus: "pending",
    deliveryAddress,
    deliveryContactName: req.body.deliveryContactName || req.user.name,
    deliveryContactPhone: req.body.deliveryContactPhone || req.user.phone,
    estimatedDeliveryAt: new Date(
      Date.now() + maxDeliveryHours * 60 * 60 * 1000,
    ),
    prescription: {
      required: requiresPrescription,
      url: prescriptionUrl,
      note: req.body.prescription?.note,
      verified: prescriptionVerified,
    },
    prescriptionUrl,
    prescriptionVerified,
    statusTimeline: [
      {
        status: "placed",
        note: "Order placed and awaiting payment confirmation",
        at: new Date(),
      },
    ],
  });

  await Notification.create({
    title: "Medicine order placed",
    message:
      "Your medicine order is placed. Complete payment to confirm dispatch.",
    type: "pharmacy-placed",
    audienceType: "single",
    recipient: req.user._id,
    targetEntityType: "Order",
    targetEntityId: order._id,
  });

  try {
    await sendPharmacyOrderPlacedEmail({
      to: req.user.email,
      patientName: req.user.name,
      orderId: order._id,
      amount: order.amount,
    });
  } catch (error) {
    logError("pharmacy_order_email_failed", error, {
      orderId: order._id,
      patientId: req.user._id,
    });
  }

  return res.status(201).json(new ApiResponse(201, "Order created", order));
});

const getOrders = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query;
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };

  if (query.status) {
    filter.status = normalizePharmacyOrderStatus(query.status);
  }

  const orders = await Order.find(filter)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, "Orders fetched", orders));
});

module.exports = {
  getMedicineCategories,
  getMedicines,
  getMedicineById,
  createOrder,
  getOrders,
};
