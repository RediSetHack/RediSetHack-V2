import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateQuestRequestDto } from './create-quest.dto.js';

export class UpdateQuestRequestDto extends PartialType(
  OmitType(CreateQuestRequestDto, ['stageId'] as const),
) {}
