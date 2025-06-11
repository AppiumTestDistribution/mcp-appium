# Mobile Agent

MCP server providing resources and tools for Appium mobile gestures.

## Development

### Code Quality

This project uses ESLint for linting and Prettier for code formatting.

#### Available Scripts

- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Run ESLint and automatically fix issues where possible
- `npm run format` - Format all code using Prettier
- `npm run format:check` - Check if code is properly formatted
- `npm run check` - Run both linting and format checking

#### Configuration

- **ESLint**: Configured in `eslint.config.js` with TypeScript support
- **Prettier**: Configured in `.prettierrc` with project-specific formatting rules
- **Prettier Ignore**: Files to exclude from formatting are listed in `.prettierignore`

#### Pre-commit Workflow

Before committing code, run:

```bash
npm run check
```

This will ensure your code passes both linting and formatting checks.

## Build and Run

- `npm run build` - Build the project
- `npm start` - Start the server
- `npm run dev` - Run in development mode
