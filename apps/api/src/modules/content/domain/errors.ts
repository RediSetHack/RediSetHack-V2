export class RegionNotFoundError extends Error {
  constructor(id: number) {
    super(`Region with id ${id} does not exist`);
    this.name = 'RegionNotFoundError';
  }
}

export class ZoneNotFoundError extends Error {
  constructor(id: number) {
    super(`Zone with id ${id} does not exist`);
    this.name = 'ZoneNotFoundError';
  }
}

export class StageNotFoundError extends Error {
  constructor(id: number) {
    super(`Stage with id ${id} does not exist`);
    this.name = 'StageNotFoundError';
  }
}

export class QuestNotFoundError extends Error {
  constructor(id: number) {
    super(`Quest with id ${id} does not exist`);
    this.name = 'QuestNotFoundError';
  }
}

export class BadgeDefinitionNotFoundError extends Error {
  constructor(id: number) {
    super(`Badge definition with id ${id} does not exist`);
    this.name = 'BadgeDefinitionNotFoundError';
  }
}

export class ParentRegionNotFoundError extends Error {
  constructor(id: number) {
    super(`Region with id ${id} does not exist`);
    this.name = 'ParentRegionNotFoundError';
  }
}

export class ParentZoneNotFoundError extends Error {
  constructor(id: number) {
    super(`Zone with id ${id} does not exist`);
    this.name = 'ParentZoneNotFoundError';
  }
}

export class ParentStageNotFoundError extends Error {
  constructor(id: number) {
    super(`Stage with id ${id} does not exist`);
    this.name = 'ParentStageNotFoundError';
  }
}
