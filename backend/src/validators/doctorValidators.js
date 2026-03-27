const { z } = require("zod");

const doctorSignupRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  specialization: z.string().min(2),
  qualifications: z.array(z.string()).default([]),
  licenseNumber: z.string().min(3),
  experienceYears: z.number().int().min(0).default(0),
  consultationFee: z.number().min(0).default(0),
  consultationFeeVideo: z.number().min(0).default(0),
  consultationFeeInPerson: z.number().min(0).default(0),
  consultationFeeChat: z.number().min(0).default(0),
  availabilityType: z.enum(["online", "offline", "both"]).default("both"),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  hospital: z.string().optional(),
  bio: z.string().optional(),
  languages: z.array(z.string()).default([]),
});

const updateDoctorProfileSchema = z.object({
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
  hospital: z.string().optional(),
  bio: z.string().optional(),
  languages: z.array(z.string()).optional(),
  dailySlotLimit: z.number().int().min(1).optional(),
  noticePeriodHours: z.number().int().min(0).optional(),
});

module.exports = {
  doctorSignupRequestSchema,
  updateDoctorProfileSchema,
};
