import { describe, expect, it } from "vitest";
import { scoreColleges, type ScoreCollegeInput } from "./scoring.js";

const baseColleges: ScoreCollegeInput[] = [
  {
    college_id: 1,
    name: "Alpha Institute",
    city: "Delhi",
    avg_pkg: 10,
    annual_fee: 500000,
  },
  {
    college_id: 2,
    name: "Beta Institute",
    city: "Mumbai",
    avg_pkg: 20,
    annual_fee: 1500000,
  },
  {
    college_id: 3,
    name: "Gamma Institute",
    city: "Chennai",
    avg_pkg: 30,
    annual_fee: 2500000,
  },
];

describe("scoreColleges", () => {
  it("scores deterministically with all near-equal weights", () => {
    const results = scoreColleges(baseColleges, {
      placement: 0.33,
      fees: 0.33,
      location: 0.33,
    });

    expect(results).toEqual([
      {
        college_id: 1,
        name: "Alpha Institute",
        city: "Delhi",
        score: 49.5,
        final_score: 49.5,
        dimension_scores: { placement: 0, fees: 1, location: 0.5 },
      },
      {
        college_id: 2,
        name: "Beta Institute",
        city: "Mumbai",
        score: 49.5,
        final_score: 49.5,
        dimension_scores: { placement: 0.5, fees: 0.5, location: 0.5 },
      },
      {
        college_id: 3,
        name: "Gamma Institute",
        city: "Chennai",
        score: 49.5,
        final_score: 49.5,
        dimension_scores: { placement: 1, fees: 0, location: 0.5 },
      },
    ]);
  });

  it("ranks by placement when placement has 100 percent weight", () => {
    const results = scoreColleges(baseColleges, {
      placement: 1,
      fees: 0,
      location: 0,
    });

    expect(results.map((college) => college.college_id)).toEqual([3, 2, 1]);
    expect(results.map((college) => college.final_score)).toEqual([100, 50, 0]);
  });

  it("handles an extreme fee range where one college is 5L and another is 25L per year", () => {
    const results = scoreColleges(
      [
        {
          college_id: 1,
          name: "Value College",
          city: "Pune",
          avg_pkg: 10,
          annual_fee: 500000,
        },
        {
          college_id: 2,
          name: "Premium College",
          city: "Bengaluru",
          avg_pkg: 10,
          annual_fee: 2500000,
        },
      ],
      {
        placement: 0,
        fees: 1,
        location: 0,
      },
    );

    expect(results).toEqual([
      {
        college_id: 1,
        name: "Value College",
        city: "Pune",
        score: 100,
        final_score: 100,
        dimension_scores: { placement: 1, fees: 1, location: 0.5 },
      },
      {
        college_id: 2,
        name: "Premium College",
        city: "Bengaluru",
        score: 0,
        final_score: 0,
        dimension_scores: { placement: 1, fees: 0, location: 0.5 },
      },
    ]);
  });
});
