export type ScoreWeights = {
  placement: number;
  fees: number;
  location: number;
};

export type ScoreCollegeInput = {
  college_id: number;
  name: string;
  city: string;
  avg_pkg: number | null;
  annual_fee: number | null;
};

export type ScoredCollege = {
  college_id: number;
  name: string;
  city: string;
  final_score: number;
  dimension_scores: {
    placement: number;
    fees: number;
    location: number;
  };
};

function metricRange(values: Array<number | null>): { min: number; max: number } | null {
  const numericValues = values.filter((value): value is number => value !== null);

  if (numericValues.length === 0) {
    return null;
  }

  return {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
  };
}

function normalizeHigherIsBetter(value: number | null, range: { min: number; max: number } | null): number {
  if (value === null || range === null) {
    return 0;
  }

  if (range.max === range.min) {
    return 1;
  }

  return (value - range.min) / (range.max - range.min);
}

function normalizeLowerIsBetter(value: number | null, range: { min: number; max: number } | null): number {
  if (value === null || range === null) {
    return 0;
  }

  if (range.max === range.min) {
    return 1;
  }

  return 1 - (value - range.min) / (range.max - range.min);
}

function roundOneDecimal(value: number): number {
  return Number(value.toFixed(1));
}

function roundFourDecimals(value: number): number {
  return Number(value.toFixed(4));
}

export function scoreColleges(colleges: ScoreCollegeInput[], weights: ScoreWeights): ScoredCollege[] {
  const placementRange = metricRange(colleges.map((college) => college.avg_pkg));
  const feeRange = metricRange(colleges.map((college) => college.annual_fee));

  return colleges
    .map((college) => {
      const placement = normalizeHigherIsBetter(college.avg_pkg, placementRange);
      const fees = normalizeLowerIsBetter(college.annual_fee, feeRange);
      const location = 0.5;
      const weightedScore = placement * weights.placement + fees * weights.fees + location * weights.location;

      return {
        college_id: college.college_id,
        name: college.name,
        city: college.city,
        final_score: roundOneDecimal(weightedScore * 100),
        dimension_scores: {
          placement: roundFourDecimals(placement),
          fees: roundFourDecimals(fees),
          location,
        },
      };
    })
    .sort((left, right) => {
      if (right.final_score !== left.final_score) {
        return right.final_score - left.final_score;
      }

      return left.college_id - right.college_id;
    });
}
