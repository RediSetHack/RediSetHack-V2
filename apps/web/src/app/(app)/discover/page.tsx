import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { getDiscover } from "@/lib/api-client";
import { COMPETENCIES, type DiscoveryItem } from "@repo/contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const DEFAULT_LIMIT = 25;

type SearchParams = Readonly<{
  q?: string | string[];
  competency?: string | string[];
  difficulty?: string | string[];
}>;

type FilterParams = Readonly<{
  q: string;
  competency: string;
  difficulty: string;
}>;

function parseFilters(searchParams: SearchParams): FilterParams {
  const q =
    typeof searchParams.q === "string" ? searchParams.q : "";
  const competency =
    typeof searchParams.competency === "string"
      ? searchParams.competency
      : "";
  const difficulty =
    typeof searchParams.difficulty === "string"
      ? searchParams.difficulty
      : "";
  return { q, competency, difficulty };
}

function statusLabel(status: DiscoveryItem["status"]): string {
  return {
    locked: "Locked",
    available: "Available",
    completed: "Completed",
  }[status ?? "locked"];
}

function statusClasses(status: DiscoveryItem["status"]): string {
  return {
    locked: "bg-muted text-muted-foreground",
    available: "bg-primary/10 text-primary",
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  }[status ?? "locked"];
}

function RegionCard({ item }: Readonly<{ item: DiscoveryItem }>) {
  return (
    <li key={item.id} className="rounded-md border border-border/60 p-4">
      <Link href={`/map/${item.id}`} className="block">
        <h2 className="font-medium">{item.title}</h2>
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
        {item.storyIntro && (
          <p className="mt-2 text-sm">Novel · {item.storyIntro}</p>
        )}
      </Link>
    </li>
  );
}

function ZoneCard({ item }: Readonly<{ item: DiscoveryItem }>) {
  const href =
    item.regionId != null
      ? `/map/${item.regionId}/${item.id}`
      : undefined;
  return (
    <li key={item.id} className="rounded-md border border-border/60 p-4">
      {href ? (
        <Link href={href} className="block">
          <h2 className="font-medium">{item.title}</h2>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
          {item.regionName && (
            <p className="mt-1 text-xs text-muted-foreground">In {item.regionName}</p>
          )}
        </Link>
      ) : (
        <>
          <h2 className="font-medium">{item.title}</h2>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
          {item.regionName && (
            <p className="mt-1 text-xs text-muted-foreground">In {item.regionName}</p>
          )}
        </>
      )}
    </li>
  );
}

function StageCard({ item }: Readonly<{ item: DiscoveryItem }>) {
  const competencies = item.competencies ?? [];
  const locked = item.status === "locked";
  const href =
    !locked && item.regionId != null && item.zoneId != null
      ? `/map/${item.regionId}/${item.zoneId}/${item.id}`
      : undefined;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">{item.title}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(
            item.status,
          )}`}
          aria-label={statusLabel(item.status)}
        >
          {statusLabel(item.status)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{item.xpReward ?? 0} XP</p>
      {item.difficulty && (
        <p className="mt-1 text-xs text-muted-foreground">
          Difficulty: {item.difficulty}
        </p>
      )}
      {competencies.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground truncate" title={competencies.map((c) => c.title).join(", ")}>
          {competencies.map((c) => c.title).join(", ")}
        </p>
      )}
      {locked && item.lockReason && (
        <p className="mt-2 text-sm text-muted-foreground">{item.lockReason}</p>
      )}
    </>
  );

  if (locked) {
    return (
      <li
        key={item.id}
        className="rounded-md border border-border/60 p-4 opacity-60"
        aria-label={`${item.title}, locked, worth ${item.xpReward ?? 0} XP`}
      >
        {body}
      </li>
    );
  }

  return (
    <li key={item.id} className="rounded-md border border-border/60 p-4">
      {href ? (
        <Link href={href} className="block" aria-label={`${item.title}, ${statusLabel(item.status)}, worth ${item.xpReward ?? 0} XP`}>
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

export default async function DiscoverPage({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>) {
  const filters = parseFilters(searchParams);

  const { getToken } = await auth();
  const token = await getToken();

  let items: DiscoveryItem[] = [];
  let error = false;
  try {
    items = await getDiscover(API_URL, token ?? "", {
      q: filters.q || undefined,
      competency: filters.competency || undefined,
      difficulty: filters.difficulty || undefined,
      limit: DEFAULT_LIMIT,
    });
  } catch {
    error = true;
  }

  const stages = items.filter((i) => i.kind === "stage");
  const regions = items.filter((i) => i.kind === "region");
  const zones = items.filter((i) => i.kind === "zone");
  // Only Regions carrying a story introduction are Novels; never label other
  // regions as Novel.
  const novels = regions.filter((item) => item.storyIntro !== null);
  const hasActiveFilters =
    filters.q !== "" || filters.competency !== "" || filters.difficulty !== "";

  // Use the complete supported competency taxonomy so interest filters are not
  // hidden by the capped discovery result set (page limit 25).
  const relevantCompetencies = COMPETENCIES;

  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-10 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
      <p className="text-sm text-muted-foreground">
        Browse approved learning content by interest and difficulty.
      </p>

      <section aria-label="Filters" className="rounded-lg border border-border/60 bg-muted/50 p-4">
        <form className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label htmlFor="discover-search" className="block text-xs font-medium text-muted-foreground mb-1">
              Search
            </label>
            <input
              id="discover-search"
              name="q"
              defaultValue={filters.q}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              placeholder="Search titles…"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="discover-competency" className="block text-xs font-medium text-muted-foreground mb-1">
              Interest / competency
            </label>
            <select
              id="discover-competency"
              name="competency"
              defaultValue={filters.competency}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
            >
              <option value="">Any</option>
              {relevantCompetencies.map((competency) => (
                <option key={competency.id} value={competency.id}>
                  {competency.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="discover-difficulty" className="block text-xs font-medium text-muted-foreground mb-1">
              Difficulty
            </label>
            <select
              id="discover-difficulty"
              name="difficulty"
              defaultValue={filters.difficulty}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
            >
              <option value="">Any</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
            {hasActiveFilters && (
              <Link
                href="?"
                className="rounded-md border border-input bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Clear filters
              </Link>
            )}
          </div>
        </form>
      </section>

      {error && (
        <p role="alert" className="p-6 text-destructive">
          The catalog could not be loaded. Please try again.
        </p>
      )}

      {!error && items.length === 0 && (
        <p className="p-6 text-muted-foreground">
          {hasActiveFilters
            ? "No content matches your current filters."
            : "No approved content available yet — check back soon."}
          {hasActiveFilters && (
            <Link
              href="?"
              className="ml-2 text-xs underline text-primary hover:text-primary/90"
            >
              Clear filters
            </Link>
          )}
        </p>
      )}

      {!error && items.length > 0 && (
        <>
          {novels.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Novels</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {novels.map((item) => (
                  <RegionCard key={item.id} item={item} />
                ))}
              </ul>
            </section>
          )}
          {regions.length > novels.length && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Regions</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {regions.filter((item) => item.storyIntro === null).map((item) => (
                  <RegionCard key={item.id} item={item} />
                ))}
              </ul>
            </section>
          )}
          {zones.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Chapters</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {zones.map((item) => (
                  <ZoneCard key={item.id} item={item} />
                ))}
              </ul>
            </section>
          )}
          {stages.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Activities</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {stages.map((item) => (
                  <StageCard key={item.id} item={item} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
