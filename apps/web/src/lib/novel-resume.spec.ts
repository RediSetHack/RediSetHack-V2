import { describe, expect, it } from 'vitest';
import { findNovelResume } from './novel-resume.js';

describe('findNovelResume', () => {
  it('uses catalog order and resumes at the first available Stage', () => {
    const first = { id: 1, name: 'Chapter 1' };
    const second = { id: 2, name: 'Chapter 2' };
    const result = findNovelResume([
      {
        zone: first,
        stages: [
          { id: 1, status: 'completed' },
          { id: 2, status: 'available' },
        ],
      },
      {
        zone: second,
        stages: [{ id: 3, status: 'available' }],
      },
    ]);
    expect(result).toMatchObject({ zone: first, stage: { id: 2 } });
  });

  it('moves to the next chapter after earlier chapters are complete', () => {
    const first = { id: 1 };
    const second = { id: 2 };
    expect(
      findNovelResume([
        { zone: first, stages: [{ id: 1, status: 'completed' }] },
        { zone: second, stages: [{ id: 2, status: 'available' }] },
      ]),
    ).toMatchObject({ zone: second, stage: { id: 2 } });
  });
});
