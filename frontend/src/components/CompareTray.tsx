"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { College } from "@/types/college";

type CompareTrayProps = {
  colleges: College[];
  shortlistedIds: number[];
  onRemove: (collegeId: number) => void;
};

export function CompareTray({
  colleges,
  shortlistedIds,
  onRemove,
}: CompareTrayProps) {
  const router = useRouter();
  const visibleIds = shortlistedIds.slice(0, 3);
  const selectedColleges = visibleIds.map((id) => {
    const college = colleges.find((item) => item.id === id);

    return {
      id,
      name: college?.name ?? `College ${id}`,
    };
  });

  if (shortlistedIds.length < 2) {
    return null;
  }

  function compareNow() {
    router.push(`/compare?ids=${visibleIds.join(",")}`);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {selectedColleges.map((college) => (
            <div
              key={college.id}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900"
            >
              <span className="max-w-[220px] truncate">{college.name}</span>
              <button
                type="button"
                aria-label={`Remove ${college.name} from comparison`}
                onClick={() => onRemove(college.id)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" onClick={compareNow} className="shrink-0">
          Compare Now
        </Button>
      </div>
    </div>
  );
}
