import {
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';

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

export const AdminOnly = () => UseGuards(ClerkAuthGuard, AdminGuard);

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
