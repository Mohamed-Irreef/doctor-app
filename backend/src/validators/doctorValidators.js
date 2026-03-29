const { z } = require("zod");

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const optionalUrlArray = z.preprocess((value) => {
  if (!Array.isArray(value)) return value;
  return value.filter((item) => Boolean(item && String(item).trim()));
}, z.array(z.string().url()).default([]));

const optionalCertificateFilesArray = z.preprocess(
  (value) => {
    if (!Array.isArray(value)) return value;
    return value.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.url === "string" &&
        item.url.trim(),
    );
  },
  z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string().min(1).optional(),
      }),
    )
    .default([]),
);

const doctorSignupRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  image: optionalUrl,
  gender: z.string().min(1),
  specialization: z.string().min(2),
  qualifications: z.array(z.string()).default([]),
  licenseNumber: z.string().min(3),
  experienceYears: z.number().int().min(0).default(0),
  consultationFee: z.number().min(1),
  consultationFeeVideo: z.number().min(0).default(0),
  consultationFeeInPerson: z.number().min(0).default(0),
  consultationFeeChat: z.number().min(0).default(0),
  availabilityType: z.enum(["online", "offline", "both"]).default("both"),
  clinicName: z.string().min(2),
  clinicAddress: z.string().min(3),
  clinicLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  hospital: z.string().optional(),
  bio: z.string().optional(),
  languages: z.array(z.string()).default([]),
  certificateUrls: optionalUrlArray,
  certificateFiles: optionalCertificateFilesArray.optional(),
});

const updateDoctorProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  image: optionalUrl,
  gender: z.string().optional(),
  specialization: z.string().optional(),
  qualifications: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  consultationFee: z.number().min(0).optional(),
  consultationFeeVideo: z.number().min(0).optional(),
  consultationFeeInPerson: z.number().min(0).optional(),
  consultationFeeChat: z.number().min(0).optional(),
  availabilityType: z.enum(["online", "offline", "both"]).optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  clinicLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  hospital: z.string().optional(),
  bio: z.string().optional(),
  bannerImage: optionalUrl,
  languages: z.array(z.string()).optional(),
  certificateUrls: optionalUrlArray.optional(),
  certificateFiles: optionalCertificateFilesArray.optional(),
  dailySlotLimit: z.number().int().min(1).optional(),
  noticePeriodHours: z.number().int().min(0).optional(),
});

module.exports = {
  doctorSignupRequestSchema,
  updateDoctorProfileSchema,
};
