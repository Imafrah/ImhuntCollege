export type CollegeType = "GOVT" | "PRIVATE" | "DEEMED";

export type CutoffCategory = "GENERAL" | "OBC" | "SC" | "ST";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CourseFee {
  id: number;
  college_id: number;
  course: string;
  degree: string;
  annual_fee: number;
}

export interface PlacementStat {
  id: number;
  college_id: number;
  year: number;
  avg_pkg: number;
  max_pkg: number;
  placement_pct: number;
  top_recruiters: string[];
}

export interface AdmissionCutoff {
  id: number;
  college_id: number;
  exam: string;
  year: number;
  category: CutoffCategory;
  cutoff_value: number;
}

export interface Review {
  id: number;
  college_id: number;
  author_name: string;
  batch_year: number;
  stream: string;
  rating_overall: number;
  rating_placement: number;
  rating_faculty: number;
  rating_infra: number;
  body: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface RatingAverages {
  rating_overall: number | null;
  rating_placement: number | null;
  rating_faculty: number | null;
  rating_infra: number | null;
}

export interface College {
  id: number;
  name: string;
  city: string;
  state: string;
  type: CollegeType;
  streams: string[];
  nirf_rank: number | null;
  established: number;
  accreditation: string;
  website: string;
  createdAt?: string;
  latestPlacement?: PlacementStat | null;
  minCourseFee?: CourseFee | null;
  courseFees?: CourseFee[];
  placements?: PlacementStat[];
  cutoffs?: AdmissionCutoff[];
  reviews?: Review[];
  aggregateRatings?: RatingAverages;
  minAnnualFee?: number | null;
}

export interface CompareWinner {
  college_id: number;
  college_name: string;
  value: number;
}

export interface CompareResult {
  colleges: Array<
    College & {
      courseFees: CourseFee[];
      placements: PlacementStat[];
      minAnnualFee: number | null;
      latestPlacement: PlacementStat | null;
    }
  >;
  winners: {
    fees: CompareWinner | null;
    placement: CompareWinner | null;
    nirf_rank: CompareWinner | null;
  };
}

export interface ScoreResult {
  college_id: number;
  name: string;
  city: string;
  score: number;
  final_score: number;
  dimension_scores: {
    placement: number;
    fees: number;
    location: number;
  };
}

export interface PredictorResult {
  probability: "high" | "medium" | "low";
  rank_context: {
    exam: string;
    estimated_rank: number | null;
    assumption: string;
  } | null;
  cutoff_context: Array<{
    year: number;
    cutoff: number;
  }>;
}

export interface CareerTrend {
  recruiter: string;
  industry: string;
  role_clusters: string[];
  salary_band_lpa: {
    min: number;
    max: number;
  };
  growth_tag: "High Growth" | "Stable" | "Declining";
}

export interface CareerTrendsResult {
  college_id: number;
  college_name: string;
  trends: CareerTrend[];
  summary: {
    high_growth_count: number;
    stable_count: number;
    declining_count: number;
  };
}

export interface ReviewsResult {
  reviews: Review[];
  total: number;
  aggregate_ratings: RatingAverages;
}

export type UserPriority = "Fees" | "Placement" | "Location";

export interface UserPreferences {
  streamInterest: "Engineering" | "Medical" | "Commerce" | "Law";
  examGiven: "JEE" | "CUET" | "NEET" | "State";
  priority: UserPriority;
}
