import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();

const reviewParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const authorizationHeaderSchema = z.object({
  authorization: z.string().trim().min(1),
});

router.use((req, res, next) => {
  const headers = authorizationHeaderSchema.safeParse({
    authorization: req.header("authorization"),
  });
  const expectedAuthorization = process.env.ADMIN_API_KEY ? `Bearer ${process.env.ADMIN_API_KEY}` : undefined;

  if (!headers.success || !expectedAuthorization || headers.data.authorization !== expectedAuthorization) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
});

router.post("/reviews/:id/approve", async (req, res, next) => {
  try {
    const params = reviewParamsSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({ errors: { id: "id must be a positive integer" } });
      return;
    }

    const review = await prisma.review.findUnique({
      where: { id: params.data.id },
      select: { id: true },
    });

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    const updatedReview = await prisma.review.update({
      where: { id: params.data.id },
      data: { status: "APPROVED" },
    });

    res.json(updatedReview);
  } catch (error) {
    next(error);
  }
});

router.post("/reviews/:id/reject", async (req, res, next) => {
  try {
    const params = reviewParamsSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({ errors: { id: "id must be a positive integer" } });
      return;
    }

    const review = await prisma.review.findUnique({
      where: { id: params.data.id },
      select: { id: true },
    });

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    const updatedReview = await prisma.review.update({
      where: { id: params.data.id },
      data: { status: "REJECTED" },
    });

    res.json(updatedReview);
  } catch (error) {
    next(error);
  }
});

export default router;
