import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
const router = Router();
const predictorParamsSchema = z.object({
    college_id: z.coerce.number().int().positive(),
});
const predictorQuerySchema = z.object({
    exam: z.enum(["JEE", "CUET"]),
    percentile: z.coerce.number().min(0),
    category: z.enum(["GENERAL", "OBC", "SC", "ST"]),
});
function examWhereInput(exam) {
    if (exam === "JEE") {
        return {
            contains: "JEE",
            mode: "insensitive",
        };
    }
    return {
        equals: "CUET",
        mode: "insensitive",
    };
}
function predictProbability(percentile, cutoffs) {
    const highestCutoff = Math.max(...cutoffs);
    const averageCutoff = cutoffs.reduce((sum, cutoff) => sum + cutoff, 0) / cutoffs.length;
    if (percentile >= highestCutoff) {
        return "high";
    }
    if (percentile >= averageCutoff) {
        return "medium";
    }
    return "low";
}
router.get("/:college_id", async (req, res, next) => {
    try {
        const params = predictorParamsSchema.safeParse(req.params);
        const query = predictorQuerySchema.safeParse(req.query);
        if (!params.success) {
            res.status(400).json({
                error: "Invalid college id",
                details: params.error.flatten(),
            });
            return;
        }
        if (!query.success) {
            res.status(400).json({
                error: "Invalid predictor query",
                details: query.error.flatten(),
            });
            return;
        }
        const cutoffs = await prisma.admissionCutoff.findMany({
            where: {
                college_id: params.data.college_id,
                exam: examWhereInput(query.data.exam),
                category: query.data.category,
            },
            orderBy: { year: "desc" },
            take: 3,
        });
        if (cutoffs.length === 0) {
            res.status(404).json({ error: "No cutoff data found for that exam/category combo" });
            return;
        }
        res.json({
            probability: predictProbability(query.data.percentile, cutoffs.map((cutoff) => cutoff.cutoff_value)),
            cutoff_context: cutoffs.map((cutoff) => ({
                year: cutoff.year,
                cutoff: cutoff.cutoff_value,
            })),
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
