"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  getBadgeDefinitions,
  getCharacters,
  getQuests,
  getRegions,
  getStages,
  getZones,
  type BadgeDefinition,
  type Character,
  type Quest,
  type Region,
  type Stage,
  type Zone,
} from "@/lib/api-client";
import { useAdminAccess } from "@/components/admin/admin-access";

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
  quests: Quest[];
  badges: BadgeDefinition[];
  characters: Character[];
  loading: boolean;
  error: boolean;
  reload: () => void;
};

/** Which extra listings the caller needs on top of Regions and Zones. */
export type CatalogOptions = Readonly<{
  stages?: boolean;
  quests?: boolean;
  badges?: boolean;
  characters?: boolean;
}>;

const EMPTY_CATALOG: Omit<Catalog, "reload"> = {
  regions: [],
  zones: [],
  stages: [],
  quests: [],
  badges: [],
  characters: [],
  loading: true,
  error: false,
};

/**
 * Loads the catalog rows the Control Panel works from. `getStages` and
 * `getQuests` need a token, so pass the value from `useToken()` — the load
 * waits for the token when those listings are requested. One request per
 * node — accepted for admin screens at thesis-scale data (a handful of
 * Regions); swap for a dedicated tree endpoint if it ever gets slow.
 */
export function useCatalog(token: string | null, options: CatalogOptions = {}): Catalog {
  const needStages = options.stages === true;
  const needQuests = options.quests === true;
  const needBadges = options.badges === true;
  const needCharacters = options.characters === true;
  const { report } = useAdminAccess();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Catalog>({ ...EMPTY_CATALOG, reload: () => {} });

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    // The authenticated listings need the Clerk token; wait for it rather
    // than resolving with an empty catalog.
    if ((needStages || needQuests) && !token) return;

    let cancelled = false;

    void (async () => {
      setState((prev) => ({ ...prev, loading: true, error: false }));
      try {
        const regions = await getRegions(API_URL);
        const zoneLists = await Promise.all(regions.map((region) => getZones(API_URL, region.id)));
        const zones = zoneLists.flat();

        let stages: Stage[] = [];
        if (needStages) {
          const stageLists = await Promise.all(zones.map((zone) => getStages(API_URL, token ?? "", zone.id)));
          stages = stageLists.flat();
        }

        let quests: Quest[] = [];
        if (needQuests) {
          quests = await getQuests(API_URL, token ?? "");
        }

        const badges = needBadges ? await getBadgeDefinitions(API_URL) : [];
        const characters = needCharacters ? await getCharacters(API_URL) : [];

        if (!cancelled) {
          setState({ regions, zones, stages, quests, badges, characters, loading: false, error: false, reload });
        }
      } catch (cause) {
        // A `403` means the session lost its admin rights: the shell shows the
        // ACCESS DENIED window instead of an ordinary load error.
        report(cause);
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false, error: true, reload }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, needStages, needQuests, needBadges, needCharacters, version, reload, report]);

  return state;
}
