import { type CourseFee, type PlacementStat } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();
const shortlists = new Map<string, Set<number>>();

type ShortlistCollegeSummary = {
  id: number;
  name: string;
  city: string;
  state: string;
  type: string;
  streams: string[];
  nirf_rank: number | null;
  established: number;
  accreditation: string;
  website: string;
  latestPlacement: PlacementStat | null;
  minCourseFee: CourseFee | null;
};

const addShortlistSchema = z.object({
  college_id: z.number().int().positive(),
});

const shortlistHeaderSchema = z.object({
  "x-session-token": z.string().trim().min(1),
});

const sessionParamSchema = z.object({
  session_id: z.string().trim().min(1),
});

async function getShortlistSummaries(collegeIds: number[]): Promise<ShortlistCollegeSummary[]> {
  if (collegeIds.length === 0) {
    return [];
  }

  const colleges = await prisma.college.findMany({
    where: {
      id: {
        in: collegeIds,
      },
    },
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
  });

  const collegeOrder = new Map(collegeIds.map((id, index) => [id, index]));

  return colleges
    .sort((left, right) => {
      const leftIndex = collegeOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = collegeOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    })
    .map((college) => ({
      id: college.id,
      name: college.name,
      city: college.city,
      state: college.state,
      type: college.type,
      streams: college.streams,
      nirf_rank: college.nirf_rank,
      established: college.established,
      accreditation: college.accreditation,
      website: college.website,
      latestPlacement: college.placements[0] ?? null,
      minCourseFee: college.courseFees[0] ?? null,
    }));
}

router.post("/", async (req, res, next) => {
  try {
    const sessionToken = req.header("x-session-token");
    const headers = shortlistHeaderSchema.safeParse({
      "x-session-token": sessionToken,
    });

    if (!headers.success) {
      res.status(400).json({ errors: { "x-session-token": "x-session-token header is required" } });
      return;
    }

    const parsed = addShortlistSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid shortlist request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const college = await prisma.college.findUnique({
      where: { id: parsed.data.college_id },
      select: { id: true },
    });

    if (!college) {
      res.status(404).json({ error: "College not found" });
      return;
    }

    const shortlist = shortlists.get(headers.data["x-session-token"]) ?? new Set<number>();
    shortlist.add(parsed.data.college_id);
    shortlists.set(headers.data["x-session-token"], shortlist);

    res.json(await getShortlistSummaries([...shortlist]));
  } catch (error) {
    next(error);
  }
});

router.get("/:session_id", async (req, res, next) => {
  try {
    const parsed = sessionParamSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid session id",
        details: parsed.error.flatten(),
      });
      return;
    }

    const shortlist = shortlists.get(parsed.data.session_id);

    if (!shortlist) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json(await getShortlistSummaries([...shortlist]));
  } catch (error) {
    next(error);
  }
});

export default router;
