import { BadRequestException, Controller, Get, Query, ServiceUnavailableException, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { DatasetExportQuerySchema, DatasetExportSchema } from "@repo/contracts";

import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";
import { AdminGuard } from "../../../auth/presentation/guards/admin.guard.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { ExportDatasetUseCase, ResearchExportNotConfiguredError } from "../../application/export-dataset.use-case.js";

@ApiTags("Research")
@Controller("v1/api/admin/research")
@UseGuards(ClerkAuthGuard, AdminGuard)
@ApiBearerAuth()
@ApiForbiddenResponse({ description: "Only administrators may export research data." })
export class ResearchDatasetController {
  constructor(private readonly exportDataset: ExportDatasetUseCase) {}

  @Get("dataset")
  @ApiOperation({ summary: "Export a pseudonymous, split interaction dataset with a quality report." })
  @ApiZodResponse(DatasetExportSchema)
  @ApiBadRequestResponse({ description: "Invalid strategy, limit or seed." })
  @ApiServiceUnavailableResponse({ description: "The pseudonymization key is not configured." })
  async dataset(@Query() query: unknown) {
    const parsed = DatasetExportQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join("; "));
    try {
      return await this.exportDataset.execute(parsed.data);
    } catch (error) {
      if (error instanceof ResearchExportNotConfiguredError) throw new ServiceUnavailableException(error.message);
      throw error;
    }
  }
}
