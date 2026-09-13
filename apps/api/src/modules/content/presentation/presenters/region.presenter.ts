import { Region } from "../../domain/entities/region.entity.js";

export class RegionPresenter {
  static toResponse(region: Region) {
    return {
      id: region.id,
      name: region.name,
      slug: region.slug,
      description: region.description,
      sortOrder: region.sortOrder,
    };
  }
}
