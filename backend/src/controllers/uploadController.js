const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");

const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file provided");

  const folder = req.body.folder || "nividoc/uploads";
  if (!/^nividoc\/[a-z0-9/_-]+$/i.test(folder)) {
    throw new ApiError(400, "Invalid upload folder");
  }
  const result = await uploadBufferToCloudinary(req.file.buffer, folder);

  return res.status(201).json(
    new ApiResponse(201, "File uploaded", {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    }),
  );
});

module.exports = { uploadFile };
