"use client";

import { useEffect, useState } from "react";
import { AvatarOrInitial } from "@/components/y2k";
import { ResourceList, type ListColumn } from "@/components/admin/resource-list";
import { API_URL } from "@/components/admin/use-catalog";
import { deleteAdminCharacter, getCharacters, type Character } from "@/lib/api-client";

export function CharactersList() {
  const [rows, setRows] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const characters = await getCharacters(API_URL);
        if (!cancelled) {
          setRows(characters);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const columns: readonly ListColumn<Character>[] = [
    { key: "image", header: "Image", render: (row) => <AvatarOrInitial src={row.imageUrl} name={row.name} className="size-9" /> },
    { key: "name", header: "Name", sortValue: (row) => row.name, render: (row) => row.name },
    { key: "slug", header: "Slug", sortValue: (row) => row.slug, render: (row) => <code className="font-mono text-xs">{row.slug}</code> },
  ];

  return (
    <ResourceList<Character>
      title="CHARACTERS.EXE"
      rows={rows}
      columns={columns}
      searchPlaceholder="Search Characters…"
      haystack={(row) => `${row.name} ${row.slug}`}
      newHref="/admin/characters/new"
      newLabel="NEW CHARACTER"
      emptyMessage="No Characters yet — create the first one."
      loading={loading}
      error={error}
      deleteItem={deleteAdminCharacter}
      deleteName={(row) => row.name}
      cascadeWarning="Characters assigned to learners are archived rather than deleted."
      onDeleted={() => setVersion((value) => value + 1)}
    />
  );
}
