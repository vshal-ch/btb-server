import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/error.js";
import path from "path";
import { fileURLToPath } from "url";
import { extractPlatform } from "./middlewares/validate.js";
import cashfreeWebhook from "./webhooks/cashfree.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(morgan("dev"));
app.use("/webhook", express.raw({ type: "*/*" }), cashfreeWebhook);
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV !== "production"
        ? process.env.DEV_ADMIN_SITE_ORIGIN
        : process.env.PROD_ADMIN_SITE_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
      "x-platform",
    ],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy-policy.html"));
});
app.use("/api", extractPlatform, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
