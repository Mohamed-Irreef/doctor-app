const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

function uploadBufferToCloudinary(fileBuffer, folder, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      resource_type = "auto",
      type,
      access_mode,
      public_id,
      use_filename,
      unique_filename,
      overwrite,
    } = options || {};

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        ...(type ? { type } : {}),
        ...(access_mode ? { access_mode } : {}),
        ...(public_id ? { public_id } : {}),
        ...(use_filename != null ? { use_filename } : {}),
        ...(unique_filename != null ? { unique_filename } : {}),
        ...(overwrite != null ? { overwrite } : {}),
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

module.exports = { uploadBufferToCloudinary };
