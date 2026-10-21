import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { MinimalHeader } from "@/components/app-shell";
import { Decorations } from "@/components/y2k";

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
        <div className="w-full max-w-md space-y-4">
          {isNoAccount && (
            <div
              role="alert"
              className="border-2 border-btn-danger bg-window-body p-4 text-btn-danger shadow-[3px_3px_0_var(--border)] font-body text-sm font-bold flex flex-col gap-2"
            >
              <p>No account associated with this email, please sign up.</p>
              <Link
                href="/sign-up"
                className="underline font-bold hover:text-foreground text-xs"
              >
                Go to Sign Up →
              </Link>
            </div>
          )}
          <SignIn />
        </div>
      </main>
    </div>
  );
}
