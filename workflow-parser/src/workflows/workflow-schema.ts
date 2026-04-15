import type {FeatureFlags} from "@actions/expressions/features";
import {JSONObjectReader} from "../templates/json-object-reader.js";
import {TemplateSchema} from "../templates/schema/index.js";
import WorkflowSchema from "../workflow-v1.0.min.json";

export type WorkflowSchemaOptions = {
  featureFlags?: FeatureFlags;
};

type WorkflowSchemaJson = {
  definitions?: Record<string, unknown>;
};

const schemas = new Map<string, TemplateSchema>();

export function getWorkflowSchema(options?: WorkflowSchemaOptions): TemplateSchema {
  const cacheKey = options?.featureFlags?.isEnabled("allowConcurrencyQueue") ? "allowConcurrencyQueue" : "default";
  const cachedSchema = schemas.get(cacheKey);
  if (cachedSchema) {
    return cachedSchema;
  }

  const json = JSON.stringify(createWorkflowSchemaJson(options));
  const schema = TemplateSchema.load(new JSONObjectReader(undefined, json));
  schemas.set(cacheKey, schema);
  return schema;
}

function createWorkflowSchemaJson(options?: WorkflowSchemaOptions): WorkflowSchemaJson {
  const schema = JSON.parse(JSON.stringify(WorkflowSchema)) as WorkflowSchemaJson;

  if (options?.featureFlags?.isEnabled("allowConcurrencyQueue")) {
    return schema;
  }

  const definitions = schema.definitions;
  if (!definitions) {
    return schema;
  }

  const concurrencyDefinition = definitions["concurrency-mapping"] as
    | {
        mapping?: {
          properties?: Record<string, unknown>;
        };
      }
    | undefined;

  delete concurrencyDefinition?.mapping?.properties?.queue;
  delete definitions["concurrency-queue"];

  return schema;
}
