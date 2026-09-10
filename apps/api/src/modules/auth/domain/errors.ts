export class CharacterNotFoundError extends Error {
  constructor(characterId: number) {
    super(`Character with id ${characterId} does not exist`);
    this.name = "CharacterNotFoundError";
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with id ${userId} does not exist`);
    this.name = "UserNotFoundError";
  }
}