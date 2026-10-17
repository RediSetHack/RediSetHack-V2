import { Injectable } from '@nestjs/common';
import { AccountDeletionRepository } from '../domain/ports/account-deletion.repository.js';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly accounts: AccountDeletionRepository) {}

  execute(userId: string): Promise<void> {
    return this.accounts.deleteUser(userId);
  }
}
