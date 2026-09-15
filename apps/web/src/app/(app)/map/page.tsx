import Link from "next/link";
import { getRegions } from "@/lib/api-client";

export default async function MapPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  let regions;
  try {
    regions = await getRegions(apiUrl);
  } catch {
    return (
      <p role="alert" className="p-6 text-destructive">
        Regions could not be loaded. Please try again.
      </p>
    );
  }

  if (regions.length === 0) {
    return (
      <p className="p-6 text-muted-foreground">
        No Regions yet — check back soon.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-bold tracking-tight">Regions</h1>
      <ul className="mt-4 flex flex-col gap-2">
        {regions.map((region) => (
          <li key={region.id}>
            <Link
              href={`/map/${region.id}`}
              className="block rounded-md border border-border/60 p-4 hover:bg-muted"
            >
              <p className="font-medium">{region.name}</p>
              {region.description && (
                <p className="text-sm text-muted-foreground">
                  {region.description}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
