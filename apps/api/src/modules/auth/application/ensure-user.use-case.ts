import { Injectable } from "@nestjs/common";

import { UserRepository } from "../domain/ports/user.repository.js";
import { ClerkAuthenticatedUser } from "../domain/ports/clerk-auth.port.js";
import { User } from "../domain/entities/user.entity.js";

@Injectable()
export class EnsureUserUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(identity: ClerkAuthenticatedUser): Promise<User> {
    return this.users.upsert(identity);
  }
}