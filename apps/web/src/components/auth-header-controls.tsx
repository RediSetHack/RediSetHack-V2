"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthHeaderControls() {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="default" size="sm">
            Sign Up
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          showName
          appearance={{
            elements: {
              userButtonOuterIdentifier:
                "text-sm font-medium text-foreground",
            },
          }}
        />
      </Show>
    </div>
  );
}
