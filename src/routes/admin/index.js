import { Router } from "express";
import slotsRouter from "./slots.js";
import venueRouter from "./venue.js";
import contactRouter from "./contact.js";
import phoneRouter from "./phone.js";
import mediaRouter from "./media.js";
import costRouter from "./costs.js";
import sportRouter from "./sports.js";
 
const router = Router();

router.use("/slots", slotsRouter);
router.use("/venue", venueRouter);
router.use("/contact", contactRouter);
router.use("/phone", phoneRouter);
router.use("/media", mediaRouter);
router.use("/costs", costRouter);
router.use("/sports", sportRouter);

// TODO: mount domain routes here (slots, venue, contacts, phones, media, costs)
// router.use('/slots', slotsRoutes);

export default router;
