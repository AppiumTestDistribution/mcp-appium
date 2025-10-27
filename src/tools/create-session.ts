/**
 * Tool to create a new mobile session (Android or iOS)
 */
import { z } from 'zod';
import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { AndroidUiautomator2Driver } from 'appium-uiautomator2-driver';
import { XCUITestDriver } from 'appium-xcuitest-driver';
import {
  setSession,
  hasActiveSession,
  safeDeleteSession,
} from './sessionStore.js';
import {
  getSelectedDevice,
  getSelectedDeviceType,
  getSelectedDeviceInfo,
  clearSelectedDevice,
} from './select-device.js';
import { IOSManager } from '../devicemanager/ios-manager.js';

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
      'Create a new mobile session with Android or iOS device (MUST use select_platform tool first to ask the user which platform they want - DO NOT assume or default to any platform)',
    parameters: z.object({
      platform: z
        .enum(['ios', 'android'])
        .describe(
          'REQUIRED: Must match the platform the user explicitly selected via the select_platform tool. DO NOT default to Android or iOS without asking the user first.'
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
          console.log(
            'Existing session detected, cleaning up before creating new session...'
          );
          await safeDeleteSession();
        }

        const { platform, capabilities: customCapabilities } = args;

        let defaultCapabilities: Capabilities;
        let driver: any;
        let finalCapabilities: Capabilities;

        // Load capabilities from config file
        let configCapabilities: CapabilitiesConfig = { android: {}, ios: {} };
        const configPath = process.env.CAPABILITIES_CONFIG;

        if (configPath) {
          try {
            // Check if file exists
            await access(configPath, constants.F_OK);
            // Read file content
            const configContent = await readFile(configPath, 'utf8');
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

          // Get selected device UDID if available
          const selectedDeviceUdid = getSelectedDevice();

          // Merge custom capabilities with defaults and config capabilities
          finalCapabilities = {
            ...defaultCapabilities,
            ...androidCaps,
            ...(selectedDeviceUdid && { 'appium:udid': selectedDeviceUdid }),
            ...customCapabilities,
          };

          // Filter out any empty string values from capabilities
          Object.keys(finalCapabilities).forEach(key => {
            if (finalCapabilities[key] === '') {
              delete finalCapabilities[key];
            }
          });

          // Clear selected device after use
          if (selectedDeviceUdid) {
            clearSelectedDevice();
          }

          driver = new AndroidUiautomator2Driver();
        } else if (platform === 'ios') {
          // Check for multiple devices and ensure one is selected
          const iosManager = IOSManager.getInstance();
          const deviceType = getSelectedDeviceType();

          // If we have a selected device type, check if selection is needed
          if (deviceType) {
            const devices = await iosManager.getDevicesByType(deviceType);

            if (devices.length > 1) {
              const selectedDevice = getSelectedDevice();
              if (!selectedDevice) {
                throw new Error(
                  `Multiple iOS ${deviceType === 'simulator' ? 'simulators' : 'devices'} found (${devices.length}). Please use the select_device tool to choose which device to use before creating a session.`
                );
              }
            }
          }

          defaultCapabilities = {
            platformName: 'iOS',
            'appium:automationName': 'XCUITest',
            'appium:deviceName': 'iPhone Simulator',
          };

          // Get platform-specific capabilities from config
          const iosCaps = configCapabilities.ios || {};

          // Get selected device UDID and info if available
          const selectedDeviceUdid = getSelectedDevice();
          const selectedDeviceInfo = getSelectedDeviceInfo();

          console.log('Selected device info:', selectedDeviceInfo);

          // Get iOS version from device platform info (already extracted in IOSManager)
          const platformVersion =
            selectedDeviceInfo?.platform &&
            selectedDeviceInfo.platform.trim() !== ''
              ? selectedDeviceInfo.platform
              : undefined;

          console.log('Platform version:', platformVersion);

          // Merge custom capabilities with defaults and config capabilities
          finalCapabilities = {
            ...defaultCapabilities,
            ...iosCaps,
            ...(selectedDeviceUdid && { 'appium:udid': selectedDeviceUdid }),
            ...(platformVersion && {
              'appium:platformVersion': platformVersion,
            }),
            // Add WDA optimization for simulators
            ...(deviceType === 'simulator' && {
              'appium:usePrebuiltWDA': true,
              'appium:wdaStartupRetries': 4,
              'appium:wdaStartupRetryInterval': 20000,
            }),
            ...customCapabilities,
          };

          // Filter out any empty string values from capabilities
          Object.keys(finalCapabilities).forEach(key => {
            if (finalCapabilities[key] === '') {
              delete finalCapabilities[key];
            }
          });

          // Clear selected device after use
          if (selectedDeviceUdid) {
            clearSelectedDevice();
          }

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
