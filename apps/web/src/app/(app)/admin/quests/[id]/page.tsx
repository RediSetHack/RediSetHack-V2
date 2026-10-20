import { QuestForm } from "../quest-form";

export default async function EditQuestPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <QuestForm mode="edit" id={id} />;
}
