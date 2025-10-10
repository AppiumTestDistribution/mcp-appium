# Tests for Mobile Agent

This directory contains unit tests for the Mobile Agent project.

## Running Tests

To run all tests:

```bash
npm test
```

To run specific test files:

```bash
# Run tests for the locator generation functionality
npm run test:locators
```

## Test Files

### generate-all-locators.test.ts

This file contains tests for the `generateAllElementLocators` function, which is responsible for generating locators for all elements in a page source XML.

The tests cover:

1. Basic functionality with valid XML
2. Handling of invalid/empty XML
3. Various filtering options:
   - `includeTagNames` - Include only specific element types
   - `excludeTagNames` - Exclude specific element types
   - `minAttributeCount` - Filter elements by minimum attribute count
   - `fetchableOnly` - Include only interactable elements (platform-specific)
   - `clickableOnly` - Include only clickable elements

## Adding New Tests

When adding new tests:

1. Create a new test file in the `src/tests` directory with the `.test.ts` extension
2. Import the necessary functions and types from the source files
3. Use Jest's `describe`, `test`, and `expect` functions to structure your tests
4. Add a new script to `package.json` for running your specific test file

## Test Structure

Tests should follow this general structure:

```typescript
import { describe, test, expect } from '@jest/globals';
import { functionToTest } from '../path/to/function.js';

describe('functionToTest', () => {
  test('should do something specific', () => {
    // Arrange - set up test data
    const input = 'some input';
    
    // Act - call the function
    const result = functionToTest(input);
    
    // Assert - verify the result
    expect(result).toBe('expected output');
  });
});
```

## Mocking

For tests that require mocking dependencies, use Jest's mocking capabilities:

```typescript
import { jest } from '@jest/globals';

// Mock a module
jest.mock('../path/to/module.js');

// Create a mock function
const mockFunction = jest.fn();
mockFunction.mockReturnValue('mocked value');
```

Note that when working with ESM modules, you may need to use different mocking approaches than with CommonJS modules.
