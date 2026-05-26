import { type Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { scoreColleges, type ScoreCollegeInput } from "../scoring.js";

const router = Router();

const scoreRequestSchema = z
  .object({
    weights: z.object({
      placement: z.number().min(0).max(1),
      fees: z.number().min(0).max(1),
      location: z.number().min(0).max(1),
    }),
    filters: z
      .object({
        stream: z.string().trim().min(1).optional(),
        city: z.string().trim().min(1).optional(),
      })
      .default({}),
  })
  .refine(
    (body) => Math.abs(body.weights.placement + body.weights.fees + body.weights.location - 1) <= 0.010000001,
    {
      path: ["weights"],
      message: "weights must sum to 1.0 with 0.01 tolerance",
    },
  );

router.post("/", async (req, res, next) => {
  try {
    const parsed = scoreRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid score request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { weights, filters } = parsed.data;
    const where: Prisma.CollegeWhereInput = {
      ...(filters.stream ? { streams: { has: filters.stream } } : {}),
      ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
    };

    const colleges = await prisma.college.findMany({
      where,
      include: {
        placements: {
          orderBy: { year: "desc" },
          take: 1,
        },
        courseFees: {
          orderBy: { annual_fee: "asc" },
          take: 1,
        },
      },
      orderBy: { id: "asc" },
    });

    const scoreInputs: ScoreCollegeInput[] = colleges.map((college) => ({
      college_id: college.id,
      name: college.name,
      city: college.city,
      avg_pkg: college.placements[0]?.avg_pkg ?? null,
      annual_fee: college.courseFees[0]?.annual_fee ?? null,
    }));

    res.setHeader("X-Location-Score-Note", "location_score is fixed at 0.5 because no granular location data is available yet");
    res.json(scoreColleges(scoreInputs, weights));
  } catch (error) {
    next(error);
  }
});

export default router;
