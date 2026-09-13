// Single-action admin controllers for the content catalog (issue #13, ADR 0001).
// Every route is guarded by ClerkAuthGuard + AdminGuard: non-admins get 403.

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../../auth/presentation/guards/admin.guard.js';
import { ClerkAuthGuard } from '../../auth/presentation/guards/clerk-auth.guard.js';
import {
  BadgeDefinitionNotFoundError,
  ParentRegionNotFoundError,
  ParentStageNotFoundError,
  ParentZoneNotFoundError,
  QuestNotFoundError,
  RegionNotFoundError,
  StageNotFoundError,
  ZoneNotFoundError,
} from '../domain/errors.js';
import { CharacterNotFoundError } from '../domain/errors.js';
import { CreateBadgeDefinitionUseCase } from '../application/create-badge-definition.use-case.js';
import { CreateCharacterUseCase } from '../application/create-character.use-case.js';
import { CreateQuestUseCase } from '../application/create-quest.use-case.js';
import { CreateRegionUseCase } from '../application/create-region.use-case.js';
import { CreateStageUseCase } from '../application/create-stage.use-case.js';
import { CreateZoneUseCase } from '../application/create-zone.use-case.js';
import { DeleteBadgeDefinitionUseCase } from '../application/delete-badge-definition.use-case.js';
import { DeleteCharacterUseCase } from '../application/delete-character.use-case.js';
import { DeleteQuestUseCase } from '../application/delete-quest.use-case.js';
import { DeleteRegionUseCase } from '../application/delete-region.use-case.js';
import { DeleteStageUseCase } from '../application/delete-stage.use-case.js';
import { DeleteZoneUseCase } from '../application/delete-zone.use-case.js';
import { GetBadgeDefinitionUseCase } from '../application/get-badge-definition.use-case.js';
import { GetCharacterUseCase } from '../application/get-character.use-case.js';
import { GetQuestUseCase } from '../application/get-quest.use-case.js';
import { GetRegionUseCase } from '../application/get-region.use-case.js';
import { GetStageUseCase } from '../application/get-stage.use-case.js';
import { GetZoneUseCase } from '../application/get-zone.use-case.js';
import { UpdateBadgeDefinitionUseCase } from '../application/update-badge-definition.use-case.js';
import { UpdateCharacterUseCase } from '../application/update-character.use-case.js';
import { UpdateQuestUseCase } from '../application/update-quest.use-case.js';
import { UpdateRegionUseCase } from '../application/update-region.use-case.js';
import { UpdateStageUseCase } from '../application/update-stage.use-case.js';
import { UpdateZoneUseCase } from '../application/update-zone.use-case.js';
import {
  CreateBadgeDefinitionRequestDto,
  CreateCharacterRequestDto,
  CreateQuestRequestDto,
  CreateRegionRequestDto,
  CreateStageRequestDto,
  CreateZoneRequestDto,
  UpdateBadgeDefinitionRequestDto,
  UpdateCharacterRequestDto,
  UpdateQuestRequestDto,
  UpdateRegionRequestDto,
  UpdateStageRequestDto,
  UpdateZoneRequestDto,
} from './dto.js';
import {
  BadgeDefinitionPresenter,
  CharacterPresenter,
  QuestPresenter,
  RegionPresenter,
  StagePresenter,
  ZonePresenter,
} from './presenters.js';

const AdminOnly = () => UseGuards(ClerkAuthGuard, AdminGuard);

function asNotFound(error: unknown): never {
  if (
    error instanceof RegionNotFoundError ||
    error instanceof ZoneNotFoundError ||
    error instanceof StageNotFoundError ||
    error instanceof QuestNotFoundError ||
    error instanceof BadgeDefinitionNotFoundError ||
    error instanceof CharacterNotFoundError
  ) {
    throw new NotFoundException(error.message);
  }
  if (
    error instanceof ParentRegionNotFoundError ||
    error instanceof ParentZoneNotFoundError ||
    error instanceof ParentStageNotFoundError
  ) {
    throw new BadRequestException(error.message);
  }
  throw error;
}

// --- Regions -----------------------------------------------------------

@Controller('v1/api/admin/regions')
export class CreateRegionController {
  constructor(private readonly createRegion: CreateRegionUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateRegionRequestDto) {
    return RegionPresenter.toResponse(await this.createRegion.execute(dto));
  }
}

