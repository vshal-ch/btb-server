import { Router } from "express";
import * as contactService from "../services/contact.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const contacts = await contactService.getContacts();
    res.json({ success: true, error: "", data: contacts });
  } catch (err) {
    next(err);
  }
});

export default router;
