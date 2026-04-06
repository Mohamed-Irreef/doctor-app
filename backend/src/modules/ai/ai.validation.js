const { z } = require("zod");

const chatMessageSchema = z.object({
  role: z.enum(["user", "ai", "assistant", "model"]).default("user"),
  text: z
    .string({ required_error: "Message text is required" })
    .trim()
    .min(1, "Message text is required")
    .max(4000, "Message is too long"),
});

const aiChatSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, "At least one message is required")
    .max(40, "Too many messages")
    .refine((items) => items.some((m) => m.role === "user"), {
      message: "At least one user message is required",
    }),
});

module.exports = {
  aiChatSchema,
};
