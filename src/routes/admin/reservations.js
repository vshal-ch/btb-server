import { Router } from "express";
import db from "../../config/db.js";
import validateReservation from "../../middlewares/validateReservations.js";
import createOrUpdateMonthlyReservation from "../../services/reservations.js";

const router = Router();

router.post("/", validateReservation, async (req, res, next) => {
  try {
    const force = req.query.force === "true";

    const result = await createOrUpdateMonthlyReservation({
      payload: req.payload,
      force,
      adminId: req.user.id,
    });

    if (result.warning) {
      return res.status(200).json({
        success: true,
        data: { warning: true, message: result.message },
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", validateReservation, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, data: {}, error: "id is required" });

    const existing = await db("monthly_slot_reservations")
      .where({ id })
      .first();
    if (!existing)
      return res.status(404).json({
        success: false,
        data: {},
        error: "Montly reservation with given ID not found",
      });
    const force = req.query.force === "true";

    const result = await createOrUpdateMonthlyReservation({
      payload: req.payload,
      force,
      id,
      adminId: req.user.id,
    });

    if (result.warning) {
      return res.status(200).json({
        success: false,
        warning: true,
        message: result.message,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let query = db("monthly_slot_reservations");

    if (status && status !== "all") {
      query = query.where("status", status);
    }

    if (search) {
      query = query.where(function () {
        this.where("customer_name", "ilike", `%${search}%`).orWhere(
          "customer_phone",
          "ilike",
          `%${search}%`,
        );
      });
    }

    const data = await query.orderBy("start_date", "desc");

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await db("monthly_slot_reservations").where("id", req.params.id).delete();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
