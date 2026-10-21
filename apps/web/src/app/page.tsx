import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Map, ScrollText, Code2, Award, Star } from "lucide-react";
import { AppShell, MinimalHeader } from "@/components/app-shell";
import { UnregisteredUserCard } from "@/components/unregistered-user-card";
import {
  AvatarOrInitial,
  Decorations,
  DesktopIcon,
  Window,
  XPChip,
  buttonClasses,
} from "@/components/y2k";
import {
  getCurrentUser,
  getLeaderboard,
  getProfile,
  getTodayEvent,
  getRegions,
  getStages,
  getZones,
  type Leaderboard,
  type Profile,
  type DailyEvent,
} from "@/lib/api-client";
import { findNovelResume } from "@/lib/novel-resume";

const LANGUAGES = [
  { label: "Python", icon: <Code2 className="size-4" /> },
  { label: "JavaScript", icon: <Code2 className="size-4" /> },
  { label: "C++", icon: <Code2 className="size-4" /> },
  { label: "C", icon: <Code2 className="size-4" /> },
  { label: "Java", icon: <Code2 className="size-4" /> },
];

const DEFAULT_TOP_LEARNERS = [
  { rank: 1, name: "Ada Lovelace", totalXp: 1337 },
  { rank: 2, name: "Grace Hopper", totalXp: 1024 },
  { rank: 3, name: "Alan Turing", totalXp: 800 },
];

export type ResumeInfo = {
  href: string;
  stageTitle: string;
  regionName?: string;
  zoneName?: string;
  xpReward?: number;
};

/** The signed-in learner's "Continue" target: the first novel Stage, or the Map. */
export async function resolveResume(
  apiUrl: string,
  token: string,
): Promise<ResumeInfo> {
  try {
    const regions = await getRegions(apiUrl).catch(() => []);
    const region = regions[0];
    if (!region) return { href: "/map", stageTitle: "Map" };
    const zones = await getZones(apiUrl, region.id).catch(() => []);
    const zone = zones[0];
    if (!zone) return { href: "/map", stageTitle: "Map" };
    const stages = await getStages(apiUrl, token, zone.id).catch(() => []);
    const resume = findNovelResume([{ zone, stages }]);
    if (!resume) return { href: "/map", stageTitle: "Map" };
    return {
      href: `/map/${region.id}/${resume.zone.id}/${resume.stage.id}`,
      stageTitle: resume.stage.title,
      regionName: region.name,
      zoneName: zone.name,
      xpReward: resume.stage.xpReward,
    };
  } catch (error) {
    console.error("Failed to resolve resume:", error);
    return { href: "/map", stageTitle: "Map" };
  }
}

