const { z } = require("zod");

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const docSchema = z.object({
  name: z.string().optional(),
  url: z.string().url(),
  mimeType: z.string().optional(),
});

const baseBusinessSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  profilePhoto: z.string().url().optional(),
  address: z.string().min(4),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
  location: locationSchema,
  supportPhone: z.string().min(8),
  supportEmail: z.string().email(),
  termsAccepted: z.literal(true),
  declarationAccepted: z.literal(true),
});

const registerLabPartnerSchema = baseBusinessSchema.extend({
  labName: z.string().min(2),
  labType: z.enum(["diagnostic", "pathology"]),
  registrationNumber: z.string().min(4),
  yearsOfExperience: z.number().int().min(0).max(100),
  availableTests: z.array(z.string().min(1)).min(1),
  governmentLicense: docSchema,
  labCertification: docSchema,
  ownerIdProof: docSchema,
  addressProof: docSchema,
});

const registerPharmacyPartnerSchema = baseBusinessSchema.extend({
  pharmacyName: z.string().min(2),
  licenseNumber: z.string().min(4),
  gstNumber: z.string().min(4),
  yearsOfExperience: z.number().int().min(0).max(100),
  drugLicense: docSchema,
  gstCertificate: docSchema,
  ownerIdProof: docSchema,
});

const approvalDecisionSchema = z.object({
  approved: z.boolean(),
  reason: z.string().max(300).optional(),
});

const toArray = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
};

const toBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return value;
};

const statusSchema = z
  .enum(["draft", "submitted", "approved", "rejected"])
  .optional();

const createPartnerLabTestSchema = z.object({
  name: z.string().min(2),
  testCode: z.string().min(2).max(40).optional(),
  slug: z.string().min(2).optional(),
  category: z.string().min(2),
  subcategory: z.string().min(1).optional(),
  tags: z.preprocess(toArray, z.array(z.string()).optional()),
  shortDescription: z.string().min(5).max(180).optional(),
  fullDescription: z.string().min(10).optional(),
  description: z.string().optional(),
  preparationInstructions: z.string().optional(),
  originalPrice: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  commissionPercent: z.coerce.number().min(0).max(100).optional(),
  currency: z.literal("INR").optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  parameters: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null || value === "")
          return undefined;
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : undefined;
          } catch {
            return undefined;
          }
        }
        return undefined;
      },
      z.array(
        z.object({
          name: z.string().min(1),
          normalRange: z.string().optional(),
          unit: z.string().optional(),
        }),
      ),
    )
    .optional(),
  normalRange: z.string().optional(),
  method: z.string().optional(),
  department: z.string().optional(),
  sampleType: z.enum(["Blood", "Urine", "Saliva", "Other"]).optional(),
  fastingRequired: z.preprocess(toBool, z.boolean().optional()),
  fastingHours: z.coerce.number().int().min(0).max(24).optional(),
  sampleVolume: z.string().optional(),
  containerType: z.string().optional(),
  collectionInstructions: z.string().optional(),
  homeCollectionAvailable: z.preprocess(toBool, z.boolean().optional()),
  labVisitRequired: z.preprocess(toBool, z.boolean().optional()),
  bothAvailable: z.preprocess(toBool, z.boolean().optional()),
  technicianRequired: z.preprocess(toBool, z.boolean().optional()),
  collectionOption: z.enum(["home", "lab", "both"]).optional(),
  reportTime: z.string().optional(),
  processingTime: z.string().optional(),
  collectionTimeSlots: z.preprocess(toArray, z.array(z.string()).optional()),
  testImage: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  reportSampleUrl: z.string().url().optional(),
  testVideoUrl: z.string().url().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  gstPercent: z.coerce.number().min(0).max(100).optional(),
  finalPrice: z.coerce.number().min(0).optional(),
  keywords: z.preprocess(toArray, z.array(z.string()).optional()),
  turnaround: z.string().optional(),
  includes: z.preprocess(toArray, z.array(z.string()).optional()),
  prepSteps: z.preprocess(toArray, z.array(z.string()).optional()),
  beforeTestInstructions: z.string().optional(),
  afterTestInstructions: z.string().optional(),
  popular: z.preprocess(toBool, z.boolean().optional()),
  recommendedTest: z.preprocess(toBool, z.boolean().optional()),
  status: statusSchema,
});

const createPartnerMedicineSchema = z.object({
  name: z.string().min(2),
  genericName: z.string().optional(),
  category: z.string().min(2),
  subcategory: z.string().optional(),
  brand: z.string().min(1).optional(),
  composition: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  manufacturer: z.string().optional(),
  packSize: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  manufactureDate: z.string().optional(),
  requiresColdStorage: z.preprocess(toBool, z.boolean().optional()),
  storageInstructions: z.string().optional(),
  usageInstructions: z.string().optional(),
  indications: z.string().optional(),
  dosageInstructions: z.string().optional(),
  sideEffects: z.preprocess(toArray, z.array(z.string()).optional()),
  precautions: z.string().optional(),
  contraindications: z.preprocess(toArray, z.array(z.string()).optional()),
  drugInteractions: z.preprocess(toArray, z.array(z.string()).optional()),
  tags: z.preprocess(toArray, z.array(z.string()).optional()),
  keywords: z.preprocess(toArray, z.array(z.string()).optional()),
  description: z.string().optional(),
  image: z.string().optional(),
  pdfUrl: z.string().optional(),
  mrp: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  gstPercent: z.coerce.number().min(0).max(100).optional(),
  finalPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  deliveryEtaHours: z.coerce.number().int().min(0).optional(),
  minOrderQuantity: z.coerce.number().int().min(1).optional(),
  maxOrderQuantity: z.coerce.number().int().min(1).optional(),
  prescriptionRequired: z.preprocess(toBool, z.boolean().optional()),
  slug: z.string().optional(),
  scheduleType: z.string().optional(),
  featured: z.preprocess(toBool, z.boolean().optional()),
});

const LAB_STATUS_VALUES = [
  "booked",
  "sample-collected",
  "sample_collected",
  "report-ready",
  "report_ready",
  "completed",
  "cancelled",
];

const updateLabBookingStatusSchema = z.object({
  status: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => LAB_STATUS_VALUES.includes(value), {
      message: "Invalid status",
    })
    .transform((value) => value.replace(/_/g, "-")),
  reportUrl: z.string().url().optional(),
  note: z.string().max(300).optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "placed",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  note: z.string().max(300).optional(),
  trackingId: z.string().max(80).optional(),
});

const updateLabSettingsSchema = z.object({
  labName: z.string().min(2).optional(),
  address: z.string().min(4).optional(),
  supportPhone: z.string().min(8).optional(),
  deliveryPricing: z
    .object({
      costPerKm: z.coerce.number().min(0),
      minCharge: z.coerce.number().min(0).optional(),
      maxServiceRadiusKm: z.coerce.number().min(0).optional(),
    })
    .optional(),
});

module.exports = {
  registerLabPartnerSchema,
  registerPharmacyPartnerSchema,
  approvalDecisionSchema,
  createPartnerLabTestSchema,
  createPartnerMedicineSchema,
  updateLabBookingStatusSchema,
  updateOrderStatusSchema,
  updateLabSettingsSchema,
};
