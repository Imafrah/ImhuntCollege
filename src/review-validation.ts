import { z } from "zod";

export type FieldErrors = Record<string, string>;

export type AggregateRatings = {
  rating_overall: number | null;
  rating_placement: number | null;
  rating_faculty: number | null;
  rating_infra: number | null;
};

const currentYear = new Date().getFullYear();

export const collegeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createReviewSchema = z.object({
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

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export function toFieldErrors(error: z.ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const field = String(issue.path[0] ?? "request");

    if (!errors[field]) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}

function roundAverage(value: number | null): number | null {
  return value === null ? null : Number(value.toFixed(2));
}

export function buildAggregateRatings(avg: {
  rating_overall: number | null;
  rating_placement: number | null;
  rating_faculty: number | null;
  rating_infra: number | null;
}): AggregateRatings {
  return {
    rating_overall: roundAverage(avg.rating_overall),
    rating_placement: roundAverage(avg.rating_placement),
    rating_faculty: roundAverage(avg.rating_faculty),
    rating_infra: roundAverage(avg.rating_infra),
  };
}
