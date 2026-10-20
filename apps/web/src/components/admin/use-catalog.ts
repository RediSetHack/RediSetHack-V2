"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getRegions, getStages, getZones, type Region, type Stage, type Zone } from "@/lib/api-client";

/** Inlined by Next for client components; same default the server layouts use. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** The Clerk session token as plain state, so effects can depend on it. */
export function useToken(): string | null {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getToken()
      .then((value) => {
        if (!cancelled) setToken(value);
      })
      .catch(() => {
        if (!cancelled) setToken(null);
      });
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return token;
}

export type Catalog = {
  regions: Region[];
  zones: Zone[];
  stages: Stage[];
  loading: boolean;
  error: boolean;
  reload: () => void;
};

/**
 * Loads the full Region › Zone › Stage hierarchy for admin selects, filters,
 * counts and the dashboard tree. `getStages` needs a token, so pass the value
 * from `useToken()`. One request per node — accepted for admin screens at
 * thesis-scale data (a handful of Regions); swap for a dedicated tree endpoint
 * if it ever gets slow.
 */
export function useCatalog(
  token: string | null,
  options: Readonly<{ stages?: boolean }> = {},
): Catalog {
  const needStages = options.stages === true;
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Catalog>({
    regions: [],
    zones: [],
    stages: [],
    loading: true,
    error: false,
    reload: () => {},
  });

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setState((prev) => ({ ...prev, loading: true, error: false }));
      try {
        const regions = await getRegions(API_URL);
        const zoneLists = await Promise.all(regions.map((region) => getZones(API_URL, region.id)));
        const zones = zoneLists.flat();
        let stages: Stage[] = [];
        if (needStages && token) {
          const stageLists = await Promise.all(zones.map((zone) => getStages(API_URL, token, zone.id)));
          stages = stageLists.flat();
        }
        if (!cancelled) {
          setState({ regions, zones, stages, loading: false, error: false, reload });
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false, error: true, reload }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, needStages, version, reload]);

  return state;
}
