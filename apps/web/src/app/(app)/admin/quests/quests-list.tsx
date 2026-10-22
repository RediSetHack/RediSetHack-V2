"use client";

import { useEffect, useMemo, useState } from "react";
import { ResourceList, type ListColumn, type ListFilter } from "@/components/admin/resource-list";
import { API_URL, useCatalog, useToken } from "@/components/admin/use-catalog";
import { deleteAdminQuest, getAdminQuests, type AdminQuestRecord } from "@/lib/api-client";
import { formatMmSs, formatXp } from "@/lib/format";

export function QuestsList() {
  const auth = useToken();
  const { token } = auth;
  const catalog = useCatalog(auth, { stages: true });
  const [rows, setRows] = useState<AdminQuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const quests = await getAdminQuests(API_URL, token);
        if (!cancelled) {
          setRows(quests);
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
  }, [token, version]);

  const stageInfo = useMemo(() => {
    const byId = new Map(catalog.stages.map((stage) => [stage.id, stage]));
    const zoneByStage = new Map(catalog.stages.map((stage) => [stage.id, stage.zoneId]));
    return { byId, zoneByStage };
  }, [catalog.stages]);

  const stageLabel = (stageId: number) => {
    const stage = stageInfo.byId.get(stageId);
    const zoneId = stageInfo.zoneByStage.get(stageId);
    const zone = zoneId === undefined ? undefined : catalog.zones.find((candidate) => candidate.id === zoneId);
    const region = zone === undefined ? undefined : catalog.regions.find((candidate) => candidate.id === zone.regionId);
    const stageName = stage?.title ?? "#" + stageId;
    return `${region?.name ?? "?"} › ${zone?.name ?? "?"} › ${stageName}`;
  };

  const columns: readonly ListColumn<AdminQuestRecord>[] = [
    { key: "title", header: "Title", sortValue: (row) => row.title, render: (row) => row.title },
    { key: "stage", header: "Stage", sortValue: (row) => stageLabel(row.stageId), render: (row) => stageLabel(row.stageId) },
    { key: "questions", header: "Questions #", sortValue: (row) => row.questions.length, render: (row) => row.questions.length },
    { key: "time", header: "Time limit", sortValue: (row) => row.timeLimitSeconds, render: (row) => formatMmSs(row.timeLimitSeconds) },
    { key: "passing", header: "Passing %", sortValue: (row) => row.passingScore, render: (row) => `${row.passingScore}%` },
    { key: "xp", header: "XP reward", sortValue: (row) => row.xpReward, render: (row) => formatXp(row.xpReward) },
  ];

  const filters: readonly ListFilter<AdminQuestRecord>[] = [
    {
      key: "region",
      label: "Region",
      options: catalog.regions.map((region) => ({ value: String(region.id), label: region.name })),
      match: (row, value) => value === null || catalog.zones.find((zone) => zone.id === stageInfo.zoneByStage.get(row.stageId))?.regionId === Number(value),
    },
    {
      key: "zone",
      label: "Zone",
      options: catalog.zones.map((zone) => ({ value: String(zone.id), label: zone.name })),
      match: (row, value) => value === null || stageInfo.zoneByStage.get(row.stageId) === Number(value),
    },
    {
      key: "stage",
      label: "Stage",
      options: catalog.stages.map((stage) => ({ value: String(stage.id), label: stage.title })),
      match: (row, value) => value === null || row.stageId === Number(value),
    },
  ];

  return (
    <ResourceList<AdminQuestRecord>
      title="QUESTS.EXE"
      rows={rows}
      columns={columns}
      filters={filters}
      searchPlaceholder="Search Quests…"
      haystack={(row) => `${row.title} ${stageLabel(row.stageId)}`}
      newHref="/admin/quests/new"
      newLabel="NEW QUEST"
      emptyMessage="No Quests yet — create the first one."
      loading={loading}
      error={error}
      deleteItem={deleteAdminQuest}
      deleteName={(row) => row.title}
      onDeleted={() => setVersion((value) => value + 1)}
    />
  );
}
