const express = require("express");
const validate = require("../../middlewares/validate");
const { protectRoute, authorizeRoles } = require("../../middlewares/auth");
const {
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
} = require("./article.controller");
const {
  articlePayloadSchema,
  listArticlesQuerySchema,
  createReviewSchema,
  listReviewsQuerySchema,
} = require("./article.validation");

const router = express.Router();

router.get("/", validate(listArticlesQuerySchema, "query"), listArticles);
router.get("/featured", listFeaturedArticles);
router.get("/:slug", getArticleBySlug);

router.post(
  "/",
  protectRoute,
  authorizeRoles("admin"),
  validate(articlePayloadSchema),
  createArticle,
);

router.put(
  "/:id",
  protectRoute,
  authorizeRoles("admin"),
  validate(articlePayloadSchema.partial()),
  updateArticle,
);

router.delete("/:id", protectRoute, authorizeRoles("admin"), deleteArticle);

router.post(
  "/:id/reviews",
  protectRoute,
  validate(createReviewSchema),
  addReview,
);

router.get("/:id/like-status", protectRoute, getArticleLikeStatus);
router.post("/:id/like", protectRoute, toggleArticleLike);

router.get(
  "/:id/reviews",
  validate(listReviewsQuerySchema, "query"),
  listReviews,
);

module.exports = router;
