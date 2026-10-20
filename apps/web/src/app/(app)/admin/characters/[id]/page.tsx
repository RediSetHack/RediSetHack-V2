import { CharacterForm } from "../character-form";

export default async function EditCharacterPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <CharacterForm mode="edit" id={id} />;
}
