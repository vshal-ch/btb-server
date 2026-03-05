// services/mediaService.js
import db from "../config/db.js";
import {
  uploadToExternalServer,
  deleteFromExternalServer,
} from "../utils/mediaUploader.js";

export async function getAllMedia() {
  return db("media")
    .orderBy("position", "asc")
    .select(
      "id",
      "src_url",
      "title",
      "description",
      "type",
      "category",
      "position",
    );
}

export async function getMediaByCategory(category) {
  return db("media")
    .where({ category })
    .orderBy("position", "asc")
    .select(
      "id",
      "src_url",
      "title",
      "description",
      "type",
      "category",
      "position",
      "active",
    );
}

export async function createMedia(
  file,
  {
    category,
    title,
    type,
    description,
    active,
    position,
    youtube_url,
    src_url,
  },
  adminId,
) {
  let finalSrcUrl;
  if (type === "image") {
    if (file) {
      // Upload file to Cloudinary
      finalSrcUrl = await uploadToExternalServer(file, "image");
    } else if (src_url) {
      // Allow pre-existing URL
      finalSrcUrl = src_url;
    } else {
      throw new Error("Image file or src_url required");
    }
  }
  if (type === "video") {
    // Use provided YouTube URL directly
    finalSrcUrl = youtube_url;
  }

  const id = crypto.randomUUID();
  const [inserted] = await db("media")
    .insert({
      id,
      src_url: finalSrcUrl,
      category,
      title,
      type,
      description,
      position,
      active,
      created_by_type: "admin",
      created_by_id: adminId,
    })
    .returning([
      "id",
      "src_url",
      "title",
      "description",
      "type",
      "category",
      "position",
      "active",
    ]);

  return inserted;
}

export async function updateMedia(
  id,
  file,
  {
    category,
    title,
    type,
    description,
    active,
    position,
    youtube_url,
    src_url,
  },
  adminId,
) {
  const existing = await db("media").where({ id }).first();
  if (!existing) throw new Error("Media not found");

  let finalSrcUrl = existing.src_url;

  // 🔹 Update logic depends on type
  if (type === "image") {
    if (file) {
      // delete old cloudinary file if exists and upload new one
      if (existing.type === "image" && existing.src_url) {
        await deleteFromExternalServer(existing.src_url, "image");
      }
      finalSrcUrl = await uploadToExternalServer(file);
    } else if (src_url) {
      // allow replacing Cloudinary image with direct URL if needed
      finalSrcUrl = src_url;
    }
  }

  if (type === "video") {
    if (!youtube_url) throw new Error("youtube_url is required for video");
    finalSrcUrl = youtube_url;

    // if previously was image, delete its Cloudinary file
    if (existing.type === "image" && existing.src_url) {
      await deleteFromExternalServer(existing.src_url, "image");
    }
  }

  const [updated] = await db("media")
    .where({ id })
    .update({
      src_url: finalSrcUrl,
      category,
      title,
      type,
      description,
      position,
      active,
      last_updated_by_type: "admin",
      last_updated_by_id: adminId,
    })
    .returning("*");

  return updated;
}

export async function deleteMedia(id) {
  const existing = await db("media").where({ id }).first();
  if (!existing) throw new Error("Media not found");
  if (existing.type === "image" && existing.src_url) {
    deleteFromExternalServer(existing.src_url, "image");
  }
  await db("media").where({ id }).del();

  return { success: true };
}
