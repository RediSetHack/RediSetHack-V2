"use client";

import Link from "next/link";
import { Y2kAlert } from "@/components/y2k-dialog";
import { buttonClasses } from "@/components/y2k";

export function QuestResultNotFound() {
  return (
    <Y2kAlert
      open
      onOpenChange={() => {}}
      title="RESULT NOT FOUND"
      icon="alert"
      actions={
        <Link href="/quests" className={buttonClasses("primary")}>
          Back to Quests
        </Link>
      }
    >
      This Result does not exist, or it is not available for your account.
    </Y2kAlert>
  );
}
