import { Zone } from '../entities/zone.entity.js';

export abstract class ZoneRepository {
  abstract findByRegionId(regionId: number): Promise<Zone[]>;
  /** Every non-archived Zone, ordered for discovery listing. */
  abstract findAll(): Promise<Zone[]>;
}
