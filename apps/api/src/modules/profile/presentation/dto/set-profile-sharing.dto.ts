import { IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SetProfileSharingDto {
  @ApiProperty({ description: "true issues (or keeps) the share link; false revokes it." })
  @IsBoolean()
  enabled!: boolean;
}
