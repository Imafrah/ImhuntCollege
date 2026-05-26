import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import adminRoutes from "./routes/admin.js";
import collegeRoutes from "./routes/colleges.js";
import predictorRoutes from "./routes/predictor.js";
import reviewRoutes from "./routes/reviews.js";
import scoreRoutes from "./routes/score.js";
import shortlistRoutes from "./routes/shortlist.js";
const app = express();
const port = Number(process.env.PORT ?? 4000);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/colleges", collegeRoutes);
app.use("/api/colleges", reviewRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/shortlist", shortlistRoutes);
app.use("/api/predictor", predictorRoutes);
app.use("/api/admin", adminRoutes);
const errorHandler = (err, _req, res, _next) => {
    const status = typeof err.status === "number" ? err.status : 500;
    res.status(status).json({
        error: status === 500 ? "Internal Server Error" : err.message,
    });
};
app.use(errorHandler);
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
