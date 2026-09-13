import { Injectable } from "@nestjs/common";

import { ZoneRepository } from "../domain/ports/zone.repository.js";
import { Zone } from "../domain/entities/zone.entity.js";

@Injectable()
export class ListZonesUseCase {
  constructor(private readonly zones: ZoneRepository) {}

  async execute(regionId: number): Promise<Zone[]> {
    return this.zones.findByRegionId(regionId);
  }
}
