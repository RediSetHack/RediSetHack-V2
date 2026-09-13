export class RegionNotFoundError extends Error {
  constructor(regionId: number) {
    super(`Region with id ${regionId} does not exist`);
    this.name = "RegionNotFoundError";
  }
}

export class ZoneNotFoundError extends Error {
  constructor(zoneId: number) {
    super(`Zone with id ${zoneId} does not exist`);
    this.name = "ZoneNotFoundError";
  }
}
