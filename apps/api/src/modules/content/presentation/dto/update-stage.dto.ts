import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateStageRequestDto } from './create-stage.dto.js';

export class UpdateStageRequestDto extends PartialType(
  OmitType(CreateStageRequestDto, ['zoneId'] as const),
) {}
