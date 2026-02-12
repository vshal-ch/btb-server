import { Router } from "express";
import health from "./health.js";
import slotsRouter from "./slots.js";
import venueRouter from "./venue.js";
import homeRouter from "./home.routes.js";
import contactRouter from "./contact.js";
import adminRouter from "./admin/index.js";
import authRouter from "./auth.js";
import costsRouter from "./costs.js";
import sportsRouter from "./sports.js";
import faqsRouter from "./faqs.routes.js";
import userRouter from "./user.routes.js";
import notesRouter from "./notes.js";
import paymentRouter from "./payments.js";
import { requireAccessToken } from "../middlewares/userAuth.middleware.js";

const router = Router();

router.use("/", health);
router.use("/auth", authRouter);

router.use("/admin", adminRouter);
router.use("/slots", requireAccessToken, slotsRouter);
router.use("/venue", requireAccessToken, venueRouter);
router.use("/payments", requireAccessToken, paymentRouter);
// router.use("/contact", contactRouter);
router.use("/costs", requireAccessToken, costsRouter);
router.use("/sports", requireAccessToken, sportsRouter);
router.use("/faqs", requireAccessToken, faqsRouter);
router.use("/home", requireAccessToken, homeRouter);
router.use("/users/me", requireAccessToken, userRouter);
router.use("/notes/", requireAccessToken, notesRouter);

// TODO: mount domain routes here (slots, venue, contacts, phones, media, costs)
// router.use('/slots', slotsRoutes);

export default router;
