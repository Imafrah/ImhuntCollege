import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
const router = Router();
const currentYear = new Date().getFullYear();
const collegeParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});
const createReviewSchema = z.object({
    author_name: z.string().trim().min(1, "author_name is required"),
    batch_year: z.coerce
        .number()
        .int("batch_year must be an integer")
        .min(2010, "batch_year must be between 2010 and the current year")
        .max(currentYear, "batch_year must be between 2010 and the current year"),
    stream: z.string().trim().min(1, "stream is required"),
    rating_overall: z.coerce.number().min(1, "rating_overall must be between 1.0 and 5.0").max(5, "rating_overall must be between 1.0 and 5.0"),
    rating_placement: z.coerce.number().min(1, "rating_placement must be between 1.0 and 5.0").max(5, "rating_placement must be between 1.0 and 5.0"),
    rating_faculty: z.coerce.number().min(1, "rating_faculty must be between 1.0 and 5.0").max(5, "rating_faculty must be between 1.0 and 5.0"),
    rating_infra: z.coerce.number().min(1, "rating_infra must be between 1.0 and 5.0").max(5, "rating_infra must be between 1.0 and 5.0"),
    body: z.string().trim().min(80, "body must be at least 80 characters"),
});
const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
    offset: z.coerce.number().int().min(0).default(0),
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
function roundAverage(value) {
    return value === null ? null : Number(value.toFixed(2));
}
function buildAggregateRatings(avg) {
    return {
        rating_overall: roundAverage(avg.rating_overall),
        rating_placement: roundAverage(avg.rating_placement),
        rating_faculty: roundAverage(avg.rating_faculty),
        rating_infra: roundAverage(avg.rating_infra),
    };
}
router.post("/:id/reviews", async (req, res, next) => {
    try {
        const params = collegeParamsSchema.safeParse(req.params);
        if (!params.success) {
            res.status(400).json({ errors: toFieldErrors(params.error) });
            return;
        }
        const body = createReviewSchema.safeParse(req.body);
        if (!body.success) {
            res.status(400).json({ errors: toFieldErrors(body.error) });
            return;
        }
        const college = await prisma.college.findUnique({
            where: { id: params.data.id },
            select: { id: true },
        });
        if (!college) {
            res.status(404).json({ error: "College not found" });
            return;
        }
        const review = await prisma.review.create({
            data: {
                college_id: params.data.id,
                author_name: body.data.author_name,
                batch_year: body.data.batch_year,
                stream: body.data.stream,
                rating_overall: body.data.rating_overall,
                rating_placement: body.data.rating_placement,
                rating_faculty: body.data.rating_faculty,
                rating_infra: body.data.rating_infra,
                body: body.data.body,
                status: "PENDING",
            },
        });
        res.status(201).json(review);
    }
    catch (error) {
        next(error);
    }
});
router.get("/:id/reviews", async (req, res, next) => {
    try {
        const params = collegeParamsSchema.safeParse(req.params);
        const pagination = paginationSchema.safeParse(req.query);
        if (!params.success) {
            res.status(400).json({ errors: toFieldErrors(params.error) });
            return;
        }
        if (!pagination.success) {
            res.status(400).json({ errors: toFieldErrors(pagination.error) });
            return;
        }
        const college = await prisma.college.findUnique({
            where: { id: params.data.id },
            select: { id: true },
        });
        if (!college) {
            res.status(404).json({ error: "College not found" });
            return;
        }
        const where = {
            college_id: params.data.id,
            status: "APPROVED",
        };
        const [reviews, total, aggregate] = await prisma.$transaction([
            prisma.review.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: pagination.data.limit,
                skip: pagination.data.offset,
            }),
            prisma.review.count({ where }),
            prisma.review.aggregate({
                where,
                _avg: {
                    rating_overall: true,
                    rating_placement: true,
                    rating_faculty: true,
                    rating_infra: true,
                },
            }),
        ]);
        res.json({
            reviews: reviews,
            total,
            aggregate_ratings: buildAggregateRatings(aggregate._avg),
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
