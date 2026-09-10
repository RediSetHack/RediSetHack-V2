import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ClerkAuthPort } from "./domain/ports/clerk-auth.port.js";
import { UserRepository } from "./domain/ports/user.repository.js";
import { CharacterRepository } from "./domain/ports/character.repository.js";
import { EnsureUserUseCase } from "./application/ensure-user.use-case.js";
import { SelectCharacterUseCase } from "./application/select-character.use-case.js";
import { CLERK_CLIENT, clerkClientFactory, ClerkAuthService } from "./infrastructure/clerk-auth.service.js";
import { DrizzleUserRepository } from "./infrastructure/drizzle-user.repository.js";
import { DrizzleCharacterRepository } from "./infrastructure/drizzle-character.repository.js";
import { ClerkAuthGuard } from "./presentation/guards/clerk-auth.guard.js";
import { AdminGuard } from "./presentation/guards/admin.guard.js";
import { SelectCharacterController } from "./presentation/controllers/select-character.controller.js";

@Global()
@Module({
  controllers: [SelectCharacterController],
  providers: [
    {
      provide: CLERK_CLIENT,
      useFactory: clerkClientFactory,
      inject: [ConfigService],
    },
    { provide: ClerkAuthPort, useClass: ClerkAuthService },
    { provide: UserRepository, useClass: DrizzleUserRepository },
    { provide: CharacterRepository, useClass: DrizzleCharacterRepository },
    ClerkAuthGuard,
    AdminGuard,
    EnsureUserUseCase,
    SelectCharacterUseCase,
  ],
  exports: [
    ClerkAuthPort,
    ClerkAuthGuard,
    AdminGuard,
    UserRepository,
    EnsureUserUseCase,
    SelectCharacterUseCase,
  ],
})
export class AuthModule {}