import { Router } from "express";
import health from "./health.js";
import slotsRouter from "./slots.js";
import venueRouter from "./venue.js";
import contactRouter from "./contact.js";
import adminRouter from "./admin/index.js";
import authRouter from "./auth.js";

const router = Router();

router.use("/", health);
router.use("/auth", authRouter);

router.use("/admin", adminRouter);
router.use("/slots", slotsRouter);
router.use("/venue", venueRouter);
router.use("/contact", contactRouter);

// TODO: mount domain routes here (slots, venue, contacts, phones, media, costs)
// router.use('/slots', slotsRoutes);

export default router;
