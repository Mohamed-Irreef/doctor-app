const mongoose = require("mongoose");
const ApiResponse = require("../../utils/ApiResponse");
const catchAsync = require("../../utils/catchAsync");
const articleService = require("./article.service");

const createArticle = catchAsync(async (req, res) => {
  const article = await articleService.createArticle(req.body);
  return res.status(201).json(new ApiResponse(201, "Article created", article));
});

const listArticles = catchAsync(async (req, res) => {
  const includeUnpublished =
    req.query.includeUnpublished === "true" && req.user?.role === "admin";

  const data = await articleService.listArticles(req.query, {
    allowUnpublished: includeUnpublished,
  });

  return res.status(200).json(new ApiResponse(200, "Articles fetched", data));
});

const listFeaturedArticles = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit || 8);
  const items = await articleService.getFeaturedArticles(limit);
  return res
    .status(200)
    .json(new ApiResponse(200, "Featured articles fetched", items));
});

const getArticleBySlug = catchAsync(async (req, res) => {
  const article = await articleService.getArticleBySlug(req.params.slug);
  const related = await articleService.findRelatedArticles(article, 5);

  return res.status(200).json(
    new ApiResponse(200, "Article fetched", {
      article,
      related,
    }),
  );
});

const updateArticle = catchAsync(async (req, res) => {
  const article = await articleService.updateArticle(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, "Article updated", article));
});

const deleteArticle = catchAsync(async (req, res) => {
  await articleService.deleteArticle(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Article deleted", { id: req.params.id }));
});

const addReview = catchAsync(async (req, res) => {
  const review = await articleService.addArticleReview(
    req.params.id,
    req.user._id,
    req.body,
  );

  return res.status(201).json(new ApiResponse(201, "Review added", review));
});

const toggleArticleLike = catchAsync(async (req, res) => {
  const result = await articleService.toggleArticleLike(
    req.params.id,
    req.user._id,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.liked ? "Article liked" : "Article unliked",
        result,
      ),
    );
});

const getArticleLikeStatus = catchAsync(async (req, res) => {
  const result = await articleService.getArticleLikeStatus(
    req.params.id,
    req.user._id,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Article like status fetched", result));
});

const listReviews = catchAsync(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Invalid article id", null));
  }
  const data = await articleService.listArticleReviews(
    req.params.id,
    req.query,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Article reviews fetched", data));
});

module.exports = {
  createArticle,
  listArticles,
  listFeaturedArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  addReview,
  toggleArticleLike,
  getArticleLikeStatus,
  listReviews,
};
