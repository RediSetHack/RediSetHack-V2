import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BadgeDefinitionSchema } from '@repo/contracts';

import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';
import { CreateBadgeDefinitionUseCase } from '../../application/create-badge-definition.use-case.js';
import { CreateBadgeDefinitionRequestDto } from '../dto/create-badge-definition.dto.js';
import { BadgeDefinitionPresenter } from '../presenters.js';
import {
  AdminOnly,
  ApiParentNotFound,
  asNotFound,
} from './admin-crud.shared.js';

@ApiTags('Admin: Badges')
@Controller('v1/api/admin/badges')
export class CreateBadgeDefinitionController {
  constructor(private readonly createBadge: CreateBadgeDefinitionUseCase) {}
  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a Badge definition.' })
  @ApiZodResponse(BadgeDefinitionSchema, { status: 201 })
  @ApiParentNotFound('Zone')
  async handle(@Body() dto: CreateBadgeDefinitionRequestDto) {
    try {
      return BadgeDefinitionPresenter.toResponse(
        await this.createBadge.execute(dto),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}
