import { CatalogList } from "@/components/catalog-list";
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
      <CatalogList items={regions} hrefFor={(region) => `/map/${region.id}`} />
    </div>
  );
}
