import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import morgan from "morgan";
import adminRoutes from "./routes/admin.js";
import collegeRoutes from "./routes/colleges.js";
import predictorRoutes from "./routes/predictor.js";
import reviewRoutes from "./routes/reviews.js";
import scoreRoutes from "./routes/score.js";
import shortlistRoutes from "./routes/shortlist.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const requestLogger = process.env.NODE_ENV === "production" ? "combined" : "dev";

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(requestLogger));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/colleges", collegeRoutes);
app.use("/api/colleges", reviewRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/shortlist", shortlistRoutes);
app.use("/api/predictor", predictorRoutes);
app.use("/api/admin", adminRoutes);

app.use("/colleges", collegeRoutes);
app.use("/colleges", reviewRoutes);
app.use("/score", scoreRoutes);
app.use("/shortlist", shortlistRoutes);
app.use("/predictor", predictorRoutes);
app.use("/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

function hasErrorShape(error: unknown): error is { status?: unknown; message?: unknown } {
  return typeof error === "object" && error !== null;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = hasErrorShape(err) && typeof err.status === "number" ? err.status : 500;
  const message = hasErrorShape(err) && typeof err.message === "string" ? err.message : "Unexpected error";

  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : message,
  });
};

app.use(errorHandler);

app.listen(port, () => {
  process.stdout.write(`Server listening on port ${port}\n`);
});
