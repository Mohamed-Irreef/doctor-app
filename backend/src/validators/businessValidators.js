const { z } = require("zod");

const createSlotSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int().min(10).max(180).default(30),
});

const createAppointmentSchema = z.object({
  doctorId: z.string(),
  slotId: z.string(),
  type: z.enum(["video", "chat", "in-person"]),
});

const updateAppointmentStatusSchema = z.object({
  status: z.enum(["pending", "upcoming", "completed", "cancelled"]),
  cancellationReason: z.string().optional(),
  notes: z.string().optional(),
  prescription: z.string().optional(),
});

const rescheduleAppointmentSchema = z.object({
  slotId: z.string(),
});

const bookLabSchema = z.object({
  labTestId: z.string(),
  bookingDate: z.string(),
});

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({ medicineId: z.string(), quantity: z.number().int().min(1) }),
    )
    .min(1),
});

const createPaymentOrderSchema = z.object({
  type: z.enum(["appointment", "lab", "pharmacy", "subscription"]),
  relatedId: z.string(),
});

const verifyPaymentSchema = z.object({
  paymentId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

const createNotificationSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.string().min(2),
  audienceType: z.enum(["all", "patients", "doctors", "single"]),
  recipientId: z.string().optional(),
});

const updateSettingsSchema = z.object({
  consultationCommissionPercent: z.number().min(0).max(100).optional(),
  pharmacyCommissionPercent: z.number().min(0).max(100).optional(),
  labCommissionPercent: z.number().min(0).max(100).optional(),
  autoApproveDoctors: z.boolean().optional(),
  smsNotificationsEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  emailUpdatesEnabled: z.boolean().optional(),
});

const createPlanPaymentOrderSchema = z.object({
  planCode: z.string().min(2),
});

module.exports = {
  createSlotSchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  bookLabSchema,
  createOrderSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema,
  createNotificationSchema,
  updateSettingsSchema,
  createPlanPaymentOrderSchema,
};
