import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { MinimalHeader } from "@/components/app-shell";
import { Decorations, Window } from "@/components/y2k";
import { clerkY2kAppearance } from "@/lib/clerk-appearance";

interface SignInPageProps {
  readonly searchParams?: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const isNoAccount = params?.error === "no_account";

  return (
    <div className="y2k-grid relative flex min-h-screen flex-col pb-12">
      <Decorations />
      <MinimalHeader />
      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <Window title="SIGN_IN.EXE" className="w-full max-w-md">
          {isNoAccount && (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-2 border-2 border-btn-danger bg-window-body p-3 font-body text-sm font-bold text-btn-danger shadow-[2px_2px_0_var(--border)]"
            >
              <p>No account associated with this email, please sign up.</p>
              <Link
                href="/sign-up"
                className="text-xs font-bold underline hover:text-foreground"
              >
                Go to Sign Up →
              </Link>
            </div>
          )}
          <SignIn appearance={clerkY2kAppearance} />
        </Window>
      </main>
    </div>
  );
}
