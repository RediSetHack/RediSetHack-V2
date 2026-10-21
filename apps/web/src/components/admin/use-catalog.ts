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

/** The catalog rows the Control Panel works from. */
export type CatalogRows = Readonly<{
  regions: Region[];
  zones: Zone[];
  stages: Stage[];
  quests: Quest[];
  badges: BadgeDefinition[];
  characters: Character[];
}>;

export type Catalog = CatalogRows & {
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

const EMPTY_ROWS: CatalogRows = {
  regions: [],
  zones: [],
  stages: [],
  quests: [],
  badges: [],
  characters: [],
};

/**
 * Fetches the catalog rows. `getStages` and `getQuests` need a token, so pass
 * the value from `useToken()`. One request per node — accepted for admin
 * screens at thesis-scale data (a handful of Regions); swap for a dedicated
 * tree endpoint if it ever gets slow.
 *
 * `isCancelled` reports that the caller has moved on — the page was replaced
 * while the request was in flight. A canceled load resolves to `null` instead
 * of throwing, so it can never report a failure to the shell: the page that
 * replaced it owns the shell state now.
 */
export async function fetchCatalog(
  token: string | null,
  options: CatalogOptions,
  isCancelled: () => boolean,
): Promise<CatalogRows | null> {
  try {
    const regions = await getRegions(API_URL);
    const zoneLists = await Promise.all(regions.map((region) => getZones(API_URL, region.id)));
    const zones = zoneLists.flat();

    let stages: Stage[] = [];
    if (options.stages === true) {
      const stageLists = await Promise.all(zones.map((zone) => getStages(API_URL, token ?? "", zone.id)));
      stages = stageLists.flat();
    }

    let quests: Quest[] = [];
    if (options.quests === true) {
      quests = await getQuests(API_URL, token ?? "");
    }

    const badges = options.badges === true ? await getBadgeDefinitions(API_URL) : [];
    const characters = options.characters === true ? await getCharacters(API_URL) : [];

    return { regions, zones, stages, quests, badges, characters };
  } catch (cause) {
    if (isCancelled()) return null;
    throw cause;
  }
}

/**
 * Loads the catalog rows the Control Panel works from. The load waits for the
 * Clerk token when it needs the authenticated listings, and a `403` from the
 * API flips the shell into the ACCESS DENIED window.
 */
export function useCatalog(token: string | null, options: CatalogOptions = {}): Catalog {
  const { report } = useAdminAccess();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Catalog>({ ...EMPTY_ROWS, loading: true, error: false, reload: () => {} });

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  const needStages = options.stages === true;
  const needQuests = options.quests === true;
  const needBadges = options.badges === true;
  const needCharacters = options.characters === true;

  useEffect(() => {
    // The authenticated listings need the Clerk token; wait for it rather
    // than resolving with an empty catalog.
    if ((needStages || needQuests) && !token) return;

    let cancelled = false;

    void (async () => {
      setState((prev) => ({ ...prev, loading: true, error: false }));
      try {
        const rows = await fetchCatalog(
          token,
          { stages: needStages, quests: needQuests, badges: needBadges, characters: needCharacters },
          () => cancelled,
        );
        if (!cancelled && rows) {
          setState({ ...rows, loading: false, error: false, reload });
        }
      } catch (cause) {
        // A canceled request must not report: the page that replaced this one
        // owns the shell state now.
        if (cancelled) return;
        // A `403` means the session lost its admin rights: the shell shows the
        // ACCESS DENIED window instead of an ordinary load error.
        report(cause);
        setState((prev) => ({ ...prev, loading: false, error: true, reload }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, needStages, needQuests, needBadges, needCharacters, version, reload, report]);

  return state;
}
