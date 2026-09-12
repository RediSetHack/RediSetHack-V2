import { User } from "../entities/user.entity.js";
import { ClerkAuthenticatedUser } from "./clerk-auth.port.js";

export abstract class UserRepository {
  abstract upsert(identity: ClerkAuthenticatedUser): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
  abstract updateCharacter(userId: string, characterId: number): Promise<User>;
  abstract awardXp(userId: string, amount: number): Promise<User>;
}