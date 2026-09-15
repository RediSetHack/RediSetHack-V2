import Link from "next/link";

export interface CatalogListItem {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
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
    <ul className="mt-4 flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={hrefFor(item)}
            className="block rounded-md border border-border/60 p-4 hover:bg-muted"
          >
            <h2 className="font-medium">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
