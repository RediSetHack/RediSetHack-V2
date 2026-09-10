import { Global, Module } from "@nestjs/common";
import { createDb } from "@repo/db";

export const DB = Symbol("DB");

export type { Database } from "@repo/db";

@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        return connectionString ? createDb(connectionString) : null;
      },
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}