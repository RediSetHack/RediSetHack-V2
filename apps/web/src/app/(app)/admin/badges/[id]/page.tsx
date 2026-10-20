import { BadgeForm } from "../badge-form";

export default async function EditBadgePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <BadgeForm mode="edit" id={id} />;
}
