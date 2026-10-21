import { SignUp } from "@clerk/nextjs";
import { MinimalHeader } from "@/components/app-shell";
import { Decorations, Window } from "@/components/y2k";
import { clerkY2kAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="y2k-grid relative flex min-h-screen flex-col pb-12">
      <Decorations />
      <MinimalHeader />
      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <Window title="SIGN_UP.EXE" className="w-full max-w-md">
          <SignUp
            fallbackRedirectUrl="/sign-up/complete"
            forceRedirectUrl="/sign-up/complete"
            appearance={clerkY2kAppearance}
          />
        </Window>
      </main>
    </div>
  );
}
