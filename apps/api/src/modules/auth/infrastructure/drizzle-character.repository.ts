import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { characters, type Database } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { Character } from "../domain/entities/character.entity.js";
import { CharacterRepository } from "../domain/ports/character.repository.js";

@Injectable()
export class DrizzleCharacterRepository implements CharacterRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<Character | null> {
    const row = await this.database.query.characters.findFirst({
      where: eq(characters.id, id),
    });
    if (!row) return null;
    return new Character(row.id, row.name, row.slug, row.description, row.imageUrl);
  }
}