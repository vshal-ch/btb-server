import { Router } from "express";
import * as phoneService from "../../services/phone.js";
import {
  validateCreatePhone,
  validateUpdatePhone,
} from "../../middlewares/validatePhone.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { contact_id } = req.query;
    if (!contact_id)
      return res.status(400).json({ error: "contact_id required" });

    const phones = await phoneService.getPhones(contact_id);
    res.json({ success: true, error: "", data: phones });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:contact_id",
  authMiddleware,
  validateUpdatePhone,
  async (req, res, next) => {
    try {
      const contact_id = req.params.contact_id;
      if (!contact_id) {
        return res
          .status(400)
          .json({ success: false, data: {}, error: "contact_id required" });
      }
      const phone = await phoneService.createPhone(req.body, contact_id);
      res.json({ success: true, error: "", data: phone });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/:id",
  authMiddleware,
  validateUpdatePhone,
  async (req, res, next) => {
    try {
      const updated = await phoneService.updatePhone(req.params.id, req.body);
      if (!updated)
        return res
          .status(404)
          .json({ success: false, data: {}, error: "Phone not found" });
      res.json({ success: true, error: "", data: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const deleted = await phoneService.deletePhone(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, data: {}, error: "Phone not found" });
    res.json({ success: true, error: "", data: deleted });
  } catch (err) {
    next(err);
  }
});

export default router;
