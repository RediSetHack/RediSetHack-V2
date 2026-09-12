import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

interface SignInPageProps {
  readonly searchParams?: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const isNoAccount = params?.error === "no_account";

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {isNoAccount && (
          <div
            role="alert"
            className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm font-medium flex flex-col gap-2"
          >
            <p>No account associated with this email, please sign up.</p>
            <Link
              href="/sign-up"
              className="underline font-semibold hover:text-destructive/80 text-xs"
            >
              Go to Sign Up →
            </Link>
          </div>
        )}
        <SignIn
          appearance={{
            elements: {
              card: "shadow-lg border border-border rounded-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
