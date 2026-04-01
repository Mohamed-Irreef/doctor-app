const { z } = require("zod");

const createChatSchema = z.object({
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
});

const sendMessageSchema = z.object({
  type: z.enum(["text", "image"]).optional(),
  message: z.string().max(2000).optional(),
  fileUrl: z.string().url().optional(),
});

const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const blockChatSchema = z.object({
  block: z.coerce.boolean().default(true),
});

module.exports = {
  createChatSchema,
  sendMessageSchema,
  listMessagesQuerySchema,
  blockChatSchema,
};
