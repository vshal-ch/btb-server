// routes/mediaRouter.js
import express from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { validateMedia } from "../../middlewares/validateMedia.js";
import { upload } from "../../utils/multer.js";
import * as mediaService from "../../services/media.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const media = await mediaService.getAllMedia();
    res.json({ success: true, error: "", data: media });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authMiddleware,
  upload.single("media_data"),
  validateMedia,
  async (req, res, next) => {
    try {
      const result = await mediaService.createMedia(req.file, req.body);
      res.status(201).json({ success: true, error: "", data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("media_data"),
  validateMedia,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: "id is required" });

      const result = await mediaService.updateMedia(id, req.file, req.body);
      res.json({ success: true, error: "", data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "id is required" });
    const result = await mediaService.deleteMedia(id);
    res.json({ success: true, error: "", data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
