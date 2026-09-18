import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import type { OpenAPIObject, OperationObject } from '@nestjs/swagger';
import { AppModule } from '../src/app.module.js';
import { setupSwagger } from '../src/swagger.js';

// Every route Swagger should be documenting, discovered the same way Nest's
// own router does: by walking registered controllers and reading the route
// metadata Nest's decorators attach, rather than a hand-maintained list. A
// new route picked up here without matching document coverage is exactly
// the regression this suite exists to catch (see #53, story 17).
interface DiscoveredRoute {
  path: string;
  method: string;
  hasGuards: boolean;
  controllerName: string;
}

function getOperation(
  document: OpenAPIObject,
  route: DiscoveredRoute,
): OperationObject | undefined {
  const pathItem = document.paths[route.path] as
    | Record<string, OperationObject>
    | undefined;
  return pathItem?.[route.method];
}

type JsonSchema = {
  $ref?: string;
  type?: string;
  properties?: object;
  items?: JsonSchema;
};

// DTO schemas are registered once under `components.schemas` and referenced
// from every operation via `$ref`, rather than inlined per route.
function resolveSchema(
  document: OpenAPIObject,
  schema: JsonSchema | undefined,
): JsonSchema | undefined {
  if (!schema) return undefined;
  if (!schema.$ref) return schema;
  const name = schema.$ref.replace('#/components/schemas/', '');
  return document.components?.schemas?.[name] as JsonSchema | undefined;
}

// A list response (`z.array(...)`) resolves to `{ type: 'array', items }`
// rather than `properties`; unwrap one level so both shapes can be checked
// for "did this actually describe fields" the same way.
function resolveFields(
  document: OpenAPIObject,
  schema: JsonSchema | undefined,
): object | undefined {
  const resolved = resolveSchema(document, schema);
  if (!resolved) return undefined;
  if (resolved.type === 'array') {
    return resolveSchema(document, resolved.items)?.properties;
  }
  return resolved.properties;
}

const METHOD_NAMES: Record<number, string> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.DELETE]: 'delete',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.OPTIONS]: 'options',
  [RequestMethod.HEAD]: 'head',
};

function joinPath(controllerPath: string, methodPath: string): string {
  const segments = `${controllerPath}/${methodPath}`
    .split('/')
    .filter((segment) => segment.length > 0);
  return `/${segments.join('/')}`.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function discoverRoutes(app: INestApplication): DiscoveredRoute[] {
  const modulesContainer = app.get(ModulesContainer);
  const routes: DiscoveredRoute[] = [];

  for (const module of modulesContainer.values()) {
    for (const wrapper of module.controllers.values()) {
      const { metatype, instance } = wrapper;
      if (!metatype || !instance) continue;

      const controllerPath: string = Reflect.getMetadata(
        PATH_METADATA,
        metatype,
      );
      const controllerGuards =
        Reflect.getMetadata(GUARDS_METADATA, metatype) ?? [];
      const prototype = Object.getPrototypeOf(instance);

      for (const key of Object.getOwnPropertyNames(prototype)) {
        if (key === 'constructor') continue;
        const handler = prototype[key];
        const methodPath: string | undefined = Reflect.getMetadata(
          PATH_METADATA,
          handler,
        );
        if (methodPath === undefined) continue;

        const httpMethod: number = Reflect.getMetadata(
          METHOD_METADATA,
          handler,
        );
        const methodGuards =
          Reflect.getMetadata(GUARDS_METADATA, handler) ?? [];

        routes.push({
          path: joinPath(controllerPath, methodPath),
          method: METHOD_NAMES[httpMethod],
          hasGuards: controllerGuards.length + methodGuards.length > 0,
          controllerName: metatype.name,
        });
      }
    }
  }
  return routes;
}

describe('OpenAPI document coverage', () => {
  let app: INestApplication;
  let document: OpenAPIObject;
  let routes: DiscoveredRoute[];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    document = setupSwagger(app);
    await app.init();
    routes = discoverRoutes(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('discovered at least one route per registered controller', () => {
    // A sanity check on the discovery mechanism itself: if this is 0, the
    // reflection above is broken, and every other assertion below is
    // vacuously true.
    expect(routes.length).toBeGreaterThan(40);
  });

  it('documents every registered route', () => {
    const undocumented = routes.filter(
      (route) => getOperation(document, route) === undefined,
    );
    expect(undocumented).toEqual([]);
  });

  it('groups every route under an explicit tag, not the controller-name default', () => {
    // With no `@ApiTags`, `@nestjs/swagger` falls back to the controller's
    // class name minus "Controller" as a singleton tag (e.g.
    // "ListRegionsController" -> "ListRegions") — technically non-empty, but
    // exactly the ungrouped, one-tag-per-route state #53 exists to fix. A
    // route is only counted as tagged when it carries a tag other than that
    // default.
    const untagged = routes.filter((route) => {
      const operation = getOperation(document, route);
      const tags = operation?.tags ?? [];
      const defaultTag = route.controllerName.replace(/Controller$/, '');
      return tags.every((tag) => tag === defaultTag);
    });
    expect(untagged).toEqual([]);
  });

  it('gives every route an operation summary', () => {
    const unsummarized = routes.filter((route) => {
      const operation = getOperation(document, route);
      return !operation?.summary;
    });
    expect(unsummarized).toEqual([]);
  });

  it('declares a security requirement for every guarded route', () => {
    const unsecured = routes.filter((route) => {
      if (!route.hasGuards) return false;
      const operation = getOperation(document, route);
      return !operation?.security || operation.security.length === 0;
    });
    expect(unsecured).toEqual([]);
  });

  it('resolves every documented request body to a schema with properties', () => {
    const emptyBodies = routes.filter((route) => {
      const operation = getOperation(document, route);
      const rawSchema = (
        operation?.requestBody as
          | { content?: Record<string, { schema?: JsonSchema }> }
          | undefined
      )?.content?.['application/json']?.schema;
      if (!rawSchema) return false;
      const fields = resolveFields(document, rawSchema);
      return !fields || Object.keys(fields).length === 0;
    });
    expect(emptyBodies).toEqual([]);
  });

  it('resolves every documented success response to a schema with fields', () => {
    // Not every route documents a response body (§ "grown per feature" —
    // see admin-crud.shared.ts and #53's Sequencing section), so this only
    // holds routes that DO claim one to the standard of actually having it,
    // rather than asserting every route must have one.
    const emptySchemas = routes.filter((route) => {
      const operation = getOperation(document, route);
      const responses = operation?.responses as
        | Record<string, { content?: Record<string, { schema?: JsonSchema }> }>
        | undefined;
      const successResponse = Object.entries(responses ?? {}).find(
        ([status]) => status.startsWith('2'),
      )?.[1];
      const rawSchema = successResponse?.content?.['application/json']?.schema;
      if (!rawSchema) return false;
      const fields = resolveFields(document, rawSchema);
      return !fields || Object.keys(fields).length === 0;
    });
    expect(emptySchemas).toEqual([]);
  });
});
