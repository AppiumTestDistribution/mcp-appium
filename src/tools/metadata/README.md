# Tool Metadata

This directory contains YAML metadata files for tools.

## Purpose

YAML metadata files allow you to separate tool descriptions, parameters, and annotations from implementation code. This provides better maintainability and enables automatic documentation generation.

## Usage

### Adding a New Tool with YAML Metadata

1. Create a YAML file in this directory (e.g., `my-tool.yaml`)
2. Define the metadata following the schema below
3. Use `loadToolMetadata()` in your TypeScript file

Example:

```typescript
import { loadToolMetadata, buildZodSchema } from '../metadata-loader.js';

const metadata = loadToolMetadata('my-tool.yaml');
const parameters = buildZodSchema(metadata.parameters);

server.addTool({
  name: metadata.name,
  description: metadata.description,
  parameters,
  annotations: {
    readOnlyHint: metadata.annotations.readOnly,
    openWorldHint: metadata.annotations.openWorld,
  },
  execute: async (args, context) => {
    // Implementation
  },
});
```

## YAML Schema

### Required Fields

```yaml
name: string # Tool name (must start with appium_)
description: string # What the tool does
parameters: object # Parameter definitions (see below)
annotations: # Tool annotations
  readOnly: boolean
  openWorld: boolean
```

### Optional Fields

```yaml
instructions: string # AI instructions for prompt-based tools
notes: string # Implementation notes
```

### Parameter Types

#### String

```yaml
paramName:
  type: string
  description: 'Description'
  required: true|false
  default: 'default value'
```

#### Number

```yaml
paramName:
  type: number
  description: 'Description'
  required: true|false
  default: 42
```

#### Boolean

```yaml
paramName:
  type: boolean
  description: 'Description'
  required: true|false
  default: true
```

#### Enum

```yaml
paramName:
  type: enum
  options: ['option1', 'option2', 'option3']
  description: 'Description'
  required: true|false
  default: 'option1'
```

#### Object

```yaml
paramName:
  type: object
  description: 'Description'
  properties:
    nestedParam:
      type: string
      description: 'Nested parameter'
```

#### Array

```yaml
paramName:
  type: array
  description: 'Description'
  items:
    type: string
```

## Examples

See `scroll.yaml` for a complete example.

## Benefits

- **Separate concerns**: Metadata vs. implementation
- **Documentation**: Auto-generate docs from YAML
- **Translation**: Easy to create multilingual versions
- **Version tracking**: See metadata changes over time
- **Type safety**: Converted to Zod schemas automatically

## When to Use YAML vs. Inline

### Use YAML when:

- Tool has complex descriptions
- You want to auto-generate documentation
- Multiple tools share similar structure
- You need to translate tool descriptions

### Use inline metadata when:

- Tool is simple
- Metadata is tightly coupled with code
- You prefer everything in one place