@Controller('v1/api/admin/regions')
export class GetRegionController {
  constructor(private readonly getRegion: GetRegionUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return RegionPresenter.toResponse(await this.getRegion.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/regions')
export class UpdateRegionController {
  constructor(private readonly updateRegion: UpdateRegionUseCase) {}
  @Patch(':id')
  @AdminOnly()
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegionRequestDto,
  ) {
    try {
      return RegionPresenter.toResponse(
        await this.updateRegion.execute(id, dto),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/regions')
export class DeleteRegionController {
  constructor(private readonly deleteRegion: DeleteRegionUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteRegion.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}

// --- Zones ---------------------------------------------------------------

@Controller('v1/api/admin/zones')
export class CreateZoneController {
  constructor(private readonly createZone: CreateZoneUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateZoneRequestDto) {
    try {
      return ZonePresenter.toResponse(await this.createZone.execute(dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/zones')
export class GetZoneController {
  constructor(private readonly getZone: GetZoneUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return ZonePresenter.toResponse(await this.getZone.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/zones')
export class UpdateZoneController {
  constructor(private readonly updateZone: UpdateZoneUseCase) {}
  @Patch(':id')
  @AdminOnly()
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateZoneRequestDto,
  ) {
    try {
      return ZonePresenter.toResponse(await this.updateZone.execute(id, dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/zones')
export class DeleteZoneController {
  constructor(private readonly deleteZone: DeleteZoneUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteZone.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}

// --- Stages ------------------------------------------------------------

@Controller('v1/api/admin/stages')
export class CreateStageController {
  constructor(private readonly createStage: CreateStageUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateStageRequestDto) {
    try {
      return StagePresenter.toResponse(await this.createStage.execute(dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/stages')
export class GetStageController {
  constructor(private readonly getStage: GetStageUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return StagePresenter.toResponse(await this.getStage.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/stages')
export class UpdateStageController {
  constructor(private readonly updateStage: UpdateStageUseCase) {}
  @Patch(':id')
  @AdminOnly()
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStageRequestDto,
  ) {
    try {
      return StagePresenter.toResponse(await this.updateStage.execute(id, dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/stages')
export class DeleteStageController {
  constructor(private readonly deleteStage: DeleteStageUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteStage.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}

// --- Quests --------------------------------------------------------------

@Controller('v1/api/admin/quests')
export class CreateQuestController {
  constructor(private readonly createQuest: CreateQuestUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateQuestRequestDto) {
    try {
      return QuestPresenter.toResponse(await this.createQuest.execute(dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/quests')
export class GetQuestController {
  constructor(private readonly getQuest: GetQuestUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return QuestPresenter.toResponse(await this.getQuest.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/quests')
export class UpdateQuestController {
  constructor(private readonly updateQuest: UpdateQuestUseCase) {}
  @Patch(':id')
  @AdminOnly()
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestRequestDto,
  ) {
    try {
      return QuestPresenter.toResponse(await this.updateQuest.execute(id, dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/quests')
export class DeleteQuestController {
  constructor(private readonly deleteQuest: DeleteQuestUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteQuest.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}

// --- Badge definitions ---------------------------------------------------

@Controller('v1/api/admin/badges')
export class CreateBadgeDefinitionController {
  constructor(private readonly createBadge: CreateBadgeDefinitionUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateBadgeDefinitionRequestDto) {
    return BadgeDefinitionPresenter.toResponse(
      await this.createBadge.execute(dto),
    );
  }
}

@Controller('v1/api/admin/badges')
export class GetBadgeDefinitionController {
  constructor(private readonly getBadge: GetBadgeDefinitionUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return BadgeDefinitionPresenter.toResponse(
        await this.getBadge.execute(id),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/badges')
export class UpdateBadgeDefinitionController {
  constructor(private readonly updateBadge: UpdateBadgeDefinitionUseCase) {}
  @Patch(':id')
  @AdminOnly()
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBadgeDefinitionRequestDto,
  ) {
    try {
      return BadgeDefinitionPresenter.toResponse(
        await this.updateBadge.execute(id, dto),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/badges')
export class DeleteBadgeDefinitionController {
  constructor(private readonly deleteBadge: DeleteBadgeDefinitionUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteBadge.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}

// --- Characters --------------------------------------------------------

@Controller('v1/api/admin/characters')
export class CreateCharacterController {
  constructor(private readonly createCharacter: CreateCharacterUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateCharacterRequestDto) {
    return CharacterPresenter.toResponse(
      await this.createCharacter.execute(dto),
    );
  }
}

@Controller('v1/api/admin/characters')
export class GetCharacterController {
  constructor(private readonly getCharacter: GetCharacterUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return CharacterPresenter.toResponse(await this.getCharacter.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/characters')
export class UpdateCharacterController {
  constructor(private readonly updateCharacter: UpdateCharacterUseCase) {}
  @Patch(':id')
  @AdminOnly()
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCharacterRequestDto,
  ) {
    try {
      return CharacterPresenter.toResponse(
        await this.updateCharacter.execute(id, dto),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}

@Controller('v1/api/admin/characters')
export class DeleteCharacterController {
  constructor(private readonly deleteCharacter: DeleteCharacterUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteCharacter.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
