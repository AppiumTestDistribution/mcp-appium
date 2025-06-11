# Mobile Agent

MCP server providing resources and tools for Appium mobile gestures.

## Installation

```
    "mcp-locators": {
      "disabled": false,
      "timeout": 100,
      "type": "stdio",
      "command": "node",
      "args": [
        "./dist/index.js"
      ],
      "env": {
        "ANDROID_HOME": "",
        "CAPABILITIES_CONFIG": "/Users/xx/Documents/git/n8n/caps.json"
      }
    },

caps.json // additional appium capabilites
{
  "android": {
    "appium:app": "/app/path"
  },
  "ios": {
    "appium:deviceName": "iPhone 16 Pro",
    "appium:platformVersion": "18.2",
    "appium:udid": ""
  }
}
```

## Development

### Code Quality

This project uses ESLint for linting and Prettier for code formatting.

#### Available Scripts

- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Run ESLint and automatically fix issues where possible
- `npm run format` - Format all code using Prettier
- `npm run format:check` - Check if code is properly formatted
- `npm run check` - Run both linting and format checking
- `npm test` - Run all tests
- `npm run test:locators` - Run tests for locator generation functionality

#### Configuration

- **ESLint**: Configured in `eslint.config.js` with TypeScript support
- **Prettier**: Configured in `.prettierrc` with project-specific formatting rules
- **Prettier Ignore**: Files to exclude from formatting are listed in `.prettierignore`

#### Pre-commit Workflow

Before committing code, run:

```bash
npm run check
npm test
```

This will ensure your code passes linting, formatting checks, and all tests.

### Testing

This project uses Jest for unit testing. Tests are located in the `src/tests` directory.

#### Running Tests

- `npm test` - Run all tests
- `npm run test:locators` - Run tests for locator generation functionality

For more details about the testing approach and how to add new tests, see [src/tests/README.md](src/tests/README.md).

## Build and Run

- `npm run build` - Build the project
- `npm start` - Start the server
- `npm run dev` - Run in development mode
