import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateZoneRequestDto } from './create-zone.dto.js';

export class UpdateZoneRequestDto extends PartialType(
  OmitType(CreateZoneRequestDto, ['regionId'] as const),
) {}
