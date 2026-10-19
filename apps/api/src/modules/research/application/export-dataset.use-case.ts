import { Inject, Injectable } from "@nestjs/common";
import type { DatasetExport, DatasetExportQuery } from "@repo/contracts";

import { buildDataset } from "../domain/dataset.js";
import { InteractionSourceRepository } from "../domain/ports/interaction-source.repository.js";

export const RESEARCH_PSEUDONYM_KEY = Symbol("RESEARCH_PSEUDONYM_KEY");
const MIN_KEY_LENGTH = 32;

export class ResearchExportNotConfiguredError extends Error {
  constructor() {
    super(`Research export is disabled: set RESEARCH_PSEUDONYM_KEY to a secret of at least ${MIN_KEY_LENGTH} characters`);
    this.name = "ResearchExportNotConfiguredError";
  }
}

@Injectable()
export class ExportDatasetUseCase {
  constructor(
    private readonly source: InteractionSourceRepository,
    @Inject(RESEARCH_PSEUDONYM_KEY) private readonly key: string | undefined,
  ) {}

  async execute(query: DatasetExportQuery): Promise<DatasetExport> {
    if (!this.key || this.key.length < MIN_KEY_LENGTH) throw new ResearchExportNotConfiguredError();
    const [records, deleted] = await Promise.all([this.source.listEligible(query.limit), this.source.countDeletedLearnerRows()]);
    return buildDataset(records, query, this.key, deleted);
  }
}
