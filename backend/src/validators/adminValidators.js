const { z } = require("zod");

const approveDoctorSchema = z.object({
  doctorUserId: z.string(),
  approved: z.boolean(),
});

const createLabSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  originalPrice: z.number().min(0),
  price: z.number().min(0),
  turnaround: z.string().optional(),
  popular: z.boolean().optional(),
  includes: z.array(z.string()).optional(),
  prepSteps: z.array(z.string()).optional(),
});

const createMedicineSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  image: z.string().url().optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  prescriptionRequired: z.boolean().optional(),
});

module.exports = {
  approveDoctorSchema,
  createLabSchema,
  createMedicineSchema,
};
