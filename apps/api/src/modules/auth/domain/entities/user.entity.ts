export type UserRole = "admin" | "user";

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string | null,
    public readonly characterId: number | null,
    public readonly totalXp: number,
  ) {}
}