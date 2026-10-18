import type { SideQuestLockReason } from '@repo/contracts';

export class SideQuestNotFoundError extends Error {
  constructor(sideQuestId: number) {
    super(`Side Quest with id ${sideQuestId} does not exist`);
    this.name = 'SideQuestNotFoundError';
  }
}

export class SideQuestLockedError extends Error {
  constructor(readonly lockReasons: SideQuestLockReason[]) {
    super('This Side Quest is locked: ' + lockReasons.map((r) => r.message).join(' '));
    this.name = 'SideQuestLockedError';
  }
}

export class SideQuestNotStartedError extends Error {
  constructor() {
    super('Start this Side Quest before submitting to it.');
    this.name = 'SideQuestNotStartedError';
  }
}
