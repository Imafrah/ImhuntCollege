import { CollegeType } from "@prisma/client";
import { Router } from "express";
import { performance } from "node:perf_hooks";
import { prisma } from "../db.js";
const router = Router();
const collegeTypes = new Set(Object.values(CollegeType));
const sortOptions = new Set(["nirf_rank", "avg_pkg", "fees"]);
function firstQueryValue(value) {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }
    return undefined;
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
        const q = firstQueryValue(req.query.q)?.trim();
        const stream = firstQueryValue(req.query.stream)?.trim();
        const city = firstQueryValue(req.query.city)?.trim();
        const type = firstQueryValue(req.query.type)?.trim().toUpperCase();
        const feesMaxRaw = firstQueryValue(req.query.fees_max);
        const sort = firstQueryValue(req.query.sort);
        const feesMax = feesMaxRaw ? Number(feesMaxRaw) : undefined;
        if (type && !collegeTypes.has(type)) {
            res.status(400).json({ error: "type must be GOVT, PRIVATE, or DEEMED" });
            return;
        }
        if (feesMaxRaw && (!Number.isFinite(feesMax) || !Number.isInteger(feesMax))) {
            res.status(400).json({ error: "fees_max must be a valid integer" });
            return;
        }
        if (sort && !sortOptions.has(sort)) {
            res.status(400).json({ error: "sort must be nirf_rank, avg_pkg, or fees" });
            return;
        }
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
                ...(type ? { type: type } : {}),
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
            summaries.sort((left, right) => (right.latestPlacement?.avg_pkg ?? -1) - (left.latestPlacement?.avg_pkg ?? -1));
        }
        if (sort === "fees") {
            summaries.sort((left, right) => (left.minCourseFee?.annual_fee ?? Number.MAX_SAFE_INTEGER) - (right.minCourseFee?.annual_fee ?? Number.MAX_SAFE_INTEGER));
        }
        const responseTimeMs = Number((performance.now() - startedAt).toFixed(2));
        console.log(`GET /api/colleges ${responseTimeMs}ms`);
        res.json(summaries);
    }
    catch (error) {
        next(error);
    }
});
router.get("/compare", async (req, res, next) => {
    try {
        const idsParam = firstQueryValue(req.query.ids);
        const ids = idsParam
            ? idsParam
                .split(",")
                .map((id) => Number(id.trim()))
                .filter(Number.isFinite)
            : [];
        if (ids.length === 0) {
            res.status(400).json({ error: "ids query param is required" });
            return;
        }
        if (ids.length > 3) {
            res.status(400).json({ error: "compare supports a maximum of 3 colleges" });
            return;
        }
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
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            res.status(400).json({ error: "id must be a valid number" });
            return;
        }
        const college = await prisma.college.findUnique({
            where: { id },
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
