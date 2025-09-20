import { Router } from "express";
import * as contactService from "../services/contact.js";
import {
  validateCreateContact,
  validateUpdateContact,
} from "../middlewares/validateContact.js";
import { verifyApiKey } from "../middlewares/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const contacts = await contactService.getContacts();
    res.json({ success: true, error: "", data: contacts });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  verifyApiKey,
  validateCreateContact,
  async (req, res, next) => {
    try {
      const contact = await contactService.createContact(req.body);
      res.json({ success: true, error: "", data: contact });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  verifyApiKey,
  validateUpdateContact,
  async (req, res, next) => {
    try {
      const updated = await contactService.updateContact(
        req.params.id,
        req.body
      );
      if (!updated)
        return res
          .status(404)
          .json({ success: false, error: "Contact not found", data: req.body });
      res.json({ success: true, error: "", data: updated });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", verifyApiKey, async (req, res, next) => {
  try {
    const deleted = await contactService.deleteContact(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Contact not found" });
    res.json({ success: true, error: "", data: deleted });
  } catch (err) {
    next(err);
  }
});

export default router;
