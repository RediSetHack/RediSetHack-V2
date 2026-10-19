export class DraftNotFoundError extends Error {
  constructor(id: number) {
    super(`Draft ${id} does not exist`);
    this.name = "DraftNotFoundError";
  }
}

export class DraftNotOwnedError extends Error {
  constructor() {
    super("This draft belongs to another contributor");
    this.name = "DraftNotOwnedError";
  }
}

export class DraftSubmittedError extends Error {
  constructor() {
    super("This draft has been submitted for review and can no longer be changed");
    this.name = "DraftSubmittedError";
  }
}

export class DraftRevisionConflictError extends Error {
  constructor() {
    super("The draft changed since you loaded it; reload the latest revision and try again");
    this.name = "DraftRevisionConflictError";
  }
}

export class ParentZoneNotFoundError extends Error {
  constructor(zoneId: number) {
    super(`Zone ${zoneId} does not exist or is archived`);
    this.name = "ParentZoneNotFoundError";
  }
}

export class ActivityNotFoundError extends Error {
  constructor(readonly activityIds: number[]) {
    super(`Exercise activity ${activityIds.join(", ")} does not exist`);
    this.name = "ActivityNotFoundError";
  }
}
