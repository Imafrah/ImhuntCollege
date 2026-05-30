"use client";

import { useEffect, useMemo, useState } from "react";
import { OnboardingModal } from "@/app/components/OnboardingModal";
import { CollegeCard } from "@/components/CollegeCard";
import { CompareTray } from "@/components/CompareTray";
import { FilterPanel, type CollegeFilters } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShortlist } from "@/hooks/useShortlist";
import { apiFetch } from "@/lib/api";
import type { College, UserPreferences } from "@/types/college";

const defaultFilters: CollegeFilters = {
  q: "",
  stream: "All",
  city: "",
  fees_max: 2000000,
  type: "All",
  sort: "nirf_rank",
};

function getLowestFee(college: College): number | null {
  return college.minCourseFee?.annual_fee ?? college.minAnnualFee ?? null;
}

function sortColleges(colleges: College[], sort: CollegeFilters["sort"]) {
  return [...colleges].sort((left, right) => {
    if (sort === "avg_pkg") {
      const diff =
        (right.latestPlacement?.avg_pkg ?? -1) -
        (left.latestPlacement?.avg_pkg ?? -1);
      return diff === 0 ? left.name.localeCompare(right.name) : diff;
    }

    if (sort === "fees") {
      const diff =
        (getLowestFee(left) ?? Number.MAX_SAFE_INTEGER) -
        (getLowestFee(right) ?? Number.MAX_SAFE_INTEGER);
      return diff === 0 ? left.name.localeCompare(right.name) : diff;
    }

    const diff =
      (left.nirf_rank ?? Number.MAX_SAFE_INTEGER) -
      (right.nirf_rank ?? Number.MAX_SAFE_INTEGER);
    return diff === 0 ? left.name.localeCompare(right.name) : diff;
  });
}

function streamParam(stream: CollegeFilters["stream"]) {
  if (stream === "All") {
    return null;
  }

  return stream === "Medical" ? "Medicine" : stream;
}

function streamMatches(streams: string[], stream: string) {
  const normalizedStream = stream === "Medical" ? "Medicine" : stream;
  return streams.includes(normalizedStream);
}

function buildCollegeListPath(filters: CollegeFilters) {
  const params = new URLSearchParams();
  const stream = streamParam(filters.stream);

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }

  if (stream) {
    params.set("stream", stream);
  }

  if (filters.city.trim()) {
    params.set("city", filters.city.trim());
  }

  if (filters.type !== "All") {
    params.set("type", filters.type);
  }

  if (filters.fees_max > 0) {
    params.set("fees_max", String(filters.fees_max));
  }

  params.set("sort", filters.sort);

  return `/api/colleges?${params.toString()}`;
}

function readUserPreferences(): UserPreferences | null {
  const storedValue = window.localStorage.getItem("user_preferences");

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (
      typeof parsedValue === "object" &&
      parsedValue !== null &&
      "priority" in parsedValue
    ) {
      return parsedValue as UserPreferences;
    }
  } catch {
    return null;
  }

  return null;
}

function personalizeColleges(
  colleges: College[],
  preferences: UserPreferences | null,
) {
  if (!preferences) {
    return colleges;
  }

  return [...colleges].sort((left, right) => {
    if (preferences.priority === "Placement") {
      const diff =
        (right.latestPlacement?.avg_pkg ?? -1) -
        (left.latestPlacement?.avg_pkg ?? -1);
      return diff === 0 ? left.name.localeCompare(right.name) : diff;
    }

    if (preferences.priority === "Fees") {
      const diff =
        (getLowestFee(left) ?? Number.MAX_SAFE_INTEGER) -
        (getLowestFee(right) ?? Number.MAX_SAFE_INTEGER);
      return diff === 0 ? left.name.localeCompare(right.name) : diff;
    }

    const streamMatchDiff =
      Number(streamMatches(right.streams, preferences.streamInterest)) -
      Number(streamMatches(left.streams, preferences.streamInterest));
    return streamMatchDiff === 0
      ? left.name.localeCompare(right.name)
      : streamMatchDiff;
  });
}

function CollegeCardSkeleton() {
  return (
    <div className="min-h-[220px] rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [filters, setFilters] = useState<CollegeFilters>(defaultFilters);
  const [searchValue, setSearchValue] = useState("");
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { shortlist, isShortlisted, toggleShortlist } = useShortlist();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFilters((current) => ({
        ...current,
        q: searchValue,
      }));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchValue]);

  useEffect(() => {
    setPreferences(readUserPreferences());
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchColleges() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiFetch<College[]>(buildCollegeListPath(filters));

        if (isMounted) {
          setColleges(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load colleges",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchColleges();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const filteredColleges = useMemo(() => {
    return personalizeColleges(sortColleges(colleges, filters.sort), preferences);
  }, [colleges, filters, preferences]);

  function updateFilters(nextFilters: Partial<CollegeFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearchValue("");
  }

  return (
    <div className="bg-white">
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="font-display text-[34px] font-bold leading-tight text-gray-900 sm:text-4xl">
              Find Your College
            </h1>
            <p className="mt-4 text-base text-gray-700">
              Search colleges across India by name, city, stream, fees,
              placement outcomes, and college type.
            </p>
          </div>
          <div className="mt-8">
            <label htmlFor="college-search" className="sr-only">
              Search colleges by name or city
            </label>
            <input
              id="college-search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by college name or city"
              className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-6xl">
          <FilterPanel filters={filters} onChange={updateFilters} />

          <div className="mt-8">
            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <CollegeCardSkeleton />
                <CollegeCardSkeleton />
                <CollegeCardSkeleton />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                <p className="text-base font-medium text-gray-900">{error}</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </div>
            ) : filteredColleges.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <p className="text-base font-medium text-gray-900">
                  No colleges found. Try adjusting your filters.
                </p>
                <Button className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredColleges.map((college) => (
                  <CollegeCard
                    key={college.id}
                    college={college}
                    isShortlisted={isShortlisted(college.id)}
                    onToggleShortlist={toggleShortlist}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <CompareTray
        colleges={colleges}
        shortlistedIds={shortlist}
        onRemove={toggleShortlist}
      />
      <OnboardingModal onPreferencesSaved={setPreferences} />
    </div>
  );
}
