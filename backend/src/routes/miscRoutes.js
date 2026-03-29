const express = require("express");
const upload = require("../middlewares/upload");
const { protectRoute } = require("../middlewares/auth");
const { uploadFile } = require("../controllers/uploadController");
const { getMyNotifications } = require("../controllers/notificationController");
const { createReview } = require("../controllers/reviewController");

const router = express.Router();

router.post("/upload", protectRoute, upload.single("file"), uploadFile);
router.post("/upload-public", upload.single("file"), uploadFile);
router.get("/notifications", protectRoute, getMyNotifications);
router.post("/reviews", protectRoute, createReview);

module.exports = router;
