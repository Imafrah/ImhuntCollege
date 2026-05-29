import { Router } from "express";
import { prisma } from "../db.js";
import { buildAggregateRatings, collegeParamsSchema, createReviewSchema, paginationSchema, toFieldErrors, } from "../review-validation.js";
const router = Router();
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
