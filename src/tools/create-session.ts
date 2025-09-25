/**
 * Tool to create a new mobile session (Android or iOS)
 */
import { z } from 'zod';
import fs from 'fs';
import { AndroidUiautomator2Driver } from 'appium-uiautomator2-driver';
import { XCUITestDriver } from 'appium-xcuitest-driver';
import { setSession, hasActiveSession, safeDeleteSession } from './sessionStore.js';

// Define capabilities type
interface Capabilities {
  platformName: string;
  'appium:automationName': string;
  'appium:deviceName'?: string;
  [key: string]: any;
}

// Define capabilities config type
interface CapabilitiesConfig {
  android: Record<string, any>;
  ios: Record<string, any>;
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
        .describe('Optional custom capabilities for the session (W3C format).'),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        // Check if there's an existing session and clean it up first
        if (hasActiveSession()) {
          console.log('Existing session detected, cleaning up before creating new session...');
          await safeDeleteSession();
        }

        const { platform, capabilities: customCapabilities } = args;

        let defaultCapabilities: Capabilities;
        let driver: any;
        let finalCapabilities: Capabilities;

        // Load capabilities from config file
        let configCapabilities: CapabilitiesConfig = { android: {}, ios: {} };
        const configPath = process.env.CAPABILITIES_CONFIG;

        if (configPath && fs.existsSync(configPath)) {
          try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            configCapabilities = JSON.parse(configContent);
          } catch (error) {
            console.warn(`Failed to parse capabilities config: ${error}`);
          }
        }

        if (platform === 'android') {
          defaultCapabilities = {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
            'appium:deviceName': 'Android Device',
          };

          // Get platform-specific capabilities from config
          const androidCaps = configCapabilities.android || {};

          // Merge custom capabilities with defaults and config capabilities
          finalCapabilities = {
            ...defaultCapabilities,
            ...androidCaps,
            ...customCapabilities,
          };

          driver = new AndroidUiautomator2Driver();
        } else if (platform === 'ios') {
          defaultCapabilities = {
            platformName: 'iOS',
            'appium:automationName': 'XCUITest',
            'appium:deviceName': 'iPhone Simulator',
          };

          // Get platform-specific capabilities from config
          const iosCaps = configCapabilities.ios || {};

          // Merge custom capabilities with defaults and config capabilities
          finalCapabilities = {
            ...defaultCapabilities,
            ...iosCaps,
            ...customCapabilities,
          };

          driver = new XCUITestDriver();
        } else {
          throw new Error(
            `Unsupported platform: ${platform}. Please choose 'android' or 'ios'.`
          );
        }

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
