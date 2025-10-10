# Jarvis Appium - AI-Powered Mobile Test Automation MCP Server

## Overview
Jarvis Appium is an intelligent Model Context Protocol (MCP) server that provides AI assistants with powerful tools for Appium mobile automation. It enables seamless mobile app testing through natural language interactions, intelligent locator generation, and automated test creation.

## Recent Changes (Oct 10, 2025)

### ✨ NEW: Test Healing & Auto-Recovery System
Added comprehensive AI-powered test healing capabilities that automatically fix failing tests:

**Key Features:**
- **Smart Fallback Strategies**: Automatically tries alternative locators (ID → accessibility ID → XPath → UiAutomator)
- **AI-Powered Recovery**: Uses Google Gemini Flash to analyze screenshots and suggest new locators
- **Configurable Modes**: 
  - Conservative (basic retries)
  - Moderate (retries + AI)
  - Aggressive (retries + AI + visual matching)
- **Comprehensive Logging**: Winston-based logging with healing analytics and reporting
- **Exponential Backoff**: Smart retry timing to avoid overwhelming the system

**New Tools Added:**
1. `configure_healing` - Set healing mode
2. `appium_find_element_with_healing` - Find elements with automatic recovery
3. `get_healing_report` - View healing statistics and history

**Technical Implementation:**
- `/src/healing/config.ts` - Healing configuration system
- `/src/healing/logger.ts` - Winston-based logging and analytics
- `/src/healing/strategies.ts` - Fallback locator generation
- `/src/healing/ai-healer.ts` - Gemini Flash integration for AI suggestions
- `/src/healing/element-healer.ts` - Main healing orchestration

**Dependencies Added:**
- `@google/genai` - Gemini AI integration
- `sharp` - Image processing
- `pixelmatch` - Visual comparison
- `winston` - Structured logging
- `pngjs` - PNG image handling

## Project Architecture

### Core Components
- **MCP Server** (`src/server.ts`) - FastMCP-based server
- **Tools** (`src/tools/`) - All available MCP tools
- **Healing System** (`src/healing/`) - Test healing infrastructure
- **Session Management** (`src/tools/sessionStore.ts`) - Driver session handling
- **Resources** (`src/resources/`) - Template resources for code generation

### Integrations
- **Gemini AI** (via blueprint:javascript_gemini) - AI-powered healing and analysis
- **LambdaTest** - Cloud testing platform integration
- **Appium Drivers** - UiAutomator2 (Android) and XCUITest (iOS)

## Environment Setup

### Required Environment Variables
- `GEMINI_API_KEY` - For AI-powered test healing (configured)
- `CAPABILITIES_CONFIG` - Path to capabilities.json file
- `ANDROID_HOME` - Android SDK path (for Android testing)

### Optional Environment Variables
- `LT_USERNAME` - LambdaTest username
- `LT_ACCESS_KEY` - LambdaTest access key

## Development Workflow

### Building
```bash
npm run build
```

### Testing
```bash
npm test
npm run test:locators  # Test locator generation
```

### Running Locally
```bash
npm run dev  # Development mode with fastmcp
npm start    # Production mode
```

### Code Quality
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
npm run check       # Lint + format check
```

## Key Features

1. **Cross-Platform Support** - Android and iOS automation
2. **Cloud Integration** - LambdaTest native support
3. **Intelligent Locators** - AI-powered element identification
4. **Test Healing** - Automatic recovery from locator failures
5. **Test Generation** - Java/TestNG code generation
6. **Session Management** - Local and cloud device management
7. **Page Object Model** - Built-in POM templates

## User Preferences
No specific user preferences recorded yet.

## Future Enhancements
- Multi-cloud support (BrowserStack, Sauce Labs)
- Enhanced visual regression testing
- Self-learning locator optimization
- Parallel test execution management
- Performance profiling integration
