import { RegionForm } from "../region-form";

export default async function EditRegionPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <RegionForm mode="edit" id={id} />;
}
