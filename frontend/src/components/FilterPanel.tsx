"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CollegeType } from "@/types/college";

export type StreamFilter =
  | "Engineering"
  | "Medical"
  | "Commerce"
  | "Law"
  | "All";

export type SortFilter = "nirf_rank" | "avg_pkg" | "fees";

export type CollegeFilters = {
  q: string;
  stream: StreamFilter;
  city: string;
  fees_max: number;
  type: CollegeType | "All";
  sort: SortFilter;
};

type FilterPanelProps = {
  filters: CollegeFilters;
  onChange: (filters: Partial<CollegeFilters>) => void;
};

const streamOptions: StreamFilter[] = [
  "All",
  "Engineering",
  "Medical",
  "Commerce",
  "Law",
];

const typeOptions: Array<CollegeType | "All"> = [
  "All",
  "GOVT",
  "PRIVATE",
  "DEEMED",
];

const sortOptions: Array<{ label: string; value: SortFilter }> = [
  { label: "NIRF rank", value: "nirf_rank" },
  { label: "Avg package", value: "avg_pkg" },
  { label: "Fees", value: "fees" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4 md:hidden">
        <p className="text-sm font-bold text-gray-900">Filters</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((current) => !current)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
          Filters
        </Button>
      </div>

      <div className={`${isOpen ? "grid" : "hidden"} mt-4 gap-4 md:mt-0 md:grid md:grid-cols-5`}>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase text-gray-500">
            Stream
          </span>
          <select
            value={filters.stream}
            onChange={(event) =>
              onChange({ stream: event.target.value as StreamFilter })
            }
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          >
            {streamOptions.map((stream) => (
              <option key={stream} value={stream}>
                {stream}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase text-gray-500">
            City
          </span>
          <input
            value={filters.city}
            onChange={(event) => onChange({ city: event.target.value })}
            placeholder="Any city"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase text-gray-500">
            Max fees
          </span>
          <input
            type="range"
            min={0}
            max={2000000}
            step={50000}
            value={filters.fees_max}
            onChange={(event) =>
              onChange({ fees_max: Number(event.target.value) })
            }
            className="h-10 accent-accent"
          />
          <span className="text-xs font-medium text-gray-700">
            {formatCurrency(filters.fees_max)}
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase text-gray-500">
            Type
          </span>
          <select
            value={filters.type}
            onChange={(event) =>
              onChange({ type: event.target.value as CollegeType | "All" })
            }
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase text-gray-500">
            Sort
          </span>
          <select
            value={filters.sort}
            onChange={(event) =>
              onChange({ sort: event.target.value as SortFilter })
            }
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          >
            {sortOptions.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
