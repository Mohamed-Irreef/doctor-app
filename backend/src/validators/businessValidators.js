const { z } = require("zod");

const createSlotSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int().min(10).max(180).default(30),
});

const reportFileSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  mimeType: z.string().optional(),
});

const medicalDetailsSchema = z.object({
  disease: z.string().min(1).optional(),
  durationOfIssue: z.string().optional(),
  severityLevel: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  currentMedicines: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  bloodGroup: z.string().optional(),
  medicalHistory: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
  reportFiles: z.array(reportFileSchema).optional(),
});

const createAppointmentSchema = z.object({
  doctorId: z.string(),
  slotId: z.string(),
  type: z.enum(["video", "chat", "in-person"]),
  medicalDetails: medicalDetailsSchema.optional(),
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

const releasePendingAppointmentSchema = z.object({
  reason: z.string().optional(),
});

const submitPrescriptionSchema = z.object({
  text: z.string().min(1),
  pdfUrl: z.string().url(),
});

const verifyAppointmentRevenueSchema = z.object({
  approved: z.boolean(),
  payoutReference: z.string().optional(),
});

const updateSlotSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().int().min(10).max(180).optional(),
  status: z.enum(["available", "booked", "blocked"]).optional(),
});

const bulkCopySlotSchema = z.object({
  sourceDayOfWeek: z.number().int().min(0).max(6),
  targetDayOfWeek: z.number().int().min(0).max(6),
  fromDate: z.string(),
  toDate: z.string(),
});

const holdLabSlotSchema = z.object({
  date: z.string(),
  timeSlot: z.string().min(3),
});

const bookLabSchema = z.object({
  labTestId: z.string(),
  bookingDate: z.string(),
  collectionType: z.enum(["home", "lab"]).optional(),
  scheduledDate: z.string().optional(),
  collectionTimeSlot: z.string().optional(),
  holdId: z.string().optional(),
  homeCollectionAddress: z
    .object({
      flatHouse: z.string().min(1),
      streetArea: z.string().min(1),
      landmark: z.string().optional(),
      city: z.string().min(1),
      pincode: z.string().min(4),
      contactNumber: z.string().min(8),
    })
    .optional(),
});

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({ medicineId: z.string(), quantity: z.number().int().min(1) }),
    )
    .min(1),
  deliveryAddress: z.string().min(5).max(250).optional(),
  deliveryContactName: z.string().min(2).max(80).optional(),
  deliveryContactPhone: z.string().min(8).max(20).optional(),
  prescription: z
    .object({
      url: z.string().url(),
      note: z.string().max(240).optional(),
    })
    .optional(),
});

const createPaymentOrderSchema = z.object({
  type: z.enum(["appointment", "lab", "pharmacy", "subscription", "package"]),
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
  releasePendingAppointmentSchema,
  submitPrescriptionSchema,
  verifyAppointmentRevenueSchema,
  updateSlotSchema,
  bulkCopySlotSchema,
  holdLabSlotSchema,
  bookLabSchema,
  createOrderSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema,
  createNotificationSchema,
  updateSettingsSchema,
  createPlanPaymentOrderSchema,
};
