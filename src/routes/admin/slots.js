import { Router } from "express";
import {
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  buildSlotFilterQuery,
  getSlotByGamePassCode,
  getSlotByID,
  markSlotAsAttended,
} from "../../services/slots.js";
import { authMiddleware } from "../../middlewares/auth.js";
import {
  validateGet,
  validateNewSlot,
  validateUpdatedSlot,
} from "../../middlewares/validateSlot.js";
import AppError from "../../utils/AppError.js";

const router = Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { dateType = "on_date", date, page = 1, limit = 10 } = req.query;

    const statuses = req.query["statuses[]"];

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    let parsedStatuses = [];

    if (Array.isArray(statuses)) {
      parsedStatuses = statuses;
    } else if (typeof statuses === "string") {
      parsedStatuses = statuses.split(",");
    }

    const filters = {
      dateType,
      date,
      statuses: parsedStatuses.length ? parsedStatuses : ["all"],
    };

    const query = buildSlotFilterQuery(filters);

    const totalResult = await query.clone().count("* as count").first();
    const total = Number(totalResult.count);

    const slots = await query
      .clone()
      .select("*")
      .orderBy("date", "desc")
      .orderBy("start_time", "desc")
      .limit(pageSize)
      .offset(offset);

    res.json({
      success: true,
      error: "",
      data: {
        slots,
        pagination: {
          total,
          page: pageNumber,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (err) {
    // err.message = "Invalid query!";
    next(err);
  }
});

router.get("/id/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Invalid slot ID", 404);
    }

    const slot = await getSlotByID(id);

    res.json({ success: true, data: slot });
  } catch (err) {
    next(err);
  }
});

router.post("/verify", authMiddleware, async (req, res, next) => {
  try {
    const { game_pass_code } = req.body;

    if (!game_pass_code) {
      throw new AppError("Invalid game pass code", 404);
    }

    const slot = await getSlotByGamePassCode(game_pass_code.toUpperCase());

    res.json({ success: true, data: slot });
  } catch (err) {
    next(err);
  }
});

router.post("/", authMiddleware, validateNewSlot, async (req, res, next) => {
  try {
    const {
      start_time,
      end_time,
      note,
      status,
      date,
      sport,
      total_amount,
      box,
    } = req.slotData;
    const slot = await createSlot({
      start_time,
      end_time,
      note,
      status,
      date,
      sport,
      total_amount,
      box,
      adminId: req.user.id,
    });
    res.status(201).json({ success: true, error: "", data: slot });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/attend", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required",
      });
    }

    const result = await markSlotAsAttended(id, req.user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /slot/id
router.put(
  "/:id",
  authMiddleware,
  validateUpdatedSlot,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const slotData = req.slotData;
      const existing = req.existing;
      const slot = await updateSlot(id, slotData, existing, req.user.id);
      console.log(slot);

      res.json({ success: true, error: "", data: slot });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /slot/id
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, data: {}, error: "id is required" });
    const slot = await deleteSlot(id);
    res.json({ success: true, error: "", data: slot });
  } catch (err) {
    next(err);
  }
});

export default router;
