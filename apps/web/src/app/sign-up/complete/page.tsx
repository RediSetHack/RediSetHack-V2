import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { CharacterPicker } from "@/components/character-selector";
import { UnregisteredUserCard } from "@/components/unregistered-user-card";
import { Decorations, Progress, Window, buttonClasses } from "@/components/y2k";
import { getCurrentUser, getCharacters, getProfile, syncUser } from "@/lib/api-client";

export default async function SignUpCompletePage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-up");
  }

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  if (!token) {
    return <OnboardingRetry />;
  }

  try {
    await syncUser(apiUrl, token);
  } catch (err) {
    console.error("Failed to sync user to database after signup:", err);
    return <OnboardingRetry />;
  }

  let profile = null;
  try {
    profile = await getProfile(apiUrl, token);
  } catch (err) {
    console.error("Failed to load profile after sync:", err);
  }

  if (profile?.character) {
    redirect("/");
  }

  let characters = [];
  try {
    characters = await getCharacters(apiUrl);
  } catch (err) {
    console.error("Failed to load character catalog:", err);
    return <OnboardingRetry />;
  }

  return (
    <div className="y2k-grid relative min-h-screen">
      <Decorations />
      <main className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 px-4 py-10">
        <Window title="PICK_YOUR_CHARACTER.EXE" className="w-full max-w-4xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-pixel text-[9px]">STEP 2 OF 2</p>
              <Progress value={100} max={100} className="w-40" />
            </div>
            <CharacterPicker characters={characters} apiUrl={apiUrl} />
            <div className="flex items-center justify-between">
              <Link href="/" className={buttonClasses("ghost")}>
                Skip for now
              </Link>
            </div>
          </div>
        </Window>
      </main>
    </div>
  );
}

function OnboardingRetry() {
  return (
    <div className="y2k-grid relative min-h-screen">
      <Decorations />
      <main className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-center px-4 py-10">
        <div
          role="alert"
          className="flex w-full max-w-md flex-col gap-4 border-2 border-border bg-window-body p-4 shadow-[4px_4px_0_var(--border)]"
        >
          <p className="flex items-center gap-2 font-pixel-lg text-lg leading-snug">
            <AlertTriangle aria-hidden="true" className="size-5 text-btn-danger" />
            We couldn’t finish setting up your account.
          </p>
          <p className="font-body text-sm font-bold text-muted-foreground">
            Please try again in a moment.
          </p>
          <Link className={buttonClasses("primary")} href="/sign-up/complete">
            Retry onboarding
          </Link>
        </div>
      </main>
    </div>
  );
}
