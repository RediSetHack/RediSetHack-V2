import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/api-client";

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

  redirect("/");
}

function OnboardingRetry() {
  return (
    <main className="mx-auto max-w-lg p-8" role="alert">
      <h1 className="text-xl font-semibold">We couldn’t finish setting up your account.</h1>
      <p className="mt-2">Please try again in a moment.</p>
      <Link className="mt-4 inline-block underline" href="/sign-up/complete">Retry onboarding</Link>
    </main>
  );
}
