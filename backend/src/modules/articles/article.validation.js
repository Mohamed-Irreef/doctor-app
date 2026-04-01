const { z } = require("zod");

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

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const emptyToUndefined = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const articlePayloadSchema = z.object({
  title: z.string().min(5).max(180),
  slug: z.string().min(3).max(220).regex(slugRegex),
  shortDescription: z.string().max(400).optional(),
  content: z.string().min(50),
  coverImage: z.preprocess(emptyToUndefined, z.string().url().optional()),
  images: z.preprocess(toArray, z.array(z.string().url()).optional()),
  category: z.string().min(2).max(80),
  tags: z.preprocess(toArray, z.array(z.string().min(1).max(40)).optional()),
  author: z.object({
    name: z.string().min(2).max(80),
    role: z.enum(["Doctor", "Admin"]).default("Admin"),
    avatar: z.preprocess(emptyToUndefined, z.string().url().optional()),
  }),
  isFeatured: z.coerce.boolean().optional(),
  isPublished: z.coerce.boolean().optional(),
  readTime: z.coerce.number().int().min(1).max(120).optional(),
  seo: z
    .object({
      metaTitle: z.preprocess(
        emptyToUndefined,
        z.string().min(5).max(180).optional(),
      ),
      metaDescription: z.string().max(320).optional(),
      keywords: z.preprocess(
        toArray,
        z.array(z.string().min(1).max(50)).optional(),
      ),
    })
    .optional(),
});

const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  isFeatured: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["latest", "oldest", "mostViewed", "mostLiked"]).optional(),
  includeUnpublished: z.enum(["true", "false"]).optional(),
});

const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(3).max(800),
});

const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["latest", "highest"]).optional(),
});

module.exports = {
  articlePayloadSchema,
  listArticlesQuerySchema,
  createReviewSchema,
  listReviewsQuerySchema,
};
