import {
  applyDecorators,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';

import { AdminGuard } from '../../../auth/presentation/guards/admin.guard.js';
import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import {
  BadgeDefinitionNotFoundError,
  CharacterNotFoundError,
  ParentRegionNotFoundError,
  ParentStageNotFoundError,
  ParentZoneNotFoundError,
  QuestNotFoundError,
  RegionNotFoundError,
  StageNotFoundError,
  ZoneNotFoundError,
} from '../../domain/errors.js';

// Every content-administration route requires both a signed-in User and the
// admin role, so the auth documentation for all of them is attached once,
// here, alongside the guards that actually enforce it.
export const AdminOnly = () =>
  applyDecorators(
    UseGuards(ClerkAuthGuard, AdminGuard),
    ApiBearerAuth(),
    ApiForbiddenResponse({ description: 'The caller is not an admin.' }),
  );

// Mirrors the mapping `asNotFound` applies below, so every route that
// calls it documents the outcome it can actually produce.
export const ApiEntityNotFound = (entity: string) =>
  ApiNotFoundResponse({ description: `${entity} not found.` });

export const ApiParentNotFound = (parent: string) =>
  ApiBadRequestResponse({ description: `Parent ${parent} not found.` });

export const ApiIdParam = (entity: string) =>
  ApiParam({ name: 'id', description: `The ${entity}'s id.` });

export function asNotFound(error: unknown): never {
  if (
    error instanceof RegionNotFoundError ||
    error instanceof ZoneNotFoundError ||
    error instanceof StageNotFoundError ||
    error instanceof QuestNotFoundError ||
    error instanceof BadgeDefinitionNotFoundError ||
    error instanceof CharacterNotFoundError
  ) {
    throw new NotFoundException(error.message);
  }
  if (
    error instanceof ParentRegionNotFoundError ||
    error instanceof ParentZoneNotFoundError ||
    error instanceof ParentStageNotFoundError
  ) {
    throw new BadRequestException(error.message);
  }
  throw error;
}
