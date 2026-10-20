import { auth } from "@clerk/nextjs/server";
import { AdminDashboard } from "@/components/admin/dashboard";
import {
  getBadgeDefinitions,
  getCharacters,
  getQuests,
  getRegions,
  getStages,
  getTodayEvent,
  getZones,
} from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Counts = {
  regions: number;
  zones: number;
  stages: number;
  quests: number;
  badges: number;
  characters: number;
  eventLabel: string | null;
  eventBonus: boolean;
};

async function loadCounts(token: string): Promise<Counts> {
  const [regions, badges, characters, event] = await Promise.all([
    getRegions(API_URL),
    getBadgeDefinitions(API_URL),
    getCharacters(API_URL),
    getTodayEvent(API_URL).catch(() => null),
  ]);

  const zoneLists = await Promise.all(regions.map((region) => getZones(API_URL, region.id)));
  const zones = zoneLists.flat();

  const [stageLists, quests] = await Promise.all([
    Promise.all(zones.map((zone) => getStages(API_URL, token, zone.id))),
    getQuests(API_URL, token),
  ]);
  const stages = stageLists.flat();

  const eventBonus = event?.eventType === "bonus";
  let eventLabel: string | null = null;
  if (event) {
    eventLabel = eventBonus ? `BONUS ×${event.xpMultiplier} XP` : "NORMAL DAY";
  }

  return {
    regions: regions.length,
    zones: zones.length,
    stages: stages.length,
    quests: quests.length,
    badges: badges.length,
    characters: characters.length,
    eventLabel,
    eventBonus,
  };
}

export default async function AdminDashboardPage() {
  const { getToken } = await auth();
  const token = (await getToken()) ?? "";

  let counts: Counts | null = null;
  try {
    counts = await loadCounts(token);
  } catch {
    counts = null;
  }

  return (
    <AdminDashboard
      regions={counts?.regions ?? 0}
      zones={counts?.zones ?? 0}
      stages={counts?.stages ?? 0}
      quests={counts?.quests ?? 0}
      badges={counts?.badges ?? 0}
      characters={counts?.characters ?? 0}
      eventLabel={counts?.eventLabel ?? null}
      eventBonus={counts?.eventBonus ?? false}
      error={counts === null}
    />
  );
}
