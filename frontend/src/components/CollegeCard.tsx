"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import type { College } from "@/types/college";

type CollegeCardProps = {
  college: College;
  isShortlisted: boolean;
  onToggleShortlist: (collegeId: number) => void;
};

function formatPackage(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not available";
  }

  return `${value.toFixed(1)} LPA`;
}

export function CollegeCard({
  college,
  isShortlisted,
  onToggleShortlist,
}: CollegeCardProps) {
  const router = useRouter();
  const topStream = college.streams[0] ?? "General";
  const latestPlacement = college.latestPlacement;

  function openCollege() {
    router.push(`/colleges/${college.id}`);
  }

  function handleShortlist(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onToggleShortlist(college.id);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openCollege}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCollege();
        }
      }}
      className="min-h-[220px] cursor-pointer rounded-lg border border-gray-200 bg-white p-6 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
      style={
        isShortlisted
          ? { backgroundColor: "rgba(0, 106, 255, 0.06)" }
          : undefined
      }
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold leading-snug text-gray-900">
              {college.name}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {college.city}, {college.state}
            </p>
            <div className="mt-3 inline-flex rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
              {topStream}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={
              isShortlisted
                ? `Remove ${college.name} from shortlist`
                : `Add ${college.name} to shortlist`
            }
            aria-pressed={isShortlisted}
            onClick={handleShortlist}
            className="h-10 w-10 shrink-0 border-gray-300 p-0"
          >
            <Heart
              className="h-5 w-5"
              fill={isShortlisted ? "#006AFF" : "none"}
              color={isShortlisted ? "#006AFF" : "currentColor"}
              aria-hidden="true"
            />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Avg package</p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              {formatPackage(latestPlacement?.avg_pkg)}
            </p>
            <p className="text-xs text-gray-500">
              {latestPlacement ? latestPlacement.year : "Latest year"}
            </p>
          </div>
          <div className="rounded-md border border-accent bg-white p-3">
            <p className="text-xs font-medium text-gray-500">NIRF rank</p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              {college.nirf_rank ?? "Not ranked"}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Accreditation</p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              {college.accreditation}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
