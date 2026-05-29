import { type CutoffCategory, type Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();

type Probability = "high" | "medium" | "low";

const predictorParamsSchema = z.object({
  college_id: z.coerce.number().int().positive(),
});

const predictorQuerySchema = z.object({
  exam: z.string().trim().min(1),
  percentile: z.coerce.number().min(0),
  category: z.enum(["GENERAL", "OBC", "SC", "ST"]),
});

function examWhereInput(exam: string): Prisma.StringFilter<"AdmissionCutoff"> {
  if (exam.toUpperCase() === "JEE") {
    return {
      contains: "JEE",
      mode: "insensitive",
    };
  }

  return {
    equals: exam,
    mode: "insensitive",
  };
}

function predictProbability(percentile: number, cutoffs: number[]): Probability {
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

function estimateJeeRank(percentile: number): number | null {
  const estimatedApplicants = 1_200_000;

  if (percentile < 0 || percentile > 100) {
    return null;
  }

  return Math.max(1, Math.round(((100 - percentile) / 100) * estimatedApplicants));
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
        category: query.data.category as CutoffCategory,
      },
      orderBy: { year: "desc" },
      take: 3,
    });

    if (cutoffs.length === 0) {
      res.status(404).json({ error: "No cutoff data found for that exam/category combo" });
      return;
    }

    const isJee = query.data.exam.toUpperCase() === "JEE";

    res.json({
      probability: predictProbability(
        query.data.percentile,
        cutoffs.map((cutoff) => cutoff.cutoff_value),
      ),
      rank_context: isJee
        ? {
            exam: "JEE",
            estimated_rank: estimateJeeRank(query.data.percentile),
            assumption: "Approximation based on 12 lakh applicants",
          }
        : null,
      cutoff_context: cutoffs.map((cutoff) => ({
        year: cutoff.year,
        cutoff: cutoff.cutoff_value,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
