import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';
import { regions, stages, zones, type Database } from '@repo/db';

import { DrizzleStageRepository } from './drizzle-stage.repository.js';

describe('DrizzleStageRepository.findAllDiscoverable', () => {
  it('reads only catalog stages and excludes archived ancestors', async () => {
    const orderBy = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const joinRegions = vi.fn().mockReturnValue({ where });
    const joinZones = vi.fn().mockReturnValue({ innerJoin: joinRegions });
    const from = vi.fn().mockReturnValue({ innerJoin: joinZones });
    const select = vi.fn().mockReturnValue({ from });
    const repository = new DrizzleStageRepository({ select } as unknown as Database);

    expect(await repository.findAllDiscoverable()).toEqual([]);

    expect(from).toHaveBeenCalledWith(stages);
    expect(joinZones).toHaveBeenCalledWith(zones, expect.anything());
    expect(joinRegions).toHaveBeenCalledWith(regions, expect.anything());
    const visibility = new PgDialect().sqlToQuery(where.mock.calls[0][0]).sql;
    expect(visibility).toContain('"stages"."archived_at" is null');
    expect(visibility).toContain('"zones"."archived_at" is null');
    expect(visibility).toContain('"regions"."archived_at" is null');
  });
});
