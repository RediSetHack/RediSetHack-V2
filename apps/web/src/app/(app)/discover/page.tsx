import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { getDiscover } from "@/lib/api-client";
import { COMPETENCIES, type DiscoveryItem } from "@repo/contracts";
import { StatusChip, Window, XPChip, Y2kButton } from "@/components/y2k";

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
    available: "Unlocked",
    completed: "Completed",
  }[status ?? "locked"];
}

function RegionCard({ item }: Readonly<{ item: DiscoveryItem }>) {
  return (
    <li key={item.id} className="border-2 border-border bg-window-body p-4 shadow-[3px_3px_0_var(--border)]">
      <Link href={`/map/${item.id}`} className="block">
        <p className="font-pixel text-[10px] leading-relaxed">{item.title}</p>
        {item.description && (
          <p className="mt-1 font-body text-sm font-bold text-muted-foreground">{item.description}</p>
        )}
        {item.storyIntro && (
          <p className="mt-2 font-body text-sm font-bold">Novel · {item.storyIntro}</p>
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
  const content = (
    <>
      <p className="font-pixel text-[10px] leading-relaxed">{item.title}</p>
      {item.description && (
        <p className="mt-1 font-body text-sm font-bold text-muted-foreground">{item.description}</p>
      )}
      {item.regionName && (
        <p className="mt-1 font-body text-xs font-bold text-muted-foreground">In {item.regionName}</p>
      )}
    </>
  );
  return (
    <li key={item.id} className="border-2 border-border bg-window-body p-4 shadow-[3px_3px_0_var(--border)]">
      {href ? (
        <Link href={href} className="block">
          {content}
        </Link>
      ) : (
        content
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

  let chipStatus: "locked" | "completed" | "unlocked";
  if (locked) chipStatus = "locked";
  else if (item.status === "completed") chipStatus = "completed";
  else chipStatus = "unlocked";

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-pixel text-[10px] leading-relaxed">{item.title}</p>
        <StatusChip status={chipStatus} label={statusLabel(item.status)} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <XPChip xp={item.xpReward ?? 0} />
        {item.difficulty && (
          <span className="font-body text-xs font-bold text-muted-foreground">{item.difficulty}</span>
        )}
      </div>
      {competencies.length > 0 && (
        <p className="mt-1 font-body text-xs font-bold text-muted-foreground truncate" title={competencies.map((c) => c.title).join(", ")}>
          {competencies.map((c) => c.title).join(", ")}
        </p>
      )}
      {locked && item.lockReason && (
        <p className="mt-2 font-body text-sm font-bold text-muted-foreground">{item.lockReason}</p>
      )}
    </>
  );

  if (locked) {
    return (
      <li
        key={item.id}
        className="border-2 border-border bg-window-body p-4 opacity-70 shadow-[3px_3px_0_var(--border)]"
        aria-label={`${item.title}, locked, worth ${item.xpReward ?? 0} XP`}
      >
        {body}
      </li>
    );
  }

  return (
    <li key={item.id} className="border-2 border-border bg-window-body p-4 shadow-[3px_3px_0_var(--border)]">
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
}: Readonly<{ searchParams: Promise<SearchParams> }>) {
  const filters = parseFilters(await searchParams);

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
  const novels = regions.filter((item) => item.storyIntro !== null);
  const hasActiveFilters =
    filters.q !== "" || filters.competency !== "" || filters.difficulty !== "";

  const relevantCompetencies = COMPETENCIES;

  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-10 space-y-6">
      <Window title="DISCOVER.EXE">
        <p className="font-body text-sm font-bold text-muted-foreground">
          Browse approved learning content by interest and difficulty.
        </p>
      </Window>

      <Window title="Filter">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="discover-search" className="block font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-1">
              Search
            </label>
            <input
              id="discover-search"
              name="q"
              defaultValue={filters.q}
              className="w-full border-2 border-border bg-white px-2.5 py-1.5 font-body text-[13px] font-bold text-foreground shadow-[2px_2px_0_var(--border)] outline-none"
              placeholder="Search titles…"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="discover-competency" className="block font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-1">
              Interest / competency
            </label>
            <select
              id="discover-competency"
              name="competency"
              defaultValue={filters.competency}
              className="w-full border-2 border-border bg-white px-2.5 py-1.5 font-body text-[13px] font-bold text-foreground shadow-[2px_2px_0_var(--border)] outline-none appearance-none"
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
            <label htmlFor="discover-difficulty" className="block font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-1">
              Difficulty
            </label>
            <select
              id="discover-difficulty"
              name="difficulty"
              defaultValue={filters.difficulty}
              className="w-full border-2 border-border bg-white px-2.5 py-1.5 font-body text-[13px] font-bold text-foreground shadow-[2px_2px_0_var(--border)] outline-none appearance-none"
            >
              <option value="">Any</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Y2kButton type="submit">UPDATE</Y2kButton>
            {hasActiveFilters && (
              <Link href="?" className="inline-flex items-center justify-center gap-2 border-2 border-border px-4 py-2 font-pixel text-[9px] leading-relaxed text-foreground shadow-[3px_3px_0_var(--border)] bg-window-body">
                CLEAR
              </Link>
            )}
          </div>
        </form>
      </Window>

      {error && (
        <Window title="Error">
          <p role="alert" className="font-body text-sm font-bold text-btn-danger">
            The catalog could not be loaded. Please try again.
          </p>
        </Window>
      )}

      {!error && items.length === 0 && (
        <Window title="Empty">
          <p className="font-body text-sm font-bold text-muted-foreground">
            {hasActiveFilters
              ? "No content matches your current filters."
              : "No approved content available yet — check back soon."}
            {hasActiveFilters && (
              <Link href="?" className="ml-2 underline">Clear filters</Link>
            )}
          </p>
        </Window>
      )}

      {!error && items.length > 0 && (
        <>
          {novels.length > 0 && (
            <Window title="Novels">
              <ul className="flex flex-col gap-2">
                {novels.map((item) => (
                  <RegionCard key={item.id} item={item} />
                ))}
              </ul>
            </Window>
          )}
          {regions.length > novels.length && (
            <Window title="Regions">
              <ul className="flex flex-col gap-2">
                {regions.filter((item) => item.storyIntro === null).map((item) => (
                  <RegionCard key={item.id} item={item} />
                ))}
              </ul>
            </Window>
          )}
          {zones.length > 0 && (
            <Window title="Chapters">
              <ul className="flex flex-col gap-2">
                {zones.map((item) => (
                  <ZoneCard key={item.id} item={item} />
                ))}
              </ul>
            </Window>
          )}
          {stages.length > 0 && (
            <Window title="Activities">
              <ul className="flex flex-col gap-2">
                {stages.map((item) => (
                  <StageCard key={item.id} item={item} />
                ))}
              </ul>
            </Window>
          )}
        </>
      )}
    </div>
  );
}
