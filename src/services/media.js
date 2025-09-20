// services/mediaService.js
import db from "../config/db.js";
import {
  uploadToExternalServer,
  deleteFromExternalServer,
} from "../utils/mediaUploader.js";

export async function getAllMedia() {
  return db("media").orderBy("position","asc").select("*");
}

export async function createMedia(file, { type, description, position }) {
  if (!file) throw new Error("File is required");

  const src_url = await uploadToExternalServer(file, type);

  const id = crypto.randomUUID();
  const [inserted] = await db("media")
    .insert({ id, src_url, type, description, position })
    .returning("*");

  return inserted;
}

export async function updateMedia(id, file, { type, description, position }) {
  const existing = await db("media").where({ id }).first();
  if (!existing) throw new Error("Media not found");

  let src_url = existing.src_url;

  if (file) {
    await deleteFromExternalServer(existing.src_url);
    src_url = await uploadToExternalServer(file);
  }

  const [updated] = await db("media")
    .where({ id })
    .update({ src_url, type, description, position })
    .returning("*");

  return updated;
}

export async function deleteMedia(id) {
  const existing = await db("media").where({ id }).first();
  if (!existing) throw new Error("Media not found");

  await deleteFromExternalServer(existing.src_url, existing.type);
  await db("media").where({ id }).del();

  return { success: true };
}
