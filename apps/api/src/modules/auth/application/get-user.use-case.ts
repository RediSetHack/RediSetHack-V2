import { Injectable } from "@nestjs/common";

import { UserRepository } from "../domain/ports/user.repository.js";
import { User } from "../domain/entities/user.entity.js";
import { UserNotFoundError } from "../domain/errors.js";

@Injectable()
export class GetUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    return user;
  }
}
