"use client";

import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useShortlist } from "@/hooks/useShortlist";
import { apiFetch } from "@/lib/api";
import type { CompareResult, ScoreResult } from "@/types/college";

type CompareCollege = CompareResult["colleges"][number];

type Weights = {
  placement: number;
  fees: number;
  location: number;
};

type MetricKey =
  | "fees"
  | "avgPlacement"
  | "maxPlacement"
  | "nirfRank"
  | "location"
  | "accreditation"
  | "streams";

type MetricRow = {
  key: MetricKey;
  label: string;
  getValue: (college: CompareCollege) => number | string | null;
  format: (value: number | string | null) => string;
  winnerId: number | null;
};

const defaultWeights: Weights = {
  placement: 60,
  fees: 30,
  location: 10,
};

const weightLabels: Array<{ key: keyof Weights; label: string }> = [
  { key: "placement", label: "Placement" },
  { key: "fees", label: "Fees" },
  { key: "location", label: "Location" },
];

function clampWeight(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseNumberParam(value: string | null) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWeights(weights: Weights): Weights {
  const placement = clampWeight(weights.placement);
  const fees = clampWeight(weights.fees);
  const location = clampWeight(weights.location);
  const total = placement + fees + location;

  if (total === 100) {
    return { placement, fees, location };
  }

  if (total === 0) {
    return defaultWeights;
  }

  const normalizedPlacement = Math.round((placement / total) * 100);
  const normalizedFees = Math.round((fees / total) * 100);

  return {
    placement: normalizedPlacement,
    fees: normalizedFees,
    location: 100 - normalizedPlacement - normalizedFees,
  };
}

function readWeights(searchParams: URLSearchParams): Weights {
  const placement = parseNumberParam(searchParams.get("w_placement"));
  const fees = parseNumberParam(searchParams.get("w_fees"));
  const location = parseNumberParam(searchParams.get("w_location"));

  if (placement === null && fees === null && location === null) {
    return defaultWeights;
  }

  return normalizeWeights({
    placement: placement ?? defaultWeights.placement,
    fees: fees ?? defaultWeights.fees,
    location: location ?? defaultWeights.location,
  });
}

function rebalanceWeights(
  current: Weights,
  changedKey: keyof Weights,
  nextValue: number,
): Weights {
  const nextChangedValue = clampWeight(nextValue);
  const remaining = 100 - nextChangedValue;
  const otherKeys = weightLabels
    .map((item) => item.key)
    .filter((key) => key !== changedKey);
  const firstKey = otherKeys[0];
  const secondKey = otherKeys[1];
  const otherTotal = current[firstKey] + current[secondKey];

  if (otherTotal === 0) {
    const firstValue = Math.round(remaining / 2);

    return {
      ...current,
      [changedKey]: nextChangedValue,
      [firstKey]: firstValue,
      [secondKey]: remaining - firstValue,
    };
  }

  const firstValue = Math.round((current[firstKey] / otherTotal) * remaining);

  return {
    ...current,
    [changedKey]: nextChangedValue,
    [firstKey]: firstValue,
    [secondKey]: remaining - firstValue,
  };
}

function formatCurrency(value: number | string | null) {
  if (typeof value !== "number") {
    return "Not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPackage(value: number | string | null) {
  if (typeof value !== "number") {
    return "Not available";
  }

  return `${value.toFixed(1)} LPA`;
}

function formatRank(value: number | string | null) {
  if (typeof value !== "number") {
    return "Not ranked";
  }

  return String(value);
}

function formatText(value: number | string | null) {
  if (typeof value === "number") {
    return String(value);
  }

  return value ?? "Not available";
}

function getMinAnnualFee(college: CompareCollege) {
  return college.minAnnualFee ?? college.courseFees[0]?.annual_fee ?? null;
}

function getLatestPlacement(college: CompareCollege) {
  return college.latestPlacement ?? college.placements[0] ?? null;
}

function getWinnerId(
  colleges: CompareCollege[],
  getValue: (college: CompareCollege) => number | null,
  mode: "lowest" | "highest",
) {
  const ranked = colleges
    .map((college) => ({ collegeId: college.id, value: getValue(college) }))
    .filter(
      (item): item is { collegeId: number; value: number } =>
        item.value !== null,
    )
    .sort((left, right) =>
      mode === "lowest" ? left.value - right.value : right.value - left.value,
    );

  return ranked[0]?.collegeId ?? null;
}

function metricRows(result: CompareResult): MetricRow[] {
  return [
    {
      key: "fees",
      label: "Fees (min annual)",
      getValue: getMinAnnualFee,
      format: formatCurrency,
      winnerId: result.winners.fees?.college_id ?? null,
    },
    {
      key: "avgPlacement",
      label: "Avg Placement",
      getValue: (college) => getLatestPlacement(college)?.avg_pkg ?? null,
      format: formatPackage,
      winnerId: result.winners.placement?.college_id ?? null,
    },
    {
      key: "maxPlacement",
      label: "Max Placement",
      getValue: (college) => getLatestPlacement(college)?.max_pkg ?? null,
      format: formatPackage,
      winnerId: getWinnerId(
        result.colleges,
        (college) => getLatestPlacement(college)?.max_pkg ?? null,
        "highest",
      ),
    },
    {
      key: "nirfRank",
      label: "NIRF Rank",
      getValue: (college) => college.nirf_rank,
      format: formatRank,
      winnerId: result.winners.nirf_rank?.college_id ?? null,
    },
    {
      key: "location",
      label: "Location",
      getValue: (college) => `${college.city}, ${college.state}`,
      format: formatText,
      winnerId: null,
    },
    {
      key: "accreditation",
      label: "Accreditation",
      getValue: (college) => college.accreditation,
      format: formatText,
      winnerId: null,
    },
    {
      key: "streams",
      label: "Streams",
      getValue: (college) => college.streams.join(", "),
      format: formatText,
      winnerId: null,
    },
  ];
}

function metricHasDifferences(row: MetricRow, colleges: CompareCollege[]) {
  const values = colleges.map(row.getValue);

  if (values.every((value) => typeof value === "number" || value === null)) {
    const numbers = values.filter((value): value is number => value !== null);

    if (numbers.length !== values.length) {
      return true;
    }

    return Math.max(...numbers) - Math.min(...numbers) > 0.01;
  }

  const normalizedValues = values.map((value) =>
    String(value ?? "").trim().toLowerCase(),
  );

  return new Set(normalizedValues).size > 1;
}

function metricRange(values: Array<number | null>) {
  const numericValues = values.filter((value): value is number => value !== null);

  if (numericValues.length === 0) {
    return null;
  }

  return {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
  };
}

function normalizeHigherIsBetter(
  value: number | null,
  range: { min: number; max: number } | null,
) {
  if (value === null || range === null) {
    return 0;
  }

  if (range.max === range.min) {
    return 1;
  }

  return (value - range.min) / (range.max - range.min);
}

function normalizeLowerIsBetter(
  value: number | null,
  range: { min: number; max: number } | null,
) {
  if (value === null || range === null) {
    return 0;
  }

  if (range.max === range.min) {
    return 1;
  }

  return 1 - (value - range.min) / (range.max - range.min);
}

function scoreColleges(colleges: CompareCollege[], weights: Weights) {
  const placementRange = metricRange(
    colleges.map((college) => getLatestPlacement(college)?.avg_pkg ?? null),
  );
  const feeRange = metricRange(colleges.map(getMinAnnualFee));

  return colleges.map((college) => {
    const placement = normalizeHigherIsBetter(
      getLatestPlacement(college)?.avg_pkg ?? null,
      placementRange,
    );
    const fees = normalizeLowerIsBetter(getMinAnnualFee(college), feeRange);
    const location = 0.5;
    const score =
      placement * (weights.placement / 100) +
      fees * (weights.fees / 100) +
      location * (weights.location / 100);

    return {
      collegeId: college.id,
      score: Number((score * 100).toFixed(1)),
    };
  });
}

function scoreRequestBody(weights: Weights) {
  return {
    weights: {
      placement: weights.placement / 100,
      fees: weights.fees / 100,
      location: weights.location / 100,
    },
    filters: {},
  };
}

function buildComparePath(ids: string, weights: Weights) {
  const params = new URLSearchParams();
  params.set("ids", ids);
  params.set("w_placement", String(weights.placement));
  params.set("w_fees", String(weights.fees));
  params.set("w_location", String(weights.location));

  return `/compare?${params.toString()}`;
}

function ComparePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { shortlist } = useShortlist();
  const ids = searchParams.get("ids") ?? shortlist.slice(0, 3).join(",");
  const [weights, setWeights] = useState<Weights>(() =>
    readWeights(searchParams),
  );
  const [result, setResult] = useState<CompareResult | null>(null);
  const [scoreResults, setScoreResults] = useState<ScoreResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  useEffect(() => {
    setWeights(readWeights(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (!ids) {
      setResult(null);
      setError("Choose at least two colleges to compare.");
      return;
    }

    let isMounted = true;

    async function fetchComparison() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiFetch<CompareResult>(
          `/api/colleges/compare?ids=${encodeURIComponent(ids)}`,
        );

        if (isMounted) {
          setResult(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load comparison",
          );
          setResult(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchComparison();

    return () => {
      isMounted = false;
    };
  }, [ids]);

  useEffect(() => {
    let isMounted = true;

    async function fetchScores() {
      try {
        const data = await apiFetch<ScoreResult[]>("/api/score", {
          method: "POST",
          body: JSON.stringify(scoreRequestBody(weights)),
        });

        if (isMounted) {
          setScoreResults(data);
        }
      } catch {
        if (isMounted) {
          setScoreResults([]);
        }
      }
    }

    fetchScores();

    return () => {
      isMounted = false;
    };
  }, [weights]);

  useEffect(() => {
    if (!ids) {
      return;
    }

    const nextPath = buildComparePath(ids, weights);

    if (`${pathname}?${searchParams.toString()}` !== nextPath) {
      router.replace(nextPath, { scroll: false });
    }
  }, [ids, pathname, router, searchParams, weights]);

  const localScores = useMemo(() => {
    if (!result) {
      return [];
    }

    return scoreColleges(result.colleges, weights);
  }, [result, weights]);

  const scores = useMemo(() => {
    if (!result) {
      return [];
    }

    const backendScores = result.colleges
      .map((college) => {
        const score = scoreResults.find(
          (item) => item.college_id === college.id,
        );

        if (!score) {
          return null;
        }

        return {
          collegeId: college.id,
          score: score.final_score,
        };
      })
      .filter((item): item is { collegeId: number; score: number } => item !== null);

    return backendScores.length === result.colleges.length
      ? backendScores
      : localScores;
  }, [localScores, result, scoreResults]);

  const bestMatchId = useMemo(() => {
    const ranked = [...scores].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.collegeId - right.collegeId;
    });

    return ranked[0]?.collegeId ?? null;
  }, [scores]);

  const rows = useMemo(() => {
    if (!result) {
      return [];
    }

    const allRows = metricRows(result);

    if (!showDifferencesOnly) {
      return allRows;
    }

    return allRows.filter((row) =>
      metricHasDifferences(row, result.colleges),
    );
  }, [result, showDifferencesOnly]);

  function updateWeight(key: keyof Weights, value: number[]) {
    const nextValue = value[0] ?? 0;
    setWeights((current) => rebalanceWeights(current, key, nextValue));
  }

  return (
    <div className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-[34px] font-bold leading-tight text-gray-900 sm:text-4xl">
              Compare Colleges
            </h1>
            <p className="mt-3 max-w-2xl text-base text-gray-700">
              Compare shortlisted colleges by fees, placements, rank, location,
              accreditation, and streams.
            </p>
          </div>
          {ids ? (
            <Button type="button" onClick={() => router.push(buildComparePath(ids, weights))}>
              Shareable URL
            </Button>
          ) : null}
        </div>

        <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            {weightLabels.map((item) => (
              <label key={item.key} className="grid gap-3">
                <span className="flex items-center justify-between text-sm font-bold text-gray-900">
                  {item.label}
                  <span className="text-accent">{weights[item.key]}%</span>
                </span>
                <Slider
                  value={[weights[item.key]]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => updateWeight(item.key, value)}
                />
              </label>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Switch
              checked={showDifferencesOnly}
              onCheckedChange={setShowDifferencesOnly}
              aria-label="Highlight differences only"
            />
            <span className="text-sm font-medium text-gray-900">
              Highlight differences only
            </span>
          </div>
        </section>

        <section className="mt-8">
          {isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-base font-medium text-gray-900">{error}</p>
            </div>
          ) : result ? (
            <div className="overflow-x-auto pb-2 snap-x snap-mandatory">
              <div
                className="grid min-w-[760px] gap-4"
                style={{
                  gridTemplateColumns: `180px repeat(${result.colleges.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-bold text-gray-900">
                  Metric
                </div>
                {result.colleges.map((college) => {
                  const score = scores.find(
                    (item) => item.collegeId === college.id,
                  )?.score;

                  return (
                    <div
                      key={college.id}
                      className="snap-start rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="font-display text-base font-bold leading-snug text-gray-900">
                          {college.name}
                        </h2>
                        {college.id === bestMatchId ? (
                          <span className="rounded-full border border-accent px-2 py-1 text-xs font-bold text-accent">
                            Best Match
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Score {score ?? 0}
                      </p>
                    </div>
                  );
                })}

                {rows.map((row) => (
                  <Fragment key={row.key}>
                    <div
                      className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-bold text-gray-900"
                    >
                      {row.label}
                    </div>
                    {result.colleges.map((college) => {
                      const isWinner = row.winnerId === college.id;

                      return (
                        <div
                          key={`${row.key}-${college.id}`}
                          className="snap-start rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-900"
                          style={
                            isWinner
                              ? {
                                  backgroundColor: "#ecfdf5",
                                  color: "#047857",
                                }
                              : undefined
                          }
                        >
                          {row.format(row.getValue(college))}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
