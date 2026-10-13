import { PartialType } from '@nestjs/swagger';

import { CreateRegionRequestDto } from './create-region.dto.js';

export class UpdateRegionRequestDto extends PartialType(
  CreateRegionRequestDto,
) {}
