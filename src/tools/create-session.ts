/**
 * Tool to create a new mobile session (Android or iOS)
 */
import { z } from 'zod';
import { AndroidUiautomator2Driver } from 'appium-uiautomator2-driver';
import { XCUITestDriver } from 'appium-xcuitest-driver';
import { setSession, getDriver, getSessionId } from './sessionStore.js';

// Define capabilities type
interface Capabilities {
  platformName: string;
  'appium:automationName': string;
  'appium:deviceName': string;
  [key: string]: any;
}

export default function createSession(server: any): void {
  server.addTool({
    name: 'create_session',
    description:
      'Create a new mobile session with Android or iOS device (use select_platform first to choose your platform)',
    parameters: z.object({
      platform: z
        .enum(['ios', 'android'])
        .describe(
          "REQUIRED: Specify the platform - 'android' for Android devices or 'ios' for iOS devices. Use select_platform tool first if you haven't chosen yet."
        ),
      capabilities: z
        .object({})
        .optional()
        .describe(
          'Optional custom capabilities for the session (W3C format). If not provided, default capabilities will be used based on the selected platform'
        ),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const { platform, capabilities: customCapabilities } = args;

        let defaultCapabilities: Capabilities;
        let driver: any;

        if (platform === 'android') {
          defaultCapabilities = {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
            'appium:deviceName': 'Android Device',
          };
          driver = new AndroidUiautomator2Driver();
        } else if (platform === 'ios') {
          defaultCapabilities = {
            platformName: 'iOS',
            'appium:automationName': 'XCUITest',
            'appium:deviceName': 'iPhone 16 Pro',
            'appium:platformVersion': '18.2',
            'appium:udid': 'E9F10A3E-58E6-4506-B273-B22AF836014E',
          };
          driver = new XCUITestDriver();
        } else {
          throw new Error(
            `Unsupported platform: ${platform}. Please choose 'android' or 'ios'.`
          );
        }

        // Merge custom capabilities with defaults
        const finalCapabilities = {
          ...defaultCapabilities,
          ...customCapabilities,
        };

        console.log(
          `Creating new ${platform.toUpperCase()} session with capabilities:`,
          JSON.stringify(finalCapabilities, null, 2)
        );

        // @ts-ignore
        const sessionId = await driver.createSession(null, {
          alwaysMatch: finalCapabilities,
          firstMatch: [{}],
        });

        setSession(driver, sessionId);

        console.log(
          `${platform.toUpperCase()} session created successfully with ID: ${sessionId}`
        );

        return {
          content: [
            {
              type: 'text',
              text: `${platform.toUpperCase()} session created successfully with ID: ${sessionId}\nPlatform: ${finalCapabilities.platformName}\nAutomation: ${finalCapabilities['appium:automationName']}\nDevice: ${finalCapabilities['appium:deviceName']}`,
            },
          ],
        };
      } catch (error: any) {
        console.error('Error creating session:', error);
        throw new Error(`Failed to create session: ${error.message}`);
      }
    },
  });
}
