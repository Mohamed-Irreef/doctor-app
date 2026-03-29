const { z } = require("zod");

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const registerPatientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  gender: z.string().min(1),
  dateOfBirth: z.string().min(6),
  bloodGroup: z.string().min(2),
  address: z.string().min(3),
  emergencyContact: z.string().min(8),
  image: optionalUrl,
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["patient", "doctor", "admin"]),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(10),
  role: z.enum(["patient", "doctor"]).default("patient"),
});

const updatePatientProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  image: optionalUrl,
  gender: z.string().min(1).optional(),
  dateOfBirth: z.string().min(6).optional(),
  bloodGroup: z.string().min(2).optional(),
  address: z.string().min(3).optional(),
  emergencyContact: z.string().min(8).optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
});

module.exports = {
  registerPatientSchema,
  loginSchema,
  googleAuthSchema,
  updatePatientProfileSchema,
};
