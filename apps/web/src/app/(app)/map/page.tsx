import Link from "next/link";
import { getRegions } from "@/lib/api-client";
import { AvatarOrInitial, EmptyState, Y2kButton, Window } from "@/components/y2k";
import { ErrorAlert } from "@/components/y2k-dialog";

export default async function MapPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  let regions;
  try {
    regions = await getRegions(apiUrl);
  } catch {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Window title="MAP.EXE">
          <ErrorAlert message="Regions could not be loaded. Please try again." />
        </Window>
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Window title="MAP.EXE">
          <EmptyState title="No Regions yet." />
        </Window>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <Window title="MAP.EXE">
        <h1 className="mb-4 font-pixel text-[18px] leading-relaxed text-foreground">
          Choose a Region
        </h1>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => (
            <li key={region.id}>
              <article className="flex h-full flex-col border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)]">
                <header className="flex items-center justify-between gap-2 border-b-2 border-border bg-title-bar px-3 py-1">
                  <span className="font-pixel text-[9px] leading-relaxed text-foreground">
                    {region.name}
                  </span>
                </header>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  <div className="flex items-start gap-3">
                    <AvatarOrInitial
                      name={region.name}
                      className="y2k-checker size-16 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      {region.description && (
                        <p className="font-body text-sm font-bold text-foreground">
                          {region.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Link href={`/map/${region.id}`} className="w-full">
                      <Y2kButton className="w-full">ENTER</Y2kButton>
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Window>
    </div>
  );
}
