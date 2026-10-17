export abstract class AccountDeletionRepository {
  abstract deleteUser(userId: string): Promise<void>;
}
