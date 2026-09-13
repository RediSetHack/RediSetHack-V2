import { Injectable } from "@nestjs/common";

import { RegionRepository } from "../domain/ports/region.repository.js";
import { Region } from "../domain/entities/region.entity.js";

@Injectable()
export class ListRegionsUseCase {
  constructor(private readonly regions: RegionRepository) {}

  async execute(): Promise<Region[]> {
    return this.regions.findAll();
  }
}
