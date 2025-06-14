# Jarvis Appium

An intelligent MCP (Model Context Protocol) server that provides AI assistants with powerful tools and resources for Appium mobile automation. Jarvis Appium enables seamless mobile app testing through natural language interactions, intelligent locator generation, and automated test creation.

## 🚀 Features

- **Cross-Platform Support**: Android (UiAutomator2) and iOS (XCUITest) automation
- **Intelligent Locator Generation**: AI-powered element identification with priority-based strategies
- **Interactive Session Management**: Create and manage mobile device sessions
- **Smart Element Interactions**: Click, text input, screenshot, and element finding capabilities
- **Automated Test Generation**: Generate Java/TestNG test code from natural language descriptions
- **Page Object Model Support**: Built-in templates following best practices
- **Flexible Configuration**: Environment-specific capabilities and settings

## 📋 Prerequisites

Before using Jarvis Appium, ensure you have the following installed:

### System Requirements

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Java Development Kit (JDK)** 8 or higher
- **Android SDK** (for Android testing)
- **Xcode** (for iOS testing on macOS)

### Mobile Testing Setup

#### Android Setup

1. Install Android Studio and Android SDK
2. Set `ANDROID_HOME` environment variable
3. Add Android SDK tools to your PATH
4. Enable USB debugging on your Android device
5. Install Appium UiAutomator2 driver dependencies

#### iOS Setup (macOS only)

1. Install Xcode from the App Store
2. Install Xcode Command Line Tools: `xcode-select --install`
3. Install iOS simulators through Xcode
4. For real device testing, configure provisioning profiles

## 🛠️ Installation

### As an MCP Server

Add Jarvis Appium to your MCP client configuration:

```json
{
  "mcpServers": {
    "jarvis-appium": {
      "disabled": false,
      "timeout": 100,
      "type": "stdio",
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "ANDROID_HOME": "/path/to/android/sdk",
        "CAPABILITIES_CONFIG": "/path/to/your/capabilities.json"
      }
    }
  }
}
```

## ⚙️ Configuration

### Capabilities Configuration

Create a `capabilities.json` file to define your device capabilities:

```json
{
  "android": {
    "appium:app": "/path/to/your/android/app.apk",
    "appium:deviceName": "Android Device",
    "appium:platformVersion": "11.0",
    "appium:automationName": "UiAutomator2",
    "appium:udid": "your-device-udid"
  },
  "ios": {
    "appium:app": "/path/to/your/ios/app.ipa",
    "appium:deviceName": "iPhone 15 Pro",
    "appium:platformVersion": "17.0",
    "appium:automationName": "XCUITest",
    "appium:udid": "your-device-udid"
  }
}
```

Set the `CAPABILITIES_CONFIG` environment variable to point to your configuration file.

## 🎯 Available Tools

### Session Management

#### `select_platform`

Choose between Android or iOS platform for testing.

#### `create_session`

Create a new mobile automation session with specified capabilities.

- **Parameters**:
  - `platform`: "android" or "ios"
  - `capabilities`: Optional custom W3C capabilities

### Element Interaction

#### `generate_locators`

Analyze the current screen and generate intelligent locators for all interactive elements.

- Returns prioritized locator strategies (ID, accessibility ID, XPath, etc.)
- Filters for clickable and focusable elements

#### `appium_find_element`

Find a specific element on the screen using various locator strategies.

- **Parameters**:
  - `strategy`: Locator strategy (id, xpath, accessibility id, etc.)
  - `selector`: Element selector string

#### `appium_click`

Click on an element using its UUID.

- **Parameters**:
  - `elementUUID`: Element identifier returned by find_element

#### `appium_set_value`

Enter text into an input field.

- **Parameters**:
  - `elementUUID`: Element identifier
  - `text`: Text to enter

#### `appium_get_text`

Retrieve text content from an element.

- **Parameters**:
  - `elementUUID`: Element identifier

#### `appium_screenshot`

Capture a screenshot of the current screen.

### Test Generation

#### `appium_generate_tests`

Generate automated test code from natural language test scenarios.

- **Parameters**:
  - `steps`: Array of test steps in natural language
- Generates Java/TestNG code following Page Object Model patterns

## 📚 Available Resources

### `generate://code-with-locators`

Java template resource for generating Page Object Model classes with cross-platform locator annotations.

## 🔧 Usage Examples

### Basic Test Automation Workflow

1. **Select Platform and Create Session**:

```
Use select_platform to choose "android"
Use create_session with platform "android"
```

2. **Generate Locators for Current Screen**:

```
Use generate_locators to analyze the current page
```

3. **Interact with Elements**:

```
Use appium_find_element to locate the login button
Use appium_click to tap the login button
Use appium_set_value to enter username
```

4. **Generate Test Code**:

```
Use appium_generate_tests with steps:
- "Open the app"
- "Enter username 'testuser'"
- "Enter password 'testpass'"
- "Click login button"
- "Verify dashboard is displayed"
```

### Example Test Scenarios

#### Gmail Automation

```
Steps:
1. Open Gmail app
2. Compose an email to user@example.com with subject "Test email from Jarvis Appium"
3. Add body as "Hello World!"
4. Send the email
```

#### Todo App Testing

```
Steps:
1. Open TODO app
2. Add a todo item with title "Complete Appium automation"
3. Set due date to June 25, 2025
4. Add to personal list
5. Mark as completed
```
