import express from "express";
import {
  validateOffer,
} from "../../middlewares/validateOffer.js";
import * as offerService from "../../services/offer.service.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const data = await offerService.getOffers();

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", validateOffer, async (req, res, next) => {
  try {
    const offer = await offerService.createOffer(req.offerPayload, req.user.id);

    res.json({ success: true, data: offer });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", validateIdParam, validateOffer, async (req, res, next) => {
  try {
    const offer = await offerService.updateOffer(
      req.params.id,
      req.offerPayload,
      req.user.id,
    );

    res.json({ success: true, data: offer });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", validateIdParam, async (req, res, next) => {
  try {
    await offerService.deleteOffer(req.params.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

function validateIdParam(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return next(createError(400, "Invalid or missing id"));
  }
  next();
}

export default router;
