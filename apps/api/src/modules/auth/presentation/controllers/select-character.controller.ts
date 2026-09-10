import { Body, Controller, NotFoundException, Patch, UseGuards } from "@nestjs/common";

import { SelectCharacterUseCase } from "../../application/select-character.use-case.js";
import { CharacterNotFoundError } from "../../domain/errors.js";
import { ClerkAuthGuard } from "../guards/clerk-auth.guard.js";
import { CurrentUser } from "../decorators/current-user.decorator.js";
import { SelectCharacterRequestDto } from "../dto/select-character-request.dto.js";
import { UserPresenter } from "../presenters/user.presenter.js";
import type { ClerkAuthenticatedUser } from "../../domain/ports/clerk-auth.port.js";

@Controller("v1/api/user")
export class SelectCharacterController {
  constructor(private readonly selectCharacter: SelectCharacterUseCase) {}

  @Patch("character")
  @UseGuards(ClerkAuthGuard)
  async handle(
    @Body() dto: SelectCharacterRequestDto,
    @CurrentUser() user: ClerkAuthenticatedUser,
  ) {
    try {
      const updated = await this.selectCharacter.execute({
        userId: user.id,
        characterId: dto.characterId,
      });
      return UserPresenter.toResponse(updated);
    } catch (error) {
      if (error instanceof CharacterNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}