export default async function Home() {
  const { userId, getToken } = await auth();
  const user = userId ? await currentUser() : null;
  const role = (user?.publicMetadata?.role as string | undefined) ?? "user";
  const isAdmin = role === "admin";
  const isContributor = isAdmin || role === "contributor";
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  if (!userId) return await VisitorHome({ apiUrl, getToken });

  const token = await getToken();
  let dbUser = null;
  let isNewUserWithoutAccount = false;
  let profile: Profile | null = null;
  let profileError = false;
  let event: DailyEvent | null = null;
  let eventError = false;

  if (token) {
    try {
      const [me, p, ev] = await Promise.allSettled([
        getCurrentUser(apiUrl, token),
        getProfile(apiUrl, token),
        getTodayEvent(apiUrl),
      ]);
      dbUser = me.status === "fulfilled" ? me.value : null;
      isNewUserWithoutAccount = !dbUser;
      profile = p.status === "fulfilled" ? p.value : null;
      profileError = p.status === "rejected";
      event = ev.status === "fulfilled" ? ev.value : null;
      eventError = ev.status === "rejected";
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  }

  if (isNewUserWithoutAccount) {
    return (
      <div className="y2k-grid relative min-h-screen">
        <Decorations />
        <main className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-center px-4 py-8">
          <UnregisteredUserCard email={userEmail} apiUrl={apiUrl} />
        </main>
      </div>
    );
  }

  const resumeTarget = token
    ? await resolveResume(apiUrl, token)
    : { href: "/map", stageTitle: "Map" };

  const rank = profile?.adventurerRank ?? profile?.level ?? 1;
  const totalXp = profile?.totalXp ?? dbUser?.totalXp ?? 0;
  const badgeCount = profile?.badges?.reduce((sum, b) => sum + b.count, 0) ?? 0;

  return (
    <AppShell
      profile={profile}
      profileError={profileError}
      event={event}
      eventError={eventError}
      isAdmin={isAdmin}
      isContributor={isContributor}
    >
      <div className="flex flex-col gap-6">
        <Window title="DASHBOARD.EXE">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-pixel text-[10px] leading-relaxed">
                Welcome back, {user?.firstName ?? user?.username ?? "Learner"}
              </p>
              <p className="font-body text-sm font-bold text-muted-foreground">
                {userEmail}
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[9px]">ADMIN</span>
                <Link href="/admin" className={buttonClasses("secondary")}>
                  CONTROL PANEL
                </Link>
              </div>
            )}
          </div>
        </Window>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <Window title="CONTINUE.EXE">
            <div className="flex flex-col gap-3">
              <p className="font-body text-sm font-bold">Continue where you left off</p>
              <div className="flex flex-col gap-3 border-2 border-border bg-white p-3 shadow-[2px_2px_0_var(--border)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  {resumeTarget.regionName && resumeTarget.zoneName ? (
                    <p className="font-body text-xs font-bold text-muted-foreground">
                      {resumeTarget.regionName} › {resumeTarget.zoneName}
                    </p>
                  ) : (
                    <p className="font-body text-xs font-bold text-muted-foreground">
                      Next unlocked Stage
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-pixel text-[10px] leading-relaxed">
                      {resumeTarget.stageTitle}
                    </p>
                    {resumeTarget.xpReward !== undefined && (
                      <XPChip xp={resumeTarget.xpReward} />
                    )}
                  </div>
                </div>
                <Link href={resumeTarget.href} className={buttonClasses("primary")}>
                  CONTINUE
                </Link>
              </div>
            </div>
          </Window>
          <Window title="TODAY.EXE">
            <div className="flex flex-col gap-2">
              <p className="font-body text-sm font-bold">Today&apos;s Event</p>
              <div className="flex items-center gap-2">
                {event?.eventType === "bonus" ? (
                  <>
                    <Star aria-hidden="true" className="size-4 text-sparkle" />
                    <span className="font-pixel text-[9px]">BONUS DAY ×{event.xpMultiplier} XP</span>
                  </>
                ) : (
                  <>
                    <Star aria-hidden="true" className="size-4" />
                    <span className="font-pixel text-[9px]">NORMAL DAY</span>
                  </>
                )}
              </div>
            </div>
          </Window>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Window title="RANK.EXE">
            <div className="flex items-center justify-between">
              <p className="font-body text-sm font-bold">Adventurer Rank</p>
              <span className="font-pixel-lg text-xl">LV {rank}</span>
            </div>
          </Window>
          <Window title="XP.EXE">
            <div className="flex items-center justify-between">
              <p className="font-body text-sm font-bold">Total XP</p>
              <XPChip xp={totalXp} />
            </div>
          </Window>
          <Window title="BADGES.EXE">
            <div className="flex items-center justify-between">
              <p className="font-body text-sm font-bold">Badges count</p>
              <span className="font-pixel-lg text-xl">{badgeCount}</span>
            </div>
          </Window>
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <Link href="/quests" className={buttonClasses("secondary")}>
            QUESTS
          </Link>
          <Link href="/codelab" className={buttonClasses("secondary")}>
            CODELAB
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

async function VisitorHome({
  apiUrl,
  getToken,
}: Readonly<{ apiUrl: string; getToken: () => Promise<string | null> }>) {
  let leaderboard: Leaderboard | null = null;
  try {
    const token = await getToken().catch(() => null);
    if (token) {
      leaderboard = await getLeaderboard(apiUrl, token, 1, 3);
    }
  } catch (error) {
    console.error("Failed to load leaderboard teaser:", error);
  }

  const entries =
    leaderboard && leaderboard.entries.length > 0
      ? leaderboard.entries.slice(0, 3).map((e) => ({
          rank: e.rank,
          name: e.name ?? "Learner",
          totalXp: e.totalXp,
        }))
      : DEFAULT_TOP_LEARNERS;

  return (
    <div className="y2k-grid relative flex min-h-screen flex-col pb-12">
      <Decorations />
      <MinimalHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-8">
        <Window title="WELCOME.EXE">
          <div className="flex flex-col items-start gap-4">
            <h1 className="font-pixel text-base leading-relaxed sm:text-lg">
              Learn to code. Level up.
            </h1>
            <p className="max-w-2xl font-body text-sm font-bold text-muted-foreground">
              Progress through curated Regions, Zones, and Stages. Solve code
              challenges in the Codelab, take timed Quests, and earn XP and
              Badges.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={buttonClasses("primary")}>
                SIGN UP
              </Link>
              <Link href="/sign-in" className={buttonClasses("secondary")}>
                SIGN IN
              </Link>
            </div>
          </div>
        </Window>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Window title="MAP.EXE" className="lg:translate-y-0">
            <div className="flex flex-col gap-2">
              <Map aria-hidden="true" className="size-5" />
              <p className="font-body text-sm font-bold">
                Progress through Regions and Zones
              </p>
            </div>
          </Window>
          <Window title="QUESTS.EXE" className="lg:translate-y-2">
            <div className="flex flex-col gap-2">
              <ScrollText aria-hidden="true" className="size-5" />
              <p className="font-body text-sm font-bold">
                Timed quizzes with XP rewards
              </p>
            </div>
          </Window>
          <Window title="CODELAB.EXE" className="lg:translate-y-1">
            <div className="flex flex-col gap-2">
              <Code2 aria-hidden="true" className="size-5" />
              <p className="font-body text-sm font-bold">
                Run code in five languages
              </p>
            </div>
          </Window>
          <Window title="BADGES.EXE" className="lg:translate-y-3">
            <div className="flex flex-col gap-2">
              <Award aria-hidden="true" className="size-5" />
              <p className="font-body text-sm font-bold">
                Collect Badges and earn XP
              </p>
            </div>
          </Window>
        </section>

        <section className="flex flex-wrap items-center justify-center gap-6">
          {LANGUAGES.map((lang) => (
            <DesktopIcon key={lang.label} icon={lang.icon} label={lang.label} />
          ))}
        </section>

        <Window title="TOP LEARNERS">
          <div className="flex flex-col gap-2">
            <ol className="flex flex-col divide-y divide-border/40">
              {entries.map((entry) => (
                <li key={entry.rank} className="flex items-center gap-3 py-2">
                  <span className="w-6 font-pixel text-[9px]">#{entry.rank}</span>
                  <AvatarOrInitial name={entry.name} className="size-8" />
                  <span className="flex-1 font-body text-sm font-bold">
                    {entry.name}
                  </span>
                  <XPChip xp={entry.totalXp} />
                </li>
              ))}
            </ol>
          </div>
        </Window>

        <footer className="flex flex-col items-center gap-2 pb-4 text-center">
          <div className="flex items-center gap-2 font-pixel text-[9px]">
            <span>© RediSetHack</span>
            <span aria-hidden="true">×××</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
