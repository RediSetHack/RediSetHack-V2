import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error importing .mjs script without declaration
import { generateResource } from '../../scripts/generate-resource.mjs';

describe('generateResource', () => {
  it('rejects invalid kebab-case names', async () => {
    await expect(
      generateResource(process.cwd(), 'InvalidName'),
    ).rejects.toThrow(
      'Resource name must be singular kebab-case (for example: purchase-order)',
    );
  });

  it('rejects plural names', async () => {
    await expect(generateResource(process.cwd(), 'items')).rejects.toThrow(
      'Resource name must be singular',
    );
  });

  it('generates expected clean architecture files and features.module.ts in target directory', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'generate-resource-test-'));
    try {
      await generateResource(tmpDir, 'lesson-item');

      const entityContent = await readFile(
        join(
          tmpDir,
          'apps/api/src/modules/lesson-item/domain/entities/lesson-item.entity.ts',
        ),
        'utf-8',
      );
      expect(entityContent).toContain('export class LessonItem');

      const controllerContent = await readFile(
        join(
          tmpDir,
          'apps/api/src/modules/lesson-item/presentation/controllers/lesson-item.controller.ts',
        ),
        'utf-8',
      );
      expect(controllerContent).toContain('export class LessonItemController');

      const featuresModuleContent = await readFile(
        join(tmpDir, 'apps/api/src/modules/features.module.ts'),
        'utf-8',
      );
      expect(featuresModuleContent).toContain('LessonItemModule');
      expect(featuresModuleContent).toContain(
        '@Module({ imports: [LessonItemModule] })',
      );

      // Attempting to generate again should throw error
      await expect(generateResource(tmpDir, 'lesson-item')).rejects.toThrow(
        'Resource already exists: apps/api/src/modules/lesson-item',
      );
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
