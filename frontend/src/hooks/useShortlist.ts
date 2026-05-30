"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { College } from "@/types/college";

const shortlistStorageKey = "shortlist";
const sessionStorageKey = "shortlist_session_id";

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

function getSessionId() {
  const existing = window.localStorage.getItem(sessionStorageKey);

  if (existing) {
    return existing;
  }

  const nextId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(sessionStorageKey, nextId);
  return nextId;
}

export function useShortlist() {
  const [shortlist, setShortlist] = useState<number[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const currentSessionId = getSessionId();
    setSessionId(currentSessionId);
    setHasLoaded(true);

    async function loadServerShortlist() {
      try {
        const serverShortlist = await apiFetch<College[]>(
          `/api/shortlist/${encodeURIComponent(currentSessionId)}`,
        );
        setShortlist(serverShortlist.map((college) => college.id));
      } catch {
        setShortlist(readShortlist());
      }
    }

    loadServerShortlist();
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
    const wasShortlisted = shortlist.includes(collegeId);

    setShortlist((current) =>
      current.includes(collegeId)
        ? current.filter((id) => id !== collegeId)
        : [...current, collegeId],
    );

    if (!sessionId) {
      return;
    }

    const request = wasShortlisted
      ? apiFetch<College[]>(
          `/api/shortlist/${encodeURIComponent(sessionId)}/${collegeId}`,
          {
            method: "DELETE",
          },
        )
      : apiFetch<College[]>("/api/shortlist", {
          method: "POST",
          headers: {
            "x-session-token": sessionId,
          },
          body: JSON.stringify({ college_id: collegeId }),
        });

    request
      .then((serverShortlist) => {
        setShortlist(serverShortlist.map((college) => college.id));
      })
      .catch(() => {
        setShortlist((current) =>
          wasShortlisted
            ? [...current, collegeId]
            : current.filter((id) => id !== collegeId),
        );
      });
  }, [sessionId, shortlist]);

  return {
    shortlist,
    sessionId,
    isShortlisted,
    toggleShortlist,
  };
}
