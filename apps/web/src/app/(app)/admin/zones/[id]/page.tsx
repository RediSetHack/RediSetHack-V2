import { ZoneForm } from "../zone-form";

export default async function EditZonePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <ZoneForm mode="edit" id={id} />;
}
