"use client";

import { useCallback, useEffect, useState } from "react";

const shortlistStorageKey = "shortlist";

function readShortlist() {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = window.localStorage.getItem(shortlistStorageKey);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (collegeId): collegeId is number =>
        typeof collegeId === "number" && Number.isInteger(collegeId),
    );
  } catch {
    return [];
  }
}

export function useShortlist() {
  const [shortlist, setShortlist] = useState<number[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setShortlist(readShortlist());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(shortlistStorageKey, JSON.stringify(shortlist));
  }, [hasLoaded, shortlist]);

  const isShortlisted = useCallback(
    (collegeId: number) => shortlist.includes(collegeId),
    [shortlist],
  );

  const toggleShortlist = useCallback((collegeId: number) => {
    setShortlist((current) =>
      current.includes(collegeId)
        ? current.filter((id) => id !== collegeId)
        : [...current, collegeId],
    );
  }, []);

  return {
    shortlist,
    isShortlisted,
    toggleShortlist,
  };
}
