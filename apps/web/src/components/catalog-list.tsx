import Link from "next/link";
import { AvatarOrInitial, Y2kButton } from "@/components/y2k";

export interface CatalogListItem {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly storyIntro?: string | null;
}

/** A list of catalog cards (Regions or Zones), each linking to its children. */
export function CatalogList<T extends CatalogListItem>({
  items,
  hrefFor,
}: Readonly<{
  items: readonly T[];
  hrefFor: (item: T) => string;
}>) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <article className="flex h-full flex-col border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)]">
            <header className="flex items-center justify-between gap-2 border-b-2 border-border bg-title-bar px-3 py-1">
              <span className="font-pixel text-[9px] leading-relaxed text-foreground">
                {item.name}
              </span>
            </header>
            <div className="flex flex-1 flex-col gap-3 p-3">
              <div className="flex items-start gap-3">
                <AvatarOrInitial
                  name={item.name}
                  className="y2k-checker size-16 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  {item.description && (
                    <p className="font-body text-sm font-bold text-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-auto">
                <Link href={hrefFor(item)} className="w-full">
                  <Y2kButton className="w-full">ENTER</Y2kButton>
                </Link>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
