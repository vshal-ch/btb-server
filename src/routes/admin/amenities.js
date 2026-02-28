import express from "express";
import * as amenitiesService from "../../services/amenities.js";
import { authMiddleware } from "../../middlewares/auth.js";
import validator from "validator";

const router = express.Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const amenities = await amenitiesService.getAllAmenities();
    res.json({ success: true, error: "", data: amenities });
  } catch (err) {
    next(err);
  }
});

router.post("/", authMiddleware, validateAmenity, async (req, res, next) => {
  try {
    const newAmenity = await amenitiesService.createAmenity(
      req.body,
      req.user.id,
    );
    res.status(201).json({ success: true, error: "", data: newAmenity });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authMiddleware, validateAmenity, async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(createError(400, "Invalid or missing id"));
  }

  try {
    const updated = await amenitiesService.updateAmenity(
      id,
      req.body,
      req.user.id,
    );
    res.json({ success: true, error: "", data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(createError(400, "Invalid or missing id"));
  }

  try {
    await amenitiesService.deleteAmenity(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

function validateAmenity(req, res, next) {
  const { amenity } = req.body;
  if (
    !amenity ||
    typeof amenity !== "string" ||
    !validator.isAlphanumeric(amenity, undefined, { ignore: " " })
  ) {
    return next(
      createError(400, "Amenity is required and must be a Alphanumeric string"),
    );
  }
  next();
}

export default router;
