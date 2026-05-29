import { type Prisma } from "@prisma/client";
import { type Request, Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { scoreColleges, type ScoredCollege, type ScoreCollegeInput } from "../scoring.js";

const router = Router();
const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 30;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const scoreCache = new Map<string, { expiresAt: number; result: ScoredCollege[] }>();
const scoreCacheTtlMs = 5 * 60_000;
const maxScoreCacheEntries = 100;

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

function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(clientIp: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(clientIp);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(clientIp, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });

    return { limited: false, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxRequestsPerWindow) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { limited: false, retryAfterSeconds: 0 };
}

function cacheKey(data: z.infer<typeof scoreRequestSchema>): string {
  return JSON.stringify({
    weights: data.weights,
    filters: {
      stream: data.filters.stream ?? null,
      city: data.filters.city?.toLowerCase() ?? null,
    },
  });
}

function getCachedScore(key: string): ScoredCollege[] | null {
  const cached = scoreCache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    scoreCache.delete(key);
    return null;
  }

  scoreCache.delete(key);
  scoreCache.set(key, cached);

  return cached.result;
}

function setCachedScore(key: string, result: ScoredCollege[]): void {
  scoreCache.delete(key);

  if (scoreCache.size >= maxScoreCacheEntries) {
    const leastRecentlyUsedKey = scoreCache.keys().next().value;

    if (typeof leastRecentlyUsedKey === "string") {
      scoreCache.delete(leastRecentlyUsedKey);
    }
  }

  scoreCache.set(key, {
    expiresAt: Date.now() + scoreCacheTtlMs,
    result,
  });
}

router.post("/", async (req, res, next) => {
  try {
    const rateLimit = isRateLimited(getClientIp(req));

    if (rateLimit.limited) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({ error: "Too many score requests. Try again later." });
      return;
    }

    const parsed = scoreRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid score request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { weights, filters } = parsed.data;
    const key = cacheKey(parsed.data);
    const cachedScore = getCachedScore(key);

    if (cachedScore) {
      res.setHeader("X-Score-Cache", "HIT");
      res.setHeader("X-Location-Score-Note", "location_score is fixed at 0.5 because no granular location data is available yet");
      res.json(cachedScore);
      return;
    }

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

    const result = scoreColleges(scoreInputs, weights);
    setCachedScore(key, result);

    res.setHeader("X-Score-Cache", "MISS");
    res.setHeader("X-Location-Score-Note", "location_score is fixed at 0.5 because no granular location data is available yet");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
