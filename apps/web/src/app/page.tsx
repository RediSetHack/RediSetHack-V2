import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { CharacterSelector } from "@/components/character-selector";
import { UnregisteredUserCard } from "@/components/unregistered-user-card";
import { Button } from "@/components/ui/button";
import { DEFAULT_CHARACTERS, getCurrentUser } from "@/lib/api-client";

export default async function Home() {
  const { userId, getToken } = await auth();
  const user = userId ? await currentUser() : null;
  const isAdmin = user?.publicMetadata?.role === "admin";
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  if (!userId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start p-6 sm:p-10 max-w-6xl mx-auto w-full">
        <section className="flex flex-col items-center text-center py-16 sm:py-24 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <span>✨ RediSetHack V2</span>
            <span>•</span>
            <span>Gamified Developer Learning</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Master Code. Complete Quests.{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Level Up.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Progress through curated Regions, Zones, and Stages. Solve code
            challenges in our interactive Codelab, take timed Quests, and earn
            multiplicative badges that stack with every achievement.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <Button size="lg" className="px-6 text-base font-semibold shadow-md">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="px-6 text-base">
                Sign In with Google / GitHub
              </Button>
            </Link>
          </div>

          {/* Character preview */}
          <div className="w-full pt-16 border-t border-border/60">
            <h2 className="text-xl font-bold mb-2">Choose Your Avatar Identity</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Pick your persona when you sign up to track your learning journey:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {DEFAULT_CHARACTERS.map((char) => (
                <div
                  key={char.id}
                  className="flex flex-col items-center p-4 rounded-xl border border-border bg-card/50 text-center"
                >
                  <span className="text-3xl mb-2" role="img" aria-label={char.name}>
                    {char.avatarIcon}
                  </span>
                  <span className="text-xs font-semibold">{char.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  let dbUser = null;
  let isNewUserWithoutAccount = false;

  if (token) {
    try {
      dbUser = await getCurrentUser(apiUrl, token);
      if (!dbUser) {
        isNewUserWithoutAccount = true;
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  }

  if (isNewUserWithoutAccount) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 max-w-6xl mx-auto w-full">
        <UnregisteredUserCard email={userEmail} apiUrl={apiUrl} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 sm:p-10 max-w-6xl mx-auto w-full">
      <div className="w-full space-y-8 py-6">
        {/* User Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back, {user?.firstName ?? user?.username ?? "Learner"}!
              </h1>
              {isAdmin ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  🛡️ Admin
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  ⭐ Learner
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {userEmail} • Identity synced with Clerk {dbUser ? `• ${dbUser.totalXp} XP` : ""}
            </p>
          </div>

          {isAdmin && (
            <div className="text-xs px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Clerk publicMetadata.role === &quot;admin&quot;</p>
              <p className="text-[11px] opacity-90">
                Full access granted to NestJS admin-guarded endpoints
              </p>
            </div>
          )}
        </div>

        {/* Character Selection Section */}
        <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <CharacterSelector initialCharacterId={dbUser?.characterId} apiUrl={apiUrl} />
        </section>

        {/* Progression Overview */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-border bg-card/60">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Learning Structure
            </div>
            <div className="text-lg font-bold">Regions & Zones</div>
            <p className="text-xs text-muted-foreground mt-1">
              Structured curriculum from fundamental syntax to complex algorithms.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card/60">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Progression Engine
            </div>
            <div className="text-lg font-bold">XP & Stages</div>
            <p className="text-xs text-muted-foreground mt-1">
              Earn XP modifiers through daily events and quest completions.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card/60">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Achievements
            </div>
            <div className="text-lg font-bold">Multiplicative Badges</div>
            <p className="text-xs text-muted-foreground mt-1">
              Badges stack repeatedly (e.g. ×3) via data-driven achievement criteria.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
