# Contributing to MCP Appium

Welcome! This guide will help you extend MCP Appium by adding new tools and resources.

## Table of Contents

- [Adding New Tools](#adding-new-tools)
- [Adding New Resources](#adding-new-resources)
- [Tool Metadata with YAML](#tool-metadata-with-yaml)
- [Code Style Guidelines](#code-style-guidelines)

---

## Adding New Tools

Tools are the core capabilities of MCP Appium. They define actions that can be performed on mobile devices.

### Quick Start: Simple Tool

Here's a minimal example of adding a new tool:

```typescript
// src/tools/my-new-tool.ts
import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver } from './sessionStore.js';

export default function myNewTool(server: FastMCP): void {
  server.addTool({
    name: 'appium_my_new_tool',
    description: 'Description of what this tool does',
    parameters: z.object({
      param1: z.string().describe('Description of param1'),
      param2: z.number().optional().describe('Description of param2'),
    }),
    annotations: {
      readOnlyHint: false, // Set to true if tool only reads data
      openWorldHint: false, // Set to true if tool requires real-world knowledge
    },
    execute: async (args: any, context: any): Promise<any> => {
      const driver = getDriver();
      if (!driver) {
        throw new Error(
          'No active driver session. Please create a session first.'
        );
      }

      // Your tool logic here
      const result = await driver.someMethod(args.param1);

      return {
        content: [
          {
            type: 'text',
            text: `Success message: ${result}`,
          },
        ],
      };
    },
  });
}
```

### Registering the Tool

Add your tool to `src/tools/index.ts`:

```typescript
import myNewTool from './my-new-tool.js';

export default function registerTools(server: FastMCP): void {
  // ... existing code ...

  myNewTool(server); // Add this line

  // ... rest of the tools ...
}
```

### Tool Parameters

Use Zod schemas to define parameters:

```typescript
import { z } from 'zod';

parameters: z.object({
  // Required string parameter
  requiredString: z.string().describe('A required string parameter'),

  // Optional number parameter
  optionalNumber: z.number().optional().describe('An optional number'),

  // Enum parameter
  platform: z.enum(['ios', 'android']).describe('Target platform'),

  // Object parameter
  config: z
    .object({
      key: z.string(),
      value: z.string(),
    })
    .optional()
    .describe('Configuration object'),

  // Array parameter
  items: z.array(z.string()).describe('List of items'),
});
```

### Tool Annotations

Annotations help the AI understand when to use your tool:

- `readOnlyHint: true` - Use when the tool only retrieves/reads data without modifying state
- `readOnlyHint: false` - Use when the tool performs actions or modifications
- `openWorldHint: true` - Use when the tool requires knowledge beyond the codebase
- `openWorldHint: false` - Use for codebase-specific operations

### Common Patterns

#### 1. Session Management Tools

```typescript
import {
  getDriver,
  hasActiveSession,
  safeDeleteSession,
} from './sessionStore.js';

// Check for active session
if (!hasActiveSession()) {
  throw new Error('No active session. Please create a session first.');
}

const driver = getDriver();
// Use driver...
```

#### 2. Element Interaction Tools

```typescript
import { checkIsValidElementId } from '../../utils.js';
import { elementUUIDScheme } from '../../schema.js';

// In parameters:
parameters: z.object({
  elementUUID: elementUUIDScheme,
});

// In execute:
checkIsValidElementId(args.elementUUID);
await driver.click(args.elementUUID);
```

#### 3. Platform-Specific Tools

```typescript
import { getPlatformName } from './sessionStore.js';

const platform = getPlatformName(driver);
if (platform === 'Android') {
  // Android-specific implementation
} else if (platform === 'iOS') {
  // iOS-specific implementation
}
```

---

## Adding New Resources

Resources provide contextual information to help the AI assist users better.

### Creating a Resource

```typescript
// src/resources/my-resource.ts
export default function myResource(server: any): void {
  server.addResource({
    uri: 'my://resource-uri',
    name: 'My Resource Name',
    description: 'Description of what this resource provides',
    mimeType: 'text/plain', // or 'application/json', 'text/markdown', etc.
    async load() {
      // Return the resource content
      return {
        text: 'Resource content here',
        // or
        // data: someJSONData,
      };
    },
  });
}
```

### Registering a Resource

Add your resource to `src/resources/index.ts`:

```typescript
import myResource from './my-resource.js';

export default function registerResources(server: any) {
  myResource(server); // Add this line
  console.log('All resources registered');
}
```

### Resource Types

#### Text Resource

```typescript
{
  uri: 'doc://example',
  name: 'Example Resource',
  mimeType: 'text/plain',
  async load() {
    return { text: 'Simple text content' };
  }
}
```

#### JSON Resource

```typescript
{
  uri: 'data://example',
  name: 'Example Data',
  mimeType: 'application/json',
  async load() {
    return { data: { key: 'value' } };
  }
}
```

#### Markdown Resource

```typescript
{
  uri: 'doc://guide',
  name: 'Guide',
  mimeType: 'text/markdown',
  async load() {
    return { text: '# Markdown Content' };
  }
}
```

---

## Tool Metadata with YAML

For better maintainability, tool metadata can be defined in YAML files.

### YAML File Structure

Create a YAML file for your tool metadata:

```yaml
# src/tools/metadata/my-tool.yaml
name: appium_my_tool
description: |
  This is a detailed description of what the tool does.
  It can span multiple lines.

parameters:
  param1:
    type: string
    description: Description of the first parameter
    required: true
  param2:
    type: number
    description: Description of the second parameter
    required: false

annotations:
  readOnly: false
  openWorld: false

# Instructions for prompt-based tools (optional)
instructions: |
  ## Instructions for AI
  - Point 1
  - Point 2
```

### Using YAML Metadata

```typescript
// src/tools/my-tool.ts
import { loadToolMetadata } from './metadata-loader.js';
import yaml from 'js-yaml';
import fs from 'fs';
import { z } from 'zod';

export default function myTool(server: FastMCP): void {
  // Load YAML metadata
  const yamlPath = './src/tools/metadata/my-tool.yaml';
  const metadata = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

  // Convert YAML schema to Zod schema
  const parameters = buildZodSchema(metadata.parameters);

  server.addTool({
    name: metadata.name,
    description: metadata.description,
    parameters,
    annotations: {
      readOnlyHint: metadata.annotations.readOnly,
      openWorldHint: metadata.annotations.openWorld,
    },
    execute: async (args: any, context: any): Promise<any> => {
      // Tool implementation
      // You can access metadata.instructions if needed
    },
  });
}
```

### Benefits of YAML

1. **Maintainability**: Metadata separated from implementation
2. **Clarity**: Easier to read and understand tool definitions
3. **Version Control**: Track metadata changes independently
4. **Internationalization**: Easier to translate descriptions
5. **Documentation**: Auto-generate docs from YAML

### When to Use YAML

**Use YAML when:**

- Tool has complex instructions or descriptions
- Multiple tools share similar metadata
- You want to version metadata separately
- You need to generate documentation automatically

**Use inline metadata when:**

- Tool is simple and straightforward
- Metadata is tightly coupled with implementation
- You prefer keeping everything in one place

---

## Code Style Guidelines

### 1. File Naming

- Tools: `kebab-case.ts` (e.g., `boot-simulator.ts`)
- Resources: `kebab-case.ts` (e.g., `java-template.ts`)
- YAML files: `tool-name.yaml`

### 2. Function Exports

Always export as default function:

```typescript
export default function myTool(server: FastMCP): void {
  // implementation
}
```

### 3. Error Handling

Always provide helpful error messages:

```typescript
if (!driver) {
  throw new Error('No active driver session. Please create a session first.');
}
```

### 4. Return Values

Always return content in the expected format:

```typescript
return {
  content: [
    {
      type: 'text',
      text: 'Success message or data',
    },
  ],
};
```

### 5. Async/Await

Always use async/await for async operations:

```typescript
// Good
const result = await driver.someMethod();

// Bad
driver.someMethod().then(result => ...)
```

### 6. Type Safety

Use proper TypeScript types:

```typescript
execute: async (args: any, context: any): Promise<any> => {
  // Type your variables
  const driver = getDriver();
  if (!driver) {
    throw new Error('No driver');
  }
  // ...
};
```

---

## Examples

See these existing tools for reference:

- **Simple tool**: `src/tools/scroll.ts` - Basic scrolling functionality
- **Complex tool**: `src/tools/create-session.ts` - Session management with multiple capabilities
- **Interaction tool**: `src/tools/interactions/click.ts` - Element interaction
- **Prompt-based tool**: `src/tools/generate-tests.ts` - AI instructions

---

## Testing

After adding a new tool:

1. Build the project: `npm run build`
2. Run linter: `npm run lint`
3. Test the tool with an MCP client
4. Verify the tool appears in the tools list

---

## Need Help?

- Check existing tools in `src/tools/`
- See examples in `examples/`
- Open an issue for questions

Happy contributing! 🎉
