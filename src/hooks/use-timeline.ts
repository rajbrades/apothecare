"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TimelineEventType } from "@/lib/validations/timeline";

// ── Types ─────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  event_type: TimelineEventType;
  event_date: string;
  source_table: string;
  source_id: string;
  title: string;
  summary: string | null;
  detail: Record<string, unknown>;
  body_systems: string[] | null;
  biomarker_codes: string[] | null;
  visible_to_patient: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface TimelineFilters {
  eventTypes: TimelineEventType[];
  bodySystems: string[];
}

interface UseTimelineReturn {
  events: TimelineEvent[];
  availableTypes: TimelineEventType[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  filters: TimelineFilters;
  setFilters: (filters: TimelineFilters) => void;
  loadMore: () => void;
  refresh: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useTimeline(patientId: string): UseTimelineReturn {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [availableTypes, setAvailableTypes] = useState<TimelineEventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TimelineFilters>({
    eventTypes: [],
    bodySystems: [],
  });
  const cursorRef = useRef<string | null>(null);

  const buildUrl = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");
      if (filters.eventTypes.length > 0) {
        params.set("event_types", filters.eventTypes.join(","));
      }
      if (filters.bodySystems.length > 0) {
        params.set("body_systems", filters.bodySystems.join(","));
      }
      return `/api/patients/${patientId}/timeline?${params.toString()}`;
    },
    [patientId, filters]
  );

  // Fetch distinct event types for filter bar
  const fetchAvailableTypes = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/timeline/types`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.types) {
        setAvailableTypes(data.types as TimelineEventType[]);
      }
    } catch {
      // Non-critical — filter bar will show all types as fallback
    }
  }, [patientId]);

  const fetchEvents = useCallback(
    async (append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        cursorRef.current = null;
      }
      setError(null);

      try {
        const url = buildUrl(append ? cursorRef.current : null);
        const res = await fetch(url);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch timeline");
        }

        const data = await res.json();
        const newEvents: TimelineEvent[] = data.events;

        if (append) {
          setEvents((prev) => [...prev, ...newEvents]);
        } else {
          setEvents(newEvents);
        }

        cursorRef.current = data.nextCursor;
        setHasMore(!!data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [buildUrl]
  );

  // Initial fetch & refetch on filter change
  useEffect(() => {
    fetchEvents(false);
  }, [fetchEvents]);

  // Fetch available types on mount
  useEffect(() => {
    fetchAvailableTypes();
  }, [fetchAvailableTypes]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEvents(true);
    }
  }, [isLoadingMore, hasMore, fetchEvents]);

  const refresh = useCallback(() => {
    fetchEvents(false);
    fetchAvailableTypes();
  }, [fetchEvents, fetchAvailableTypes]);

  const setFilters = useCallback((newFilters: TimelineFilters) => {
    setFiltersState(newFilters);
  }, []);

  return {
    events,
    availableTypes,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    filters,
    setFilters,
    loadMore,
    refresh,
  };
}
