/**
 * Tool to create a new mobile session on LambdaTest cloud platform
 */
import { z } from 'zod';
import { setSession } from './sessionStore.js';

// Define LambdaTest capabilities type
interface LambdaTestCapabilities {
  platformName: string;
  'appium:automationName': string;
  'appium:deviceName': string;
  'appium:platformVersion': string;
  'lt:options': {
    username: string;
    accessKey: string;
    build: string;
    name: string;
    devicelog: boolean;
    visual: boolean;
    video: boolean;
    autoAcceptAlerts?: boolean;
    autoGrantPermissions?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

// Simple WebDriver client for LambdaTest
class LambdaTestWebDriver {
  private baseUrl: string;
  private authHeader: string;
  private sessionId: string | null = null;

  constructor(username: string, accessKey: string) {
    this.baseUrl = 'https://mobile-hub.lambdatest.com/wd/hub';
    this.authHeader = `Basic ${Buffer.from(`${username}:${accessKey}`).toString('base64')}`;
  }

  async createSession(capabilities: LambdaTestCapabilities): Promise<string> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader,
      },
      body: JSON.stringify({
        capabilities: {
          alwaysMatch: capabilities,
          firstMatch: [{}],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create session: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();
    this.sessionId = result.value.sessionId;
    if (!this.sessionId) {
      throw new Error('Failed to get session ID from response');
    }
    return this.sessionId;
  }

  async deleteSession(): Promise<void> {
    if (!this.sessionId) return;

    await fetch(`${this.baseUrl}/session/${this.sessionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: this.authHeader,
      },
    });
    this.sessionId = null;
  }

  async getPageSource(): Promise<string> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}/source`,
      {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get page source: ${response.status}`);
    }

    const result = await response.json();
    return result.value;
  }

  async findElement(strategy: string, selector: string): Promise<string> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}/element`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify({
          using: strategy,
          value: selector,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to find element: ${response.status}`);
    }

    const result = await response.json();
    return (
      result.value.ELEMENT ||
      result.value['element-6066-11e4-a52e-4f735466cecf']
    );
  }

  async click(elementId: string): Promise<void> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}/element/${elementId}/click`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to click element: ${response.status}`);
    }
  }

  async sendKeys(elementId: string, text: string): Promise<void> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}/element/${elementId}/value`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify({
          text: text,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send keys: ${response.status}`);
    }
  }

  async getText(elementId: string): Promise<string> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}/element/${elementId}/text`,
      {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get text: ${response.status}`);
    }

    const result = await response.json();
    return result.value;
  }

  async takeScreenshot(): Promise<string> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}/screenshot`,
      {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to take screenshot: ${response.status}`);
    }

    const result = await response.json();
    return result.value;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  // Add compatibility methods for existing tools
  get caps() {
    return {
      automationName: 'UiAutomator2', // or XCUITest for iOS
    };
  }
}

export default function createCloudSession(server: any): void {
  server.addTool({
    name: 'create_lambdatest_session',
    description:
      'Create a new mobile session on LambdaTest cloud platform with real devices or simulators',
    parameters: z.object({
      platform: z
        .enum(['ios', 'android'])
        .describe(
          "Platform - 'android' for Android devices or 'ios' for iOS devices"
        ),
      deviceName: z
        .string()
        .describe(
          'Device name (e.g., "Galaxy S21", "iPhone 13 Pro", "Pixel 6")'
        ),
      platformVersion: z
        .string()
        .describe('Platform version (e.g., "11.0", "15.0", "12")'),
      app: z
        .string()
        .optional()
        .describe('App URL or app ID from LambdaTest app upload (lt://APP_ID)'),
      buildName: z
        .string()
        .optional()
        .describe(
          'Build name for organizing test runs (default: "Jarvis Appium Build")'
        ),
      testName: z
        .string()
        .optional()
        .describe('Test name for this session (default: "Jarvis Appium Test")'),
      capabilities: z
        .object({})
        .optional()
        .describe('Additional custom capabilities for the session'),
      ltOptions: z
        .object({
          devicelog: z
            .boolean()
            .optional()
            .describe('Enable device logs (default: true)'),
          visual: z
            .boolean()
            .optional()
            .describe('Enable visual testing (default: true)'),
          video: z
            .boolean()
            .optional()
            .describe('Enable video recording (default: true)'),
          autoAcceptAlerts: z
            .boolean()
            .optional()
            .describe('Auto accept alerts (default: true)'),
          autoGrantPermissions: z
            .boolean()
            .optional()
            .describe('Auto grant permissions (default: true)'),
          timezone: z
            .string()
            .optional()
            .describe('Device timezone (e.g., "UTC", "America/New_York")'),
          location: z
            .string()
            .optional()
            .describe('Device location (e.g., "US", "IN", "GB")'),
        })
        .optional()
        .describe('LambdaTest specific options'),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const {
          platform,
          deviceName,
          platformVersion,
          app,
          buildName = 'Jarvis Appium Build',
          testName = 'Jarvis Appium Test',
          capabilities: customCapabilities = {},
          ltOptions = {},
        } = args;

        // Get LambdaTest credentials from environment or use provided defaults
        const ltUsername = process.env.LT_USERNAME;
        const ltAccessKey = process.env.LT_ACCESS_KEY;

        let finalCapabilities: LambdaTestCapabilities;

        // LambdaTest hub URL
        const hubUrl = `https://${ltUsername}:${ltAccessKey}@mobile-hub.lambdatest.com/wd/hub`;

        if (platform === 'android') {
          finalCapabilities = {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
            'appium:deviceName': deviceName,
            'appium:platformVersion': platformVersion,
            'lt:options': {
              username: ltUsername,
              accessKey: ltAccessKey,
              build: buildName,
              name: testName,
              isRealMobile: true,
              devicelog: ltOptions.devicelog ?? true,
              visual: ltOptions.visual ?? true,
              video: ltOptions.video ?? true,
              autoAcceptAlerts: ltOptions.autoAcceptAlerts ?? true,
              autoGrantPermissions: ltOptions.autoGrantPermissions ?? true,
              ...ltOptions,
            },
            ...customCapabilities,
          };

          if (app) {
            finalCapabilities['lt:options'].app = app;
          }
        } else if (platform === 'ios') {
          finalCapabilities = {
            platformName: 'iOS',
            'appium:automationName': 'XCUITest',
            'appium:deviceName': deviceName,
            'appium:platformVersion': platformVersion,
            'lt:options': {
              username: ltUsername,
              accessKey: ltAccessKey,
              build: buildName,
              name: testName,
              isRealMobile: true,
              devicelog: ltOptions.devicelog ?? true,
              visual: ltOptions.visual ?? true,
              video: ltOptions.video ?? true,
              autoAcceptAlerts: ltOptions.autoAcceptAlerts ?? true,
              autoGrantPermissions: ltOptions.autoGrantPermissions ?? true,
              ...ltOptions,
            },
            ...customCapabilities,
          };

          if (app) {
            finalCapabilities['lt:options'].app = app;
          }
        } else {
          throw new Error(
            `Unsupported platform: ${platform}. Please choose 'android' or 'ios'.`
          );
        }

        console.log('Connecting to LambdaTest cloud platform...');
        console.log(
          `Creating new ${platform.toUpperCase()} session on LambdaTest cloud with capabilities:`,
          JSON.stringify(finalCapabilities, null, 2)
        );

        // Create WebDriver client and session
        const driver = new LambdaTestWebDriver(ltUsername!, ltAccessKey!);
        const sessionId = await driver.createSession(finalCapabilities);

        // Store the session
        setSession(driver, sessionId);

        console.log(
          `${platform.toUpperCase()} session created successfully on LambdaTest with ID: ${sessionId}`
        );

        const sessionUrl = `https://automation.lambdatest.com/build/${buildName}`;

        return {
          content: [
            {
              type: 'text',
              text: `${platform.toUpperCase()} session created successfully on LambdaTest Cloud!

Session Details:
- Session ID: ${sessionId}
- Platform: ${finalCapabilities.platformName}
- Device: ${finalCapabilities['appium:deviceName']}
- Platform Version: ${finalCapabilities['appium:platformVersion']}
- Automation: ${finalCapabilities['appium:automationName']}
- Build: ${buildName}
- Test Name: ${testName}

View your test execution at: ${sessionUrl}

LambdaTest Features Enabled:
- Device Logs: ${finalCapabilities['lt:options'].devicelog}
- Visual Testing: ${finalCapabilities['lt:options'].visual}
- Video Recording: ${finalCapabilities['lt:options'].video}
- Auto Accept Alerts: ${finalCapabilities['lt:options'].autoAcceptAlerts}
- Auto Grant Permissions: ${finalCapabilities['lt:options'].autoGrantPermissions}`,
            },
          ],
        };
      } catch (error: any) {
        console.error('Error creating LambdaTest session:', error);

        // Provide helpful error messages for common issues
        let errorMessage = `Failed to create LambdaTest session: ${error.message}`;

        if (error.message.includes('authentication')) {
          errorMessage +=
            '\n\nTip: Check your LambdaTest username and access key. You can find them at: https://accounts.lambdatest.com/security';
        } else if (error.message.includes('device')) {
          errorMessage +=
            '\n\nTip: Verify the device name and platform version are available on LambdaTest. Check: https://www.lambdatest.com/capabilities-generator/';
        } else if (error.message.includes('app')) {
          errorMessage +=
            '\n\nTip: Make sure the app URL is correct. Upload your app first using LambdaTest app upload API.';
        }

        throw new Error(errorMessage);
      }
    },
  });
}
