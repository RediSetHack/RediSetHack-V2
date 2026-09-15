import { User } from './domain/entities/user.entity.js';
import { UserRepository } from './domain/ports/user.repository.js';

// Shared test double: every integration spec that only needs `upsert` to
// satisfy EnsureUserUseCase (and never exercises the other UserRepository
// methods) needs the same fake, so it lives here instead of duplicated per
// spec file.
export function makeFakeUserRepository(): UserRepository {
  return {
    async upsert(identity) {
      return new User(
        identity.id,
        identity.email ?? '',
        identity.name,
        null,
        0,
      );
    },
    async findById() {
      return null;
    },
    async findByEmail() {
      return null;
    },
    async updateCharacter() {
      throw new Error('not used in this test');
    },
    async awardXp() {
      throw new Error('not used in this test');
    },
  };
}
