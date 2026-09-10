import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUp
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
