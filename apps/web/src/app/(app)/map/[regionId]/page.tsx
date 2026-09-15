import Link from "next/link";
import { notFound } from "next/navigation";
import { getZones } from "@/lib/api-client";

export default async function RegionZonesPage({
  params,
}: Readonly<{ params: Promise<{ regionId: string }> }>) {
  const { regionId } = await params;
  const regionIdNumber = Number(regionId);
  if (!Number.isInteger(regionIdNumber)) {
    notFound();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  let zones;
  try {
    zones = await getZones(apiUrl, regionIdNumber);
  } catch {
    return (
      <p role="alert" className="p-6 text-destructive">
        Zones could not be loaded. Please try again.
      </p>
    );
  }

  if (zones.length === 0) {
    return (
      <p className="p-6 text-muted-foreground">
        This Region has no Zones yet — check back soon.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-bold tracking-tight">Zones</h1>
      <ul className="mt-4 flex flex-col gap-2">
        {zones.map((zone) => (
          <li key={zone.id}>
            <Link
              href={`/map/${regionIdNumber}/${zone.id}`}
              className="block rounded-md border border-border/60 p-4 hover:bg-muted"
            >
              <p className="font-medium">{zone.name}</p>
              {zone.description && (
                <p className="text-sm text-muted-foreground">
                  {zone.description}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
