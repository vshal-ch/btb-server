import express from "express";
import * as notesService from "../../services/notes.js";

const router = express.Router();

router.get("/offer-text", async (req, res, next) => {
  try {
    const notes = await notesService.getActiveOfferText();

    res.json({
      success: true,
      data: notes,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/offer-text", async (req, res, next) => {
  try {
    let { note } = req.body;

    note = validateNote(note);
    const data = await notesService.setActiveOfferText(note);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export function validateNote(note) {
  if (typeof note !== "string") {
    throw new Error("Note must be a string.");
  }

  const trimmed = note.trim();

  if (!trimmed) {
    throw new Error("Note cannot be empty.");
  }

  return (
    trimmed
      // Remove non-printable control characters
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      // Escape HTML special characters
      .replace(/[&<>"']/g, (char) => {
        switch (char) {
          case "&":
            return "&amp;";
          case "<":
            return "&lt;";
          case ">":
            return "&gt;";
//          case '"':
 //           return "&quot;";
//          case "'":
//            return "&#39;";
          default:
            return char;
        }
      })
  );
}

export default router;
