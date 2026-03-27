const { z } = require("zod");

const registerPatientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
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

module.exports = {
  registerPatientSchema,
  loginSchema,
  googleAuthSchema,
};
