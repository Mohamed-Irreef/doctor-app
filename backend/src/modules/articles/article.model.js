const mongoose = require("mongoose");

const articleAuthorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["Doctor", "Admin"],
      default: "Admin",
    },
    avatar: { type: String, trim: true },
  },
  { _id: false },
);

const articleSeoSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
  },
  { _id: false },
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    shortDescription: { type: String, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, trim: true },
    images: [{ type: String, trim: true }],
    category: { type: String, trim: true, index: true },
    tags: [{ type: String, trim: true, index: true }],
    author: articleAuthorSchema,
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    readTime: { type: Number, default: 1, min: 1 },
    views: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date },
    seo: articleSeoSchema,
  },
  { timestamps: true },
);

articleSchema.index({
  title: "text",
  shortDescription: "text",
  content: "text",
});
articleSchema.index({ isPublished: 1, isFeatured: 1, createdAt: -1 });

const articleReviewSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true },
);

articleReviewSchema.index({ articleId: 1, userId: 1 }, { unique: true });
articleReviewSchema.index({ articleId: 1, createdAt: -1 });

const Article = mongoose.model("Article", articleSchema);
const ArticleReview = mongoose.model("ArticleReview", articleReviewSchema);

const articleLikeSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

articleLikeSchema.index({ articleId: 1, userId: 1 }, { unique: true });

const ArticleLike = mongoose.model("ArticleLike", articleLikeSchema);

module.exports = { Article, ArticleReview, ArticleLike };
