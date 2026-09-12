import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ClerkAuthPort } from "./domain/ports/clerk-auth.port.js";
import { UserRepository } from "./domain/ports/user.repository.js";
import { CharacterRepository } from "./domain/ports/character.repository.js";
import { EnsureUserUseCase } from "./application/ensure-user.use-case.js";
import { GetUserUseCase } from "./application/get-user.use-case.js";
import { SelectCharacterUseCase } from "./application/select-character.use-case.js";
import { CLERK_CLIENT, clerkClientFactory, ClerkAuthService } from "./infrastructure/clerk-auth.service.js";
import { DrizzleUserRepository } from "./infrastructure/drizzle-user.repository.js";
import { DrizzleCharacterRepository } from "./infrastructure/drizzle-character.repository.js";
import { ClerkAuthGuard } from "./presentation/guards/clerk-auth.guard.js";
import { AdminGuard } from "./presentation/guards/admin.guard.js";
import { SelectCharacterController } from "./presentation/controllers/select-character.controller.js";
import { GetUserMeController } from "./presentation/controllers/get-user-me.controller.js";
import { SyncUserController } from "./presentation/controllers/sync-user.controller.js";
import { ClerkWebhookController, CLERK_WEBHOOK_SECRET } from "./presentation/controllers/clerk-webhook.controller.js";

@Global()
@Module({
  controllers: [
    SelectCharacterController,
    GetUserMeController,
    SyncUserController,
    ClerkWebhookController,
  ],
  providers: [
    {
      provide: CLERK_CLIENT,
      useFactory: clerkClientFactory,
      inject: [ConfigService],
    },
    {
      provide: CLERK_WEBHOOK_SECRET,
      useFactory: (config: ConfigService) => config.get<string>("CLERK_WEBHOOK_SECRET") ?? "",
      inject: [ConfigService],
    },
    { provide: ClerkAuthPort, useClass: ClerkAuthService },
    { provide: UserRepository, useClass: DrizzleUserRepository },
    { provide: CharacterRepository, useClass: DrizzleCharacterRepository },
    ClerkAuthGuard,
    AdminGuard,
    EnsureUserUseCase,
    GetUserUseCase,
    SelectCharacterUseCase,
  ],
  exports: [
    ClerkAuthPort,
    ClerkAuthGuard,
    AdminGuard,
    UserRepository,
    CharacterRepository,
    EnsureUserUseCase,
    GetUserUseCase,
    SelectCharacterUseCase,
  ],
})
export class AuthModule {}