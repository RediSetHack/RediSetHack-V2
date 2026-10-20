import { StageForm } from "../stage-form";

export default async function EditStagePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <StageForm mode="edit" id={id} />;
}
