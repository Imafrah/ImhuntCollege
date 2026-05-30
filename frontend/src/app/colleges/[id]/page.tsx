"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, type Control, useForm } from "react-hook-form";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useShortlist } from "@/hooks/useShortlist";
import { apiFetch } from "@/lib/api";
import type {
  AdmissionCutoff,
  CareerTrendsResult,
  College,
  CutoffCategory,
  PredictorResult,
  Review,
  ReviewsResult,
} from "@/types/college";

type DetailTab =
  | "Overview"
  | "Courses & Fees"
  | "Placements"
  | "Career Trends"
  | "Reviews"
  | "Admission";

type PredictorCategory = CutoffCategory;
type PredictorForm = {
  exam: string;
  percentile: string;
  category: PredictorCategory;
};

const tabs: DetailTab[] = [
  "Overview",
  "Courses & Fees",
  "Placements",
  "Career Trends",
  "Reviews",
  "Admission",
];

const categories: CutoffCategory[] = ["GENERAL", "OBC", "SC", "ST"];
const currentYear = new Date().getFullYear();

const reviewSchema = z.object({
  author_name: z.string().trim().min(1, "author_name is required"),
  batch_year: z.coerce
    .number()
    .int("batch_year must be an integer")
    .min(2010, "batch_year must be between 2010 and the current year")
    .max(currentYear, "batch_year must be between 2010 and the current year"),
  stream: z.string().trim().min(1, "stream is required"),
  rating_overall: z.coerce
    .number()
    .min(1, "rating_overall must be between 1.0 and 5.0")
    .max(5, "rating_overall must be between 1.0 and 5.0"),
  rating_placement: z.coerce
    .number()
    .min(1, "rating_placement must be between 1.0 and 5.0")
    .max(5, "rating_placement must be between 1.0 and 5.0"),
  rating_faculty: z.coerce
    .number()
    .min(1, "rating_faculty must be between 1.0 and 5.0")
    .max(5, "rating_faculty must be between 1.0 and 5.0"),
  rating_infra: z.coerce
    .number()
    .min(1, "rating_infra must be between 1.0 and 5.0")
    .max(5, "rating_infra must be between 1.0 and 5.0"),
  body: z.string().trim().min(80, "body must be at least 80 characters"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

function formatFee(value: number) {
  return `${new Intl.NumberFormat("en-IN").format(value)} / year`;
}

function formatPackage(value: number) {
  return `${value.toFixed(1)} LPA`;
}

function getLatestPlacement(college: College) {
  return college.placements?.[0] ?? college.latestPlacement ?? null;
}

function StarRating({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span className="w-20 font-medium">{label}</span>
      <div className="flex">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className="h-4 w-4"
            color={index < Math.round(value) ? "#006AFF" : "#d1d5db"}
            fill={index < Math.round(value) ? "#006AFF" : "none"}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="font-medium text-gray-900">{value.toFixed(1)}</span>
    </div>
  );
}

function RatingSlider({
  control,
  name,
  label,
}: {
  control: Control<ReviewFormValues>;
  name:
    | "rating_overall"
    | "rating_placement"
    | "rating_faculty"
    | "rating_infra";
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="grid gap-3">
          <span className="flex items-center justify-between text-sm font-bold text-gray-900">
            {label}
            <span className="text-accent">{Number(field.value).toFixed(1)}</span>
          </span>
          <Slider
            min={1}
            max={5}
            step={0.5}
            value={[Number(field.value)]}
            onValueChange={(value) => field.onChange(value[0] ?? 1)}
          />
        </label>
      )}
    />
  );
}

function OverviewTab({ college }: { college: College }) {
  const latestPlacement = getLatestPlacement(college);
  const recruiters = latestPlacement?.top_recruiters.slice(0, 3) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-gray-900">
          College profile
        </h2>
        <div className="mt-5 grid gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Type</p>
            <p className="text-base font-bold text-gray-900">{college.type}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Established</p>
            <p className="text-base font-bold text-gray-900">
              {college.established}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Streams offered
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {college.streams.map((stream) => (
            <span
              key={stream}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700"
            >
              {stream}
            </span>
          ))}
        </div>
        <h3 className="mt-8 text-base font-bold text-gray-900">
          Top recruiters
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {recruiters.length > 0 ? (
            recruiters.map((recruiter) => (
              <span
                key={recruiter}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700"
              >
                {recruiter}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-600">Not available</p>
          )}
        </div>
      </section>
    </div>
  );
}

function CoursesTab({ college }: { college: College }) {
  const fees = college.courseFees ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {fees.map((courseFee) => (
        <article
          key={courseFee.id}
          className="rounded-lg border border-gray-200 bg-white p-6"
        >
          <h2 className="font-display text-lg font-bold text-gray-900">
            {courseFee.course}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{courseFee.degree}</p>
          <p className="mt-5 text-xl font-bold text-gray-900">
            {formatFee(courseFee.annual_fee)}
          </p>
        </article>
      ))}
    </div>
  );
}

function PlacementsTab({ college }: { college: College }) {
  const placements = [...(college.placements ?? [])].sort(
    (left, right) => left.year - right.year,
  );
  const chartData = placements.map((placement) => ({
    year: String(placement.year),
    avg_pkg: placement.avg_pkg,
  }));
  const latestPlacement = getLatestPlacement(college);

  return (
    <div className="grid gap-6">
      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Avg package by year
        </h2>
        <div className="mt-6 min-w-[680px]">
          <BarChart width={720} height={280} data={chartData}>
            <XAxis dataKey="year" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="avg_pkg" fill="#006AFF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold text-gray-900">
            Year-on-year trend
          </h2>
          <div className="mt-5 grid gap-3">
            {placements.map((placement, index) => {
              const previous = placements[index - 1];
              const trend =
                previous && placement.avg_pkg >= previous.avg_pkg ? "up" : "down";

              return (
                <div
                  key={placement.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                >
                  <span className="font-bold text-gray-900">
                    {placement.year}
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: trend === "up" ? "#047857" : "#b91c1c" }}
                  >
                    {index === 0 ? "Baseline" : trend === "up" ? "Up" : "Down"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold text-gray-900">
            Top recruiters
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {(latestPlacement?.top_recruiters ?? []).map((recruiter) => (
              <span
                key={recruiter}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700"
              >
                {recruiter}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function CareerTrendsTab({
  careerTrends,
}: {
  careerTrends: CareerTrendsResult | null;
}) {
  if (!careerTrends) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm font-medium text-gray-700">
          Career trends are not available for this college yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">High growth</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {careerTrends.summary.high_growth_count}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Stable</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {careerTrends.summary.stable_count}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Declining</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {careerTrends.summary.declining_count}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {careerTrends.trends.map((trend) => (
          <article
            key={trend.recruiter}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-gray-900">
                  {trend.recruiter}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{trend.industry}</p>
              </div>
              <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-bold text-gray-700">
                {trend.growth_tag}
              </span>
            </div>
            <p className="mt-5 text-sm font-bold text-gray-900">
              {trend.salary_band_lpa.min}-{trend.salary_band_lpa.max} LPA
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {trend.role_clusters.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ReviewsTab({
  collegeId,
  initialReviews,
  initialTotal,
  aggregateRatings,
}: {
  collegeId: number;
  initialReviews: Review[];
  initialTotal: number;
  aggregateRatings: ReviewsResult["aggregate_ratings"];
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      author_name: "",
      batch_year: currentYear,
      stream: "",
      rating_overall: 4,
      rating_placement: 4,
      rating_faculty: 4,
      rating_infra: 4,
      body: "",
    },
  });
  const bodyLength = watch("body").length;

  useEffect(() => {
    setReviews(initialReviews);
    setTotal(initialTotal);
  }, [initialReviews, initialTotal]);

  async function loadMoreReviews() {
    setIsLoadingMore(true);

    try {
      const data = await apiFetch<ReviewsResult>(
        `/api/colleges/${collegeId}/reviews?limit=5&offset=${reviews.length}`,
      );
      setReviews((current) => [...current, ...data.reviews]);
      setTotal(data.total);
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function submitReview(values: ReviewFormValues) {
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      await apiFetch<Review>(`/api/colleges/${collegeId}/reviews`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      reset();
      setSubmitMessage("Review submitted for approval");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit review",
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <section className="grid gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-bold text-gray-900">
            Approved reviews: {total}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Average overall rating:{" "}
            {aggregateRatings.rating_overall?.toFixed(1) ?? "Not available"}
          </p>
        </div>
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-gray-900">
                  {review.author_name}
                </h2>
                <p className="text-sm text-gray-600">
                  Batch {review.batch_year} - {review.stream}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              <StarRating value={review.rating_overall} label="Overall" />
              <StarRating value={review.rating_placement} label="Placement" />
              <StarRating value={review.rating_faculty} label="Faculty" />
              <StarRating value={review.rating_infra} label="Infra" />
            </div>
            <p className="mt-5 text-sm leading-6 text-gray-700">{review.body}</p>
          </article>
        ))}
        {reviews.length < total ? (
          <Button
            type="button"
            variant="outline"
            onClick={loadMoreReviews}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading" : "Load more"}
          </Button>
        ) : null}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Submit a review
        </h2>
        <form className="mt-6 grid gap-5" onSubmit={handleSubmit(submitReview)}>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-gray-900">Name</span>
            <input
              {...register("author_name")}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            />
            {errors.author_name ? (
              <span className="text-sm text-red-700">
                {errors.author_name.message}
              </span>
            ) : null}
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-gray-900">Batch year</span>
            <input
              type="number"
              {...register("batch_year")}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            />
            {errors.batch_year ? (
              <span className="text-sm text-red-700">
                {errors.batch_year.message}
              </span>
            ) : null}
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-gray-900">Stream</span>
            <input
              {...register("stream")}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            />
            {errors.stream ? (
              <span className="text-sm text-red-700">
                {errors.stream.message}
              </span>
            ) : null}
          </label>

          <RatingSlider control={control} name="rating_overall" label="Overall" />
          <RatingSlider
            control={control}
            name="rating_placement"
            label="Placement"
          />
          <RatingSlider control={control} name="rating_faculty" label="Faculty" />
          <RatingSlider control={control} name="rating_infra" label="Infra" />

          <label className="grid gap-2">
            <span className="flex items-center justify-between text-sm font-bold text-gray-900">
              Review
              <span className="text-gray-500">{bodyLength}/80</span>
            </span>
            <textarea
              rows={5}
              {...register("body")}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            />
            {errors.body ? (
              <span className="text-sm text-red-700">{errors.body.message}</span>
            ) : null}
          </label>

          {submitMessage ? (
            <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
              {submitMessage}
            </p>
          ) : null}
          {submitError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {submitError}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting" : "Submit review"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function AdmissionCard({
  category,
  year,
  cutoff,
}: {
  category: CutoffCategory;
  year: number;
  cutoff: AdmissionCutoff | undefined;
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-bold text-gray-900">{category}</p>
      <p className="mt-1 text-sm text-gray-600">{year}</p>
      <p className="mt-4 text-xl font-bold text-gray-900">
        {cutoff ? cutoff.cutoff_value : "Not available"}
      </p>
      <p className="mt-1 text-sm text-gray-600">{cutoff?.exam ?? "Cutoff"}</p>
    </article>
  );
}

function AdmissionTab({ college }: { college: College }) {
  const examOptions = Array.from(
    new Set((college.cutoffs ?? []).map((cutoff) => cutoff.exam)),
  );
  const [predictorForm, setPredictorForm] = useState<PredictorForm>({
    exam: examOptions.find((exam) => exam.toUpperCase().includes("JEE")) ?? examOptions[0] ?? "JEE",
    percentile: "92",
    category: "GENERAL",
  });
  const [predictorResult, setPredictorResult] =
    useState<PredictorResult | null>(null);
  const [predictorError, setPredictorError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const cutoffs = college.cutoffs ?? [];
  const years = Array.from(new Set(cutoffs.map((cutoff) => cutoff.year))).sort(
    (left, right) => right - left,
  );

  async function runPredictor() {
    setIsPredicting(true);
    setPredictorError(null);
    setPredictorResult(null);

    const exam = predictorForm.exam.toUpperCase().includes("JEE")
      ? "JEE"
      : predictorForm.exam;
    const params = new URLSearchParams({
      exam,
      percentile: predictorForm.percentile,
      category: predictorForm.category,
    });

    try {
      const data = await apiFetch<PredictorResult>(
        `/api/predictor/${college.id}?${params.toString()}`,
      );
      setPredictorResult(data);
    } catch (error) {
      setPredictorError(
        error instanceof Error ? error.message : "Unable to run predictor",
      );
    } finally {
      setIsPredicting(false);
    }
  }

  const probabilityStyle =
    predictorResult?.probability === "high"
      ? { backgroundColor: "#dcfce7", color: "#047857", width: "100%" }
      : predictorResult?.probability === "medium"
        ? { backgroundColor: "#fef9c3", color: "#a16207", width: "66%" }
        : { backgroundColor: "#fee2e2", color: "#b91c1c", width: "33%" };

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="font-display text-xl font-bold text-gray-900">
          Cutoffs by category
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {years.flatMap((year) =>
            categories.map((category) => (
              <AdmissionCard
                key={`${year}-${category}`}
                category={category}
                year={year}
                cutoff={cutoffs.find(
                  (cutoff) =>
                    cutoff.year === year && cutoff.category === category,
                )}
              />
            )),
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Admission predictor
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-gray-900">Exam</span>
            <select
              value={predictorForm.exam}
              onChange={(event) =>
                setPredictorForm((current) => ({
                  ...current,
                  exam: event.target.value,
                }))
              }
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            >
              {(examOptions.length > 0 ? examOptions : ["JEE"]).map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-gray-900">Percentile</span>
            <input
              type="number"
              value={predictorForm.percentile}
              onChange={(event) =>
                setPredictorForm((current) => ({
                  ...current,
                  percentile: event.target.value,
                }))
              }
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-gray-900">Category</span>
            <select
              value={predictorForm.category}
              onChange={(event) =>
                setPredictorForm((current) => ({
                  ...current,
                  category: event.target.value as PredictorCategory,
                }))
              }
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button
          type="button"
          onClick={runPredictor}
          disabled={isPredicting}
          className="mt-5"
        >
          {isPredicting ? "Checking" : "Check probability"}
        </Button>

        {predictorResult ? (
          <div className="mt-6">
            <div className="h-10 rounded-full border border-gray-200 bg-white p-1">
              <div
                className="flex h-full items-center justify-center rounded-full text-sm font-bold uppercase"
                style={probabilityStyle}
              >
                {predictorResult.probability}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {predictorResult.rank_context ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4 md:col-span-3">
                  <p className="text-sm font-bold text-gray-900">
                    Estimated rank:{" "}
                    {predictorResult.rank_context.estimated_rank?.toLocaleString(
                      "en-IN",
                    ) ?? "Not available"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {predictorResult.rank_context.assumption}
                  </p>
                </div>
              ) : null}
              {predictorResult.cutoff_context.map((item) => (
                <div
                  key={item.year}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <p className="text-sm font-bold text-gray-900">{item.year}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Cutoff {item.cutoff}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {predictorError ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {predictorError}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default function CollegeDetailPage() {
  const params = useParams<{ id: string }>();
  const collegeId = Number(params.id);
  const [college, setCollege] = useState<College | null>(null);
  const [careerTrends, setCareerTrends] = useState<CareerTrendsResult | null>(
    null,
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [aggregateRatings, setAggregateRatings] = useState<
    ReviewsResult["aggregate_ratings"]
  >({
    rating_overall: null,
    rating_placement: null,
    rating_faculty: null,
    rating_infra: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
  const { isShortlisted, toggleShortlist } = useShortlist();

  useEffect(() => {
    if (!Number.isInteger(collegeId) || collegeId <= 0) {
      setError("Invalid college id");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const [collegeData, reviewsData] = await Promise.all([
          apiFetch<College>(`/api/colleges/${collegeId}`),
          apiFetch<ReviewsResult>(
            `/api/colleges/${collegeId}/reviews?limit=5&offset=0`,
          ),
        ]);
        const trendsData = await apiFetch<CareerTrendsResult>(
          `/api/colleges/${collegeId}/career-trends`,
        ).catch(() => null);

        if (isMounted) {
          setCollege(collegeData);
          setReviews(reviewsData.reviews);
          setReviewTotal(reviewsData.total);
          setAggregateRatings(reviewsData.aggregate_ratings);
          setCareerTrends(trendsData);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load college",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [collegeId]);

  const isSaved = isShortlisted(collegeId);
  const websiteUrl = college?.website ?? "#";

  const tabContent = useMemo(() => {
    if (!college) {
      return null;
    }

    if (activeTab === "Overview") {
      return <OverviewTab college={college} />;
    }

    if (activeTab === "Courses & Fees") {
      return <CoursesTab college={college} />;
    }

    if (activeTab === "Placements") {
      return <PlacementsTab college={college} />;
    }

    if (activeTab === "Career Trends") {
      return <CareerTrendsTab careerTrends={careerTrends} />;
    }

    if (activeTab === "Reviews") {
      return (
        <ReviewsTab
          collegeId={college.id}
          initialReviews={reviews}
          initialTotal={reviewTotal}
          aggregateRatings={aggregateRatings}
        />
      );
    }

    return <AdmissionTab college={college} />;
  }, [activeTab, aggregateRatings, careerTrends, college, reviewTotal, reviews]);

  if (isLoading) {
    return (
      <div className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="mt-8 h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-base font-medium text-gray-900">
            {error ?? "College not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {college.nirf_rank ? (
                  <span className="rounded-full border border-accent bg-white px-3 py-1 text-sm font-bold text-accent">
                    NIRF #{college.nirf_rank}
                  </span>
                ) : null}
                <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700">
                  {college.accreditation}
                </span>
              </div>
              <h1 className="mt-5 font-display text-[34px] font-bold leading-tight text-gray-900 sm:text-4xl">
                {college.name}
              </h1>
              <p className="mt-3 text-base text-gray-700">
                {college.city}, {college.state}
              </p>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent"
              >
                Visit website
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => toggleShortlist(college.id)}
              >
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button asChild>
                <a href={websiteUrl} target="_blank" rel="noreferrer">
                  Apply
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="shrink-0 rounded-md border px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-accent"
                style={
                  activeTab === tab
                    ? {
                        borderColor: "#006AFF",
                        color: "#006AFF",
                        backgroundColor: "rgba(0, 106, 255, 0.06)",
                      }
                    : {
                        borderColor: "#e5e7eb",
                        color: "#374151",
                        backgroundColor: "#ffffff",
                      }
                }
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mt-8">{tabContent}</div>
        </div>
      </section>
    </div>
  );
}
