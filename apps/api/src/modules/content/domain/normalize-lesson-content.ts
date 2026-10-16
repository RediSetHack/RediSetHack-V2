export function normalizeLessonContent(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((block) => {
    if (!block || typeof block !== 'object') return block;
    const lessonBlock = block as Record<string, unknown>;
    if (lessonBlock.type === 'code' && typeof lessonBlock.code === 'string') {
      const { code, ...rest } = lessonBlock;
      return {
        ...rest,
        content:
          typeof lessonBlock.content === 'string' ? lessonBlock.content : code,
      };
    }
    if (lessonBlock.type === 'image' && typeof lessonBlock.alt !== 'string') {
      return {
        ...lessonBlock,
        alt: typeof lessonBlock.caption === 'string' ? lessonBlock.caption : '',
      };
    }
    return lessonBlock;
  });
}
