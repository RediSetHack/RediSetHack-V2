import { Region } from "../entities/region.entity.js";

export abstract class RegionRepository {
  abstract findAll(): Promise<Region[]>;
}
