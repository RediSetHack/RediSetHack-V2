import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSideQuest, getSideQuests, type SideQuest, type SideQuestListItem } from "@/lib/api-client";
import { SideQuestDetail, SideQuestList } from "@/components/side-quests";
import { Breadcrumb, Sparkle, Window, buttonClasses } from "@/components/y2k";

export default async function SideQuestsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ quest?: string }> }>) {
  const { quest } = await searchParams;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { getToken } = await auth();
  const token = (await getToken()) ?? "";
  const id = Number(quest) > 0 ? Number(quest) : undefined;

  if (id) {
    let detail: SideQuest | null = null;
    try {
      detail = await getSideQuest(apiUrl, token, id);
    } catch {
      detail = null;
    }
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-4 p-6 sm:p-10">
        <Link href="/side-quests" className={buttonClasses("ghost")}>
          <ChevronLeft aria-hidden="true" className="size-3" /> ALL SIDE QUESTS
        </Link>
        <SideQuestDetail detail={detail} error={detail === null} />
      </div>
    );
  }

  let quests: SideQuestListItem[] | null = null;
  try {
    quests = await getSideQuests(apiUrl, token);
  } catch {
    quests = null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-6 sm:p-10">
      <Window title={<Breadcrumb items={[{ label: "SIDE-QUESTS" }]} />}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-pixel text-xl leading-relaxed text-foreground">
              Side Quests
            </h1>
            <p className="mt-2 font-body text-sm font-bold text-muted-foreground">
              Optional objectives. The main story never waits on them.
            </p>
          </div>
          <Sparkle size={20} />
        </div>
      </Window>
      <SideQuestList quests={quests} error={quests === null} />
    </div>
  );
}
