import { Zone } from "../../domain/entities/zone.entity.js";

export class ZonePresenter {
  static toResponse(zone: Zone) {
    return {
      id: zone.id,
      regionId: zone.regionId,
      name: zone.name,
      slug: zone.slug,
      description: zone.description,
      sortOrder: zone.sortOrder,
    };
  }
}
