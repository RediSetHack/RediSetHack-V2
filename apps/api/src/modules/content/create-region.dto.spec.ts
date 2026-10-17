import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateRegionRequestDto } from './presentation/dto/create-region.dto.js';

describe('CreateRegionRequestDto', () => {
  it('rejects an empty story introduction', async () => {
    const dto = plainToInstance(CreateRegionRequestDto, {
      name: 'Novel',
      slug: 'novel',
      storyIntro: '',
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
