import { describe, expect, it } from "vitest";
import {
  buildAggregateRatings,
  createReviewSchema,
  paginationSchema,
  toFieldErrors,
} from "./review-validation.js";

describe("review validation", () => {
  it("returns field-level errors for invalid review submissions", () => {
    const parsed = createReviewSchema.safeParse({
      author_name: "",
      batch_year: 2009,
      stream: "",
      rating_overall: 6,
      rating_placement: 0,
      rating_faculty: 4,
      body: "Too short",
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(toFieldErrors(parsed.error)).toEqual({
        author_name: "author_name is required",
        batch_year: "batch_year must be between 2010 and the current year",
        stream: "stream is required",
        rating_overall: "rating_overall must be between 1.0 and 5.0",
        rating_placement: "rating_placement must be between 1.0 and 5.0",
        rating_infra: "Expected number, received nan",
        body: "body must be at least 80 characters",
      });
    }
  });

  it("accepts valid review bodies and leaves them pending for moderation", () => {
    const parsed = createReviewSchema.safeParse({
      author_name: "A Student",
      batch_year: 2024,
      stream: "Engineering",
      rating_overall: 4.5,
      rating_placement: 4,
      rating_faculty: 5,
      rating_infra: 4,
      body: "The college has strong placements, helpful faculty, and enough academic support for students who use the opportunities well.",
    });

    expect(parsed.success).toBe(true);
  });

  it("enforces pagination bounds", () => {
    expect(paginationSchema.parse({})).toEqual({ limit: 10, offset: 0 });
    expect(paginationSchema.safeParse({ limit: 51, offset: 0 }).success).toBe(false);
    expect(paginationSchema.safeParse({ limit: 10, offset: -1 }).success).toBe(false);
  });

  it("rounds live rating aggregates to two decimals", () => {
    expect(
      buildAggregateRatings({
        rating_overall: 4.236,
        rating_placement: 4.5,
        rating_faculty: null,
        rating_infra: 3.999,
      }),
    ).toEqual({
      rating_overall: 4.24,
      rating_placement: 4.5,
      rating_faculty: null,
      rating_infra: 4,
    });
  });
});
