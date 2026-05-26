import { CollegeType } from "@prisma/client";
import { Router } from "express";
import { performance } from "node:perf_hooks";
import { z } from "zod";
import { prisma } from "../db.js";
const router = Router();
function firstValue(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
const optionalTrimmedString = z.preprocess(firstValue, z
    .string()
    .trim()
    .min(1)
    .optional());
const listQuerySchema = z.object({
    q: optionalTrimmedString,
    stream: optionalTrimmedString,
    city: optionalTrimmedString,
    type: z.preprocess((value) => {
        const first = firstValue(value);
        return typeof first === "string" ? first.trim().toUpperCase() : first;
    }, z.nativeEnum(CollegeType).optional()),
    fees_max: z.preprocess(firstValue, z.coerce.number().int().positive().optional()),
    sort: z.preprocess(firstValue, z.enum(["nirf_rank", "avg_pkg", "fees"]).optional()),
});
const compareQuerySchema = z.object({
    ids: z.preprocess(firstValue, z.string().trim().min(1)),
});
const collegeParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});
function toFieldErrors(error) {
    return error.issues.reduce((errors, issue) => {
        const field = String(issue.path[0] ?? "request");
        if (!errors[field]) {
            errors[field] = issue.message;
        }
        return errors;
    }, {});
}
function parseCompareIds(rawIds) {
    const ids = rawIds.split(",").map((id) => Number(id.trim()));
    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
        return null;
    }
    return {
        ids: [...new Set(ids)],
        requestedCount: ids.length,
    };
}
function logResponseTime(path, responseTimeMs) {
    process.stdout.write(`${path} ${responseTimeMs}ms\n`);
}
function average(values) {
    if (values.length === 0) {
        return null;
    }
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}
function aggregateRatings(reviews) {
    return {
        rating_overall: average(reviews.map((review) => review.rating_overall)),
        rating_placement: average(reviews.map((review) => review.rating_placement)),
        rating_faculty: average(reviews.map((review) => review.rating_faculty)),
        rating_infra: average(reviews.map((review) => review.rating_infra)),
    };
}
function lowestWinner(colleges, getValue) {
    const ranked = colleges
        .map((college) => ({ college, value: getValue(college) }))
        .filter((entry) => entry.value !== null)
        .sort((left, right) => left.value - right.value);
    if (!ranked[0]) {
        return null;
    }
    return {
        college_id: ranked[0].college.id,
        college_name: ranked[0].college.name,
        value: ranked[0].value,
    };
}
function highestWinner(colleges, getValue) {
    const ranked = colleges
        .map((college) => ({ college, value: getValue(college) }))
        .filter((entry) => entry.value !== null)
        .sort((left, right) => right.value - left.value);
    if (!ranked[0]) {
        return null;
    }
    return {
        college_id: ranked[0].college.id,
        college_name: ranked[0].college.name,
        value: ranked[0].value,
    };
}
router.get("/", async (req, res, next) => {
    const startedAt = performance.now();
    try {
        const parsed = listQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ errors: toFieldErrors(parsed.error) });
            return;
        }
        const { q, stream, city, type, fees_max: feesMax, sort } = parsed.data;
        const colleges = await prisma.college.findMany({
            where: {
                ...(q
                    ? {
                        OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            { city: { contains: q, mode: "insensitive" } },
                        ],
                    }
                    : {}),
                ...(stream ? { streams: { has: stream } } : {}),
                ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
                ...(type ? { type } : {}),
                ...(feesMax !== undefined ? { courseFees: { some: { annual_fee: { lte: feesMax } } } } : {}),
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
            orderBy: sort === "nirf_rank" || !sort ? [{ nirf_rank: "asc" }, { name: "asc" }] : [{ name: "asc" }],
        });
        const summaries = colleges.map((college) => ({
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
        if (sort === "avg_pkg") {
            summaries.sort((left, right) => {
                const scoreDiff = (right.latestPlacement?.avg_pkg ?? -1) - (left.latestPlacement?.avg_pkg ?? -1);
                return scoreDiff === 0 ? left.id - right.id : scoreDiff;
            });
        }
        if (sort === "fees") {
            summaries.sort((left, right) => {
                const feeDiff = (left.minCourseFee?.annual_fee ?? Number.MAX_SAFE_INTEGER) - (right.minCourseFee?.annual_fee ?? Number.MAX_SAFE_INTEGER);
                return feeDiff === 0 ? left.id - right.id : feeDiff;
            });
        }
        const responseTimeMs = Number((performance.now() - startedAt).toFixed(2));
        res.setHeader("Server-Timing", `app;dur=${responseTimeMs}`);
        logResponseTime("GET /api/colleges", responseTimeMs);
        res.json(summaries);
    }
    catch (error) {
        next(error);
    }
});
router.get("/compare", async (req, res, next) => {
    try {
        const parsed = compareQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ errors: toFieldErrors(parsed.error) });
            return;
        }
        const parsedIds = parseCompareIds(parsed.data.ids);
        if (!parsedIds || parsedIds.ids.length === 0) {
            res.status(400).json({ errors: { ids: "ids must be comma-separated positive integers" } });
            return;
        }
        if (parsedIds.requestedCount > 3) {
            res.status(400).json({ error: "compare supports a maximum of 3 colleges" });
            return;
        }
        const { ids } = parsedIds;
        const colleges = await prisma.college.findMany({
            where: { id: { in: ids } },
            include: {
                courseFees: { orderBy: { annual_fee: "asc" } },
                placements: { orderBy: { year: "desc" } },
            },
        });
        if (colleges.length !== new Set(ids).size) {
            res.status(404).json({ error: "One or more colleges not found" });
            return;
        }
        const comparisonColleges = colleges.map((college) => ({
            ...college,
            minAnnualFee: college.courseFees[0]?.annual_fee ?? null,
            latestPlacement: college.placements[0] ?? null,
        }));
        res.json({
            colleges: comparisonColleges,
            winners: {
                fees: lowestWinner(comparisonColleges, (college) => college.minAnnualFee),
                placement: highestWinner(comparisonColleges, (college) => college.latestPlacement?.avg_pkg ?? null),
                nirf_rank: lowestWinner(comparisonColleges, (college) => college.nirf_rank),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get("/:id", async (req, res, next) => {
    try {
        const parsed = collegeParamsSchema.safeParse(req.params);
        if (!parsed.success) {
            res.status(400).json({ errors: toFieldErrors(parsed.error) });
            return;
        }
        const college = await prisma.college.findUnique({
            where: { id: parsed.data.id },
            include: {
                courseFees: { orderBy: [{ annual_fee: "asc" }, { course: "asc" }] },
                placements: { orderBy: { year: "desc" } },
                cutoffs: { orderBy: [{ year: "desc" }, { exam: "asc" }, { category: "asc" }] },
                reviews: {
                    where: { status: "APPROVED" },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!college) {
            res.status(404).json({ error: "College not found" });
            return;
        }
        res.json({
            ...college,
            aggregateRatings: aggregateRatings(college.reviews),
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
