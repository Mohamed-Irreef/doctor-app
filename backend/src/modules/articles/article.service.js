const ApiError = require("../../utils/ApiError");
const mongoose = require("mongoose");
const { Article, ArticleReview, ArticleLike } = require("./article.model");

const FEATURED_CACHE_TTL_MS = 60 * 1000;
let featuredCache = { expiresAt: 0, payload: null };

function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureUniqueSlug(desiredSlug, excludeId) {
  const base = toSlug(desiredSlug);
  if (!base) throw new ApiError(400, "Invalid slug");

  let attempt = base;
  let index = 1;
  while (true) {
    const existing = await Article.findOne({ slug: attempt })
      .select("_id")
      .lean();
    if (!existing || String(existing._id) === String(excludeId || "")) {
      return attempt;
    }
    index += 1;
    attempt = `${base}-${index}`;
  }
}

function calculateReadTime(content = "") {
  const words = String(content)
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (!words) return 1;
  return Math.max(1, Math.ceil(words / 200));
}

function invalidateFeaturedCache() {
  featuredCache = { expiresAt: 0, payload: null };
}

async function createArticle(payload) {
  const slug = await ensureUniqueSlug(payload.slug || payload.title);
  const readTime = payload.readTime || calculateReadTime(payload.content);
  const doc = await Article.create({
    ...payload,
    slug,
    readTime,
    publishedAt: payload.isPublished ? new Date() : undefined,
  });
  invalidateFeaturedCache();
  return doc;
}

async function updateArticle(id, payload) {
  const article = await Article.findById(id);
  if (!article) throw new ApiError(404, "Article not found");

  if (payload.slug || payload.title) {
    article.slug = await ensureUniqueSlug(
      payload.slug || payload.title,
      article._id,
    );
  }

  Object.assign(article, payload);
  if (!payload.readTime && payload.content) {
    article.readTime = calculateReadTime(payload.content);
  }
  if (payload.isPublished === true && !article.publishedAt) {
    article.publishedAt = new Date();
  }
  if (payload.isPublished === false) {
    article.publishedAt = undefined;
  }

  await article.save();
  invalidateFeaturedCache();
  return article;
}

async function deleteArticle(id) {
  const article = await Article.findByIdAndDelete(id);
  if (!article) throw new ApiError(404, "Article not found");
  await ArticleReview.deleteMany({ articleId: article._id });
  invalidateFeaturedCache();
  return article;
}

function buildArticleFilters(query, { allowUnpublished }) {
  const filter = {};
  if (!allowUnpublished) filter.isPublished = true;

  if (query.category) {
    filter.category = { $regex: String(query.category), $options: "i" };
  }

  if (query.tag) {
    filter.tags = { $in: [new RegExp(String(query.tag), "i")] };
  }

  if (query.q) {
    filter.$or = [
      { title: { $regex: String(query.q), $options: "i" } },
      { shortDescription: { $regex: String(query.q), $options: "i" } },
      { content: { $regex: String(query.q), $options: "i" } },
    ];
  }

  if (query.isFeatured === "true") filter.isFeatured = true;
  if (query.isFeatured === "false") filter.isFeatured = false;

  return filter;
}

function sortMap(sortBy) {
  switch (sortBy) {
    case "oldest":
      return { createdAt: 1 };
    case "mostViewed":
      return { views: -1, createdAt: -1 };
    case "mostLiked":
      return { likes: -1, createdAt: -1 };
    case "latest":
    default:
      return { createdAt: -1 };
  }
}

async function listArticles(query, { allowUnpublished = false } = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  const filter = buildArticleFilters(query, { allowUnpublished });
  const [items, total] = await Promise.all([
    Article.find(filter)
      .sort(sortMap(query.sortBy))
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function getFeaturedArticles(limit = 8) {
  const now = Date.now();
  if (featuredCache.payload && featuredCache.expiresAt > now) {
    return featuredCache.payload;
  }

  const items = await Article.find({ isPublished: true, isFeatured: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  featuredCache = {
    payload: items,
    expiresAt: now + FEATURED_CACHE_TTL_MS,
  };

  return items;
}

async function getArticleBySlug(slug) {
  const article = await Article.findOneAndUpdate(
    { slug, isPublished: true },
    { $inc: { views: 1 } },
    { new: true },
  ).lean();

  if (!article) throw new ApiError(404, "Article not found");
  return article;
}

async function getArticleById(id) {
  const article = await Article.findById(id).lean();
  if (!article) throw new ApiError(404, "Article not found");
  return article;
}

async function addArticleReview(articleId, userId, payload) {
  const article = await Article.findById(articleId).select("_id isPublished");
  if (!article || !article.isPublished) {
    throw new ApiError(404, "Article not found");
  }

  const exists = await ArticleReview.findOne({ articleId, userId }).lean();
  if (exists) {
    throw new ApiError(409, "You have already reviewed this article");
  }

  const review = await ArticleReview.create({
    articleId,
    userId,
    rating: payload.rating,
    comment: payload.comment,
  });

  return review;
}

async function toggleArticleLike(articleId, userId) {
  const article = await Article.findById(articleId).select("_id");
  if (!article) throw new ApiError(404, "Article not found");

  const existing = await ArticleLike.findOne({ articleId, userId }).lean();
  let liked = false;
  if (existing) {
    await ArticleLike.deleteOne({ _id: existing._id });
  } else {
    await ArticleLike.create({ articleId, userId });
    liked = true;
  }

  const likesCount = await ArticleLike.countDocuments({ articleId });
  await Article.updateOne({ _id: articleId }, { likes: likesCount });

  return { liked, likesCount };
}

async function getArticleLikeStatus(articleId, userId) {
  const article = await Article.findById(articleId).select("_id likes").lean();
  if (!article) throw new ApiError(404, "Article not found");

  const like = await ArticleLike.findOne({ articleId, userId })
    .select("_id")
    .lean();
  return {
    liked: Boolean(like),
    likesCount: Number(article.likes || 0),
  };
}

async function listArticleReviews(articleId, query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  const sort =
    query.sortBy === "highest"
      ? { rating: -1, createdAt: -1 }
      : { createdAt: -1 };

  const [items, total, summary] = await Promise.all([
    ArticleReview.find({ articleId })
      .populate("userId", "name image")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    ArticleReview.countDocuments({ articleId }),
    ArticleReview.aggregate([
      {
        $match: {
          articleId: new mongoose.Types.ObjectId(String(articleId)),
        },
      },
      {
        $group: {
          _id: "$articleId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    items,
    summary: {
      averageRating: summary[0]?.averageRating
        ? Number(summary[0].averageRating.toFixed(1))
        : 0,
      totalReviews: summary[0]?.totalReviews || 0,
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function findRelatedArticles(article, limit = 4) {
  if (!article) return [];
  const tags = Array.isArray(article.tags) ? article.tags : [];

  const related = await Article.find({
    _id: { $ne: article._id },
    isPublished: true,
    $or: [{ category: article.category }, { tags: { $in: tags } }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return related;
}

module.exports = {
  createArticle,
  updateArticle,
  deleteArticle,
  listArticles,
  getFeaturedArticles,
  getArticleBySlug,
  getArticleById,
  addArticleReview,
  toggleArticleLike,
  getArticleLikeStatus,
  listArticleReviews,
  findRelatedArticles,
  calculateReadTime,
};
