import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";

import { ListZonesUseCase } from "../../application/list-zones.use-case.js";
import { ZonePresenter } from "../presenters/zone.presenter.js";

@Controller("v1/api/regions/:regionId/zones")
export class ListZonesController {
  constructor(private readonly listZones: ListZonesUseCase) {}

  @Get()
  async handle(@Param("regionId", ParseIntPipe) regionId: number) {
    const zones = await this.listZones.execute(regionId);
    return zones.map(ZonePresenter.toResponse);
  }
}
