import { Controller, Get } from "@nestjs/common";

import { ListRegionsUseCase } from "../../application/list-regions.use-case.js";
import { RegionPresenter } from "../presenters/region.presenter.js";

@Controller("v1/api/regions")
export class ListRegionsController {
  constructor(private readonly listRegions: ListRegionsUseCase) {}

  @Get()
  async handle() {
    const regions = await this.listRegions.execute();
    return regions.map(RegionPresenter.toResponse);
  }
}
