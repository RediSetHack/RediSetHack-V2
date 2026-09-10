import { User } from "../../domain/entities/user.entity.js";

export class UserPresenter {
  static toResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      characterId: user.characterId,
      totalXp: user.totalXp,
    };
  }
}