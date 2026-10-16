import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { CreateHierarchyNodeRequestDto } from './create-hierarchy-node.dto.js';

export class CreateZoneRequestDto extends CreateHierarchyNodeRequestDto {
  @ApiProperty({ example: 1, description: 'The parent Region’s id.' })
  @IsInt()
  @Min(1)
  regionId!: number;
}
