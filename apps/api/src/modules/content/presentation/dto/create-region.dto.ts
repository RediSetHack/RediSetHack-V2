import { CreateHierarchyNodeRequestDto } from './create-hierarchy-node.dto.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRegionRequestDto extends CreateHierarchyNodeRequestDto {
  @ApiPropertyOptional({
    description:
      'Story introduction; when present, designates this Region as a Novel.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  storyIntro?: string;
}
