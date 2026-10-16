import { applyDecorators } from '@nestjs/common';
import {
  ApiResponse,
  type ApiResponseOptions,
  type SchemaObject,
} from '@nestjs/swagger';
import { toJSONSchema, type ZodType } from 'zod';

type ApiZodResponseOptions = Omit<ApiResponseOptions, 'schema' | 'type'>;

/**
 * Documents a route's response from the same `@repo/contracts` Zod schema
 * the web app consumes, so the two cannot describe different shapes.
 */
export function ApiZodResponse(
  schema: ZodType,
  options: ApiZodResponseOptions = {},
) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      ...options,
      schema: toJSONSchema(schema, {
        target: 'openapi-3.0',
        unrepresentable: 'any',
      }) as SchemaObject,
    }),
  );
}
