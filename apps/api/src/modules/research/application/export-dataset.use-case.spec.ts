import { describe, expect, it } from "vitest";

import type { InteractionSourceRepository } from "../domain/ports/interaction-source.repository.js";
import { ExportDatasetUseCase, ResearchExportNotConfiguredError } from "./export-dataset.use-case.js";

const source = { listEligible: async () => [], countDeletedLearnerRows: async () => 0 } as InteractionSourceRepository;
const query = { strategy: "learner", limit: 10, seed: "v1" } as const;

describe("ExportDatasetUseCase", () => {
  it.each([undefined, "", "too-short"])("refuses to export without a strong key (%s)", async (key) => {
    await expect(new ExportDatasetUseCase(source, key).execute(query)).rejects.toBeInstanceOf(ResearchExportNotConfiguredError);
  });

  it("passes the source's deleted-learner count into the report", async () => {
    const withDeleted = { ...source, countDeletedLearnerRows: async () => 3 } as InteractionSourceRepository;
    const result = await new ExportDatasetUseCase(withDeleted, "k".repeat(32)).execute(query);
    expect(result.report.exclusions.deletedLearnerRows).toBe(3);
  });

  it("exports an empty dataset with a strong key", async () => {
    const result = await new ExportDatasetUseCase(source, "k".repeat(32)).execute(query);
    expect(result.rows).toEqual([]);
  });
});
