import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { ListDiscoverableContentUseCase } from '../../application/list-discoverable-content.use-case.js';
import { DiscoveryResponseSchema } from '@repo/contracts';
import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator.js';
import type { ClerkAuthenticatedUser } from '../../../auth/domain/ports/clerk-auth.port.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

const DiscoverQuerySchema = z.object({
  q: z.string().optional(),
  competency: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? undefined : Number(value)))
    .refine((value) => value === undefined || Number.isFinite(value), {
      message: 'limit must be a number',
    }),
});

type DiscoverQuery = z.infer<typeof DiscoverQuerySchema>;

@ApiTags('Catalog Browsing')
@Controller('v1/api/discover')
export class ListDiscoverableContentController {
  constructor(private readonly listDiscoverable: ListDiscoverableContentUseCase) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Discover approved learning content by interest and difficulty.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search titles and slugs.' })
  @ApiQuery({
    name: 'competency',
    required: false,
    description: 'Filter activities by competency id.',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    enum: ['beginner', 'intermediate', 'advanced'],
    description: 'Filter activities by difficulty.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results (bounded).',
  })
  @ApiZodResponse(DiscoveryResponseSchema)
  async handle(
    @CurrentUser() user: ClerkAuthenticatedUser,
    @Query() rawQuery: DiscoverQuery,
  ) {
    const query: DiscoverQuery = DiscoverQuerySchema.parse(rawQuery);
    const items = await this.listDiscoverable.execute(user.id, {
      q: query.q,
      competency: query.competency,
      difficulty: query.difficulty,
      limit: query.limit,
    });
    return DiscoveryResponseSchema.parse(items);
  }
}
