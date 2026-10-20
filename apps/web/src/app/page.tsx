import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Map, ScrollText, Code2, Award, Star } from "lucide-react";
import { UnregisteredUserCard } from "@/components/unregistered-user-card";
import {
  AvatarOrInitial,
  Decorations,
  DesktopIcon,
  EmptyState,
  Window,
  XPChip,
  buttonClasses,
} from "@/components/y2k";
import { getCurrentUser, getLeaderboard, getProfile, getTodayEvent, getRegions, getStages, getZones, type Leaderboard, type Profile } from "@/lib/api-client";
import { findNovelResume } from "@/lib/novel-resume";

const LANGUAGES = [
  { label: "Python", icon: <Code2 className="size-4" /> },
  { label: "JavaScript", icon: <Code2 className="size-4" /> },
  { label: "C++", icon: <Code2 className="size-4" /> },
  { label: "C", icon: <Code2 className="size-4" /> },
  { label: "Java", icon: <Code2 className="size-4" /> },
];

/** The signed-in learner's "Continue" target: the first novel Stage, or the Map. */
async function resolveResume(
  apiUrl: string,
  token: string,
): Promise<{ href: string; label: string }> {
  try {
    const regions = await getRegions(apiUrl).catch(() => []);
    const region = regions[0];
    if (!region) return { href: "/map", label: "Map" };
    const zones = await getZones(apiUrl, region.id).catch(() => []);
    const zone = zones[0];
    if (!zone) return { href: "/map", label: "Map" };
    const stages = await getStages(apiUrl, token, zone.id).catch(() => []);
    const resume = findNovelResume([{ zone, stages }]);
    if (!resume) return { href: "/map", label: "Map" };
    return {
      href: `/map/${region.id}/${resume.zone.id}/${resume.stage.id}`,
      label: resume.stage.title,
    };
  } catch (error) {
    console.error("Failed to resolve resume:", error);
    return { href: "/map", label: "Map" };
  }
}

export default async function Home() {
  const { userId, getToken } = await auth();
  const user = userId ? await currentUser() : null;
  const isAdmin = user?.publicMetadata?.role === "admin";
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  if (!userId) {
    let leaderboard: Leaderboard | null = null;
    try {
      const token = await getToken().catch(() => null);
      if (token) {
        leaderboard = await getLeaderboard(apiUrl, token, 1, 3);
      }
    } catch (error) {
      console.error("Failed to load leaderboard teaser:", error);
    }

    return (
      <div className="y2k-grid relative min-h-screen">
        <Decorations />
        <main className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-8">
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-pixel text-lg leading-relaxed sm:text-xl md:text-2xl">
              REDISETHACK
            </h1>
          </header>

          <Window title="WELCOME.EXE">
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-pixel text-base leading-relaxed sm:text-lg">
                Learn to code. Level up.
              </h2>
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
            <Window title="MAP.EXE" className="animate-[y2k-window_200ms_cubic-bezier(0.34,1.56,0.64,1)_both] [animation-delay:80ms]">
              <div className="flex flex-col gap-2">
                <Map aria-hidden="true" className="size-5" />
                <p className="font-body text-sm font-bold">
                  Progress through Regions and Zones
                </p>
              </div>
            </Window>
            <Window title="QUESTS.EXE" className="animate-[y2k-window_200ms_cubic-bezier(0.34,1.56,0.64,1)_both] [animation-delay:160ms]">
              <div className="flex flex-col gap-2">
                <ScrollText aria-hidden="true" className="size-5" />
                <p className="font-body text-sm font-bold">
                  Timed quizzes with XP rewards
                </p>
              </div>
            </Window>
            <Window title="CODELAB.EXE" className="animate-[y2k-window_200ms_cubic-bezier(0.34,1.56,0.64,1)_both] [animation-delay:240ms]">
              <div className="flex flex-col gap-2">
                <Code2 aria-hidden="true" className="size-5" />
                <p className="font-body text-sm font-bold">
                  Run code in five languages
                </p>
              </div>
            </Window>
            <Window title="BADGES.EXE" className="animate-[y2k-window_200ms_cubic-bezier(0.34,1.56,0.64,1)_both] [animation-delay:320ms]">
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

          <Window title="TOP LEARNERS.EXE">
            <div className="flex flex-col gap-2">
              {leaderboard && leaderboard.entries.length > 0 ? (
                <ol className="flex flex-col divide-y divide-border/40">
                  {leaderboard.entries.map((entry) => (
                    <li key={entry.userId} className="flex items-center gap-3 py-2">
                      <span className="w-6 font-pixel text-[9px]">#{entry.rank}</span>
                      <AvatarOrInitial name={entry.name ?? "L"} className="size-8" />
                      <span className="flex-1 font-body text-sm font-bold">
                        {entry.name ?? "Learner"}
                      </span>
                      <XPChip xp={entry.totalXp} />
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState title="No rankings yet" message="Be the first to earn XP." />
              )}
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

  const token = await getToken();
  let dbUser = null;
  let isNewUserWithoutAccount = false;
  let profile: Profile | null = null;
  let event = null;

  if (token) {
    try {
      const [me, p, ev] = await Promise.allSettled([
        getCurrentUser(apiUrl, token),
        getProfile(apiUrl, token),
        getTodayEvent(apiUrl),
      ]);
      dbUser = me.status === "fulfilled" ? me.value : null;
      if (!dbUser) {
        isNewUserWithoutAccount = true;
      }
      profile = p.status === "fulfilled" ? p.value : null;
      event = ev.status === "fulfilled" ? ev.value : null;
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

  const resumeTarget = token ? await resolveResume(apiUrl, token) : { href: "/map", label: "Map" };
  const continueHref = resumeTarget.href;
  const continueLabel = resumeTarget.label;

  const rank = profile?.adventurerRank ?? profile?.level ?? 1;
  const totalXp = profile?.totalXp ?? dbUser?.totalXp ?? 0;
  const badgeCount = profile?.badges?.reduce((sum, b) => sum + b.count, 0) ?? 0;

  return (
    <div className="y2k-grid relative min-h-screen">
      <Decorations />
      <main className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-pixel text-lg leading-relaxed sm:text-xl md:text-2xl">
            REDISETHACK
          </h1>
        </header>

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
              <div className="flex flex-col gap-2 border-2 border-border bg-white p-3 shadow-[2px_2px_0_var(--border)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="font-pixel text-[9px] leading-relaxed">{continueLabel}</p>
                  <p className="font-body text-xs font-bold text-muted-foreground">Next unlocked Stage</p>
                </div>
                <Link href={continueHref} className={buttonClasses("primary")}>
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
      </main>
    </div>
  );
}
