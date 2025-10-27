/**
 * Metadata Loader for Tool Configuration
 *
 * This module provides utilities for loading and converting YAML-based tool metadata
 * into the format expected by fastmcp's addTool method.
 *
 * Usage:
 * - Create a YAML file in src/tools/metadata/ with your tool's metadata
 * - Use buildZodSchema() to convert YAML parameters to Zod schema
 * - Use loadToolMetadata() to load complete tool metadata
 *
 * Example:
 * ```typescript
 * import { loadToolMetadata } from './metadata-loader.js';
 *
 * const metadata = loadToolMetadata('scroll.yaml');
 * // metadata contains: name, description, parameters schema, annotations
 * ```
 */

import { load as yamlLoad } from 'js-yaml';
import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { z } from 'zod';
import * as path from 'path';

/**
 * Type definition for tool metadata in YAML
 */
export interface YAMLParameter {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
  description?: string;
  required?: boolean;
  default?: any;
  options?: string[]; // For enum types
  properties?: Record<string, YAMLParameter>; // For object types
  items?: YAMLParameter; // For array types
}

export interface YAMLToolMetadata {
  name: string;
  description: string;
  parameters: Record<string, YAMLParameter>;
  annotations: {
    readOnly: boolean;
    openWorld: boolean;
  };
  instructions?: string; // Optional AI instructions
  notes?: string; // Optional implementation notes
}

/**
 * Convert YAML parameter definition to Zod schema
 *
 * @param name - Parameter name
 * @param param - YAML parameter definition
 * @returns Zod schema
 */
function buildZodSchemaForParameter(
  name: string,
  param: YAMLParameter
): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  // Build base schema based on type
  switch (param.type) {
    case 'string':
      schema = z.string();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'enum':
      if (!param.options || param.options.length === 0) {
        throw new Error(`Enum parameter "${name}" must have options defined`);
      }
      schema = z.enum(param.options as [string, ...string[]]);
      break;
    case 'array':
      if (!param.items) {
        throw new Error(`Array parameter "${name}" must have items defined`);
      }
      const itemSchema = buildZodSchemaForParameter(`${name}Item`, param.items);
      schema = z.array(itemSchema);
      break;
    case 'object':
      if (!param.properties) {
        throw new Error(
          `Object parameter "${name}" must have properties defined`
        );
      }
      const objProps: Record<string, z.ZodTypeAny> = {};
      for (const [propName, propDef] of Object.entries(param.properties)) {
        objProps[propName] = buildZodSchemaForParameter(propName, propDef);
      }
      schema = z.object(objProps);
      break;
    default:
      throw new Error(`Unsupported parameter type: ${param.type}`);
  }

  // Add description
  if (param.description) {
    schema = schema.describe(param.description);
  }

  // Make optional if not required
  if (param.required === false || param.default !== undefined) {
    schema = schema.optional();
  }

  return schema;
}

/**
 * Convert YAML parameters object to Zod schema object
 *
 * @param params - YAML parameters definition
 * @returns Zod object schema
 */
export function buildZodSchema(
  params: Record<string, YAMLParameter>
): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [name, param] of Object.entries(params)) {
    let schema = buildZodSchemaForParameter(name, param);

    // Set default value if provided
    if (param.default !== undefined) {
      schema = schema.default(param.default);
    }

    shape[name] = schema;
  }

  return z.object(shape);
}

/**
 * Load tool metadata from a YAML file
 *
 * @param yamlFilename - Name of the YAML file in src/tools/metadata/
 * @returns Parsed tool metadata
 */
export async function loadToolMetadata(
  yamlFilename: string
): Promise<YAMLToolMetadata> {
  const yamlPath = path.join(
    process.cwd(),
    'src',
    'tools',
    'metadata',
    yamlFilename
  );

  try {
    // Check if file exists
    await access(yamlPath, constants.F_OK);
    // Read file content
    const fileContents = await readFile(yamlPath, 'utf8');
    const metadata = yamlLoad(fileContents) as YAMLToolMetadata;

    // Validate required fields
    if (!metadata.name) {
      throw new Error('Metadata must have a "name" field');
    }
    if (!metadata.description) {
      throw new Error('Metadata must have a "description" field');
    }
    if (!metadata.parameters) {
      throw new Error('Metadata must have a "parameters" field');
    }
    if (!metadata.annotations) {
      throw new Error('Metadata must have an "annotations" field');
    }

    return metadata;
  } catch (error) {
    throw new Error(`Failed to load metadata from ${yamlPath}: ${error}`);
  }
}

/**
 * Get the metadata filename for a given tool file
 *
 * Example: scroll.ts -> scroll.yaml
 */
export function getMetadataFilename(toolFilename: string): string {
  return toolFilename.replace('.ts', '.yaml');
}
