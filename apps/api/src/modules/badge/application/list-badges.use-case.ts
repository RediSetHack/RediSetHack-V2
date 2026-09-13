import { Injectable } from '@nestjs/common';

import { BadgeDefinition } from '../domain/entities/badge.entity.js';
import { BadgeRepository } from '../domain/ports/badge.repository.js';

@Injectable()
export class ListBadgesUseCase {
  constructor(private readonly badges: BadgeRepository) {}

  execute(): Promise<BadgeDefinition[]> {
    return this.badges.findAll();
  }
}
