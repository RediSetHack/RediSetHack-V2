import type { AuthoredLessonBlock } from "../draft.js";

export type DraftRecord = {
  id: number;
  ownerId: string;
  zoneId: number;
  title: string;
  lessonContent: AuthoredLessonBlock[];
  status: "draft" | "submitted";
  revision: number;
  submittedRevision: number | null;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
};

export abstract class DraftRepository {
  abstract list(ownerId: string): Promise<DraftRecord[]>;
  abstract findById(id: number): Promise<DraftRecord | null>;
  /** True when the Zone exists and neither it nor its Region is archived. */
  abstract zoneIsOpen(zoneId: number): Promise<boolean>;
  /** Subset of `ids` that are not existing coding activities. */
  abstract missingActivities(ids: number[]): Promise<number[]>;
  abstract create(input: { ownerId: string; zoneId: number; title: string; lessonContent: AuthoredLessonBlock[] }): Promise<DraftRecord>;
  /** Applies only while still a `draft` at `expectedRevision`; null when that no longer holds. */
  abstract update(id: number, expectedRevision: number, data: { title: string; lessonContent: AuthoredLessonBlock[] }): Promise<DraftRecord | null>;
  /** Freezes `expectedRevision`; null when the draft is no longer a `draft` at that revision. */
  abstract submit(id: number, expectedRevision: number): Promise<DraftRecord | null>;
}
