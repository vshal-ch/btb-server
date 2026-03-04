// utils/mediaUploader.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary using buffer
 * @param {Object} file - req.file from multer
 * @param {String} type - 'image' or 'video'
 */
export async function uploadToExternalServer(file, type) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "btb_media", // optional folder in Cloudinary
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );

    // Pipe buffer into Cloudinary stream
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
}

/**
 * Delete file from Cloudinary
 * @param {String} srcUrl - Cloudinary secure_url
 */
export async function deleteFromExternalServer(srcUrl, type) {
  if (
    !srcUrl ||
    srcUrl.includes("youtube.com") ||
    srcUrl.includes("youtu.be")
  ) {
    return true;
  }

  if (!srcUrl.includes("res.cloudinary.com")) {
    return true;
  }
  try {
    // Example srcUrl: https://res.cloudinary.com/demo/image/upload/v1234567890/venue_media/abcd1234.png
    const parts = srcUrl.split("/");
    const folderAndFile = parts.slice(-2).join("/"); // e.g., venue_media/abcd1234.png
    const publicId = folderAndFile.split(".")[0]; // remove extension

    await cloudinary.uploader.destroy(publicId, { resource_type: type });
    return true;
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    throw err;
  }
}
