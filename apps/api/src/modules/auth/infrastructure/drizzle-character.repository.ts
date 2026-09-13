import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { characters, DEFAULT_CHARACTERS, type Database } from '@repo/db';

import { DB } from '../../../database/database.module.js';
import { Character } from '../domain/entities/character.entity.js';
import { CharacterRepository } from '../domain/ports/character.repository.js';

@Injectable()
export class DrizzleCharacterRepository implements CharacterRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<Character | null> {
    let row = await this.database.query.characters.findFirst({
      where: eq(characters.id, id),
    });

    if (!row) {
      const existing = await this.database
        .select({ id: characters.id })
        .from(characters)
        .limit(1);

      if (existing.length === 0) {
        await this.seedDefaults();
        row = await this.database.query.characters.findFirst({
          where: eq(characters.id, id),
        });
      }
    }

    if (!row) return null;
    return new Character(
      row.id,
      row.name,
      row.slug,
      row.description,
      row.imageUrl,
    );
  }

  private async seedDefaults(): Promise<void> {
    for (const char of DEFAULT_CHARACTERS) {
      await this.database
        .insert(characters)
        .values({
          id: char.id,
          name: char.name,
          slug: char.slug,
          description: char.description,
        })
        .onConflictDoNothing();
    }
  }

  async create(input: {
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
  }): Promise<Character> {
    const rows = await this.database
      .insert(characters)
      .values(input)
      .returning();
    const row = rows[0]!;
    return new Character(
      row.id,
      row.name,
      row.slug,
      row.description,
      row.imageUrl,
    );
  }

  async update(
    id: number,
    input: Partial<{
      name: string;
      slug: string;
      description: string | null;
      imageUrl: string | null;
    }>,
  ): Promise<Character | null> {
    const rows = await this.database
      .update(characters)
      .set(input)
      .where(eq(characters.id, id))
      .returning();
    const row = rows[0];
    return row
      ? new Character(row.id, row.name, row.slug, row.description, row.imageUrl)
      : null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.database
      .delete(characters)
      .where(eq(characters.id, id))
      .returning({ id: characters.id });
    return rows.length > 0;
  }
}
