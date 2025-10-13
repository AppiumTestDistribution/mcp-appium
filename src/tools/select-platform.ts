/**
 * Tool to select mobile platform before creating a session
 */
import { ADBManager } from '../devicemanager/adb-manager.js';
import { z } from 'zod';

export default function selectPlatform(server: any): void {
  server.addTool({
    name: 'select_platform',
    description:
      'REQUIRED: First ASK THE USER which mobile platform they want to use (Android or iOS) before creating a session. DO NOT assume or default to any platform. You MUST explicitly prompt the user to choose between Android or iOS. This is mandatory before proceeding to use the create_session tool.',
    parameters: z.object({
      platform: z
        .enum(['ios', 'android'])
        .describe(
          "REQUIRED: The platform chosen by the user - 'android' for Android devices/emulators or 'ios' for iOS devices/simulators. This must be based on the user's explicit choice, NOT a default assumption."
        ),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const { platform } = args;

        let platformInfo: string;
        let nextSteps: string;

        if (platform === 'android') {
          const adb = await ADBManager.getInstance().initialize();
          const devices = await adb.getConnectedDevices();
          if (devices.length === 0) {
            throw new Error('No Android devices/emulators found');
          }

          platformInfo = 'Android platform selected';

          // If multiple devices, must use select_device tool
          if (devices.length > 1) {
            const deviceList = devices
              .map((device, index) => `  ${index + 1}. ${device.udid}`)
              .join('\n');
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ ${platformInfo}\n\n⚠️ Multiple Android devices/emulators found (${devices.length}):\n${deviceList}\n\n🚨 IMPORTANT: You MUST use the select_device tool next to ask the user which device they want to use.\n\nDO NOT proceed to create_session until the user has selected a specific device using the select_device tool.`,
                },
              ],
            };
          }

          // Single device found
          platformInfo = `Android platform selected (Found device: ${devices[0].udid})`;
          nextSteps =
            `Found 1 Android device: ${devices[0].udid}\n\n` +
            "You can now create an Android session using the create_session tool with platform='android'. Make sure you have:\n" +
            '• Android SDK installed\n' +
            '• Android device connected or emulator running\n' +
            '• USB debugging enabled (for real devices)';
        } else if (platform === 'ios') {
          platformInfo = 'iOS platform selected';
          nextSteps =
            "You can now create an iOS session using the create_session tool with platform='ios'. Make sure you have:\n" +
            '• Xcode installed (macOS only)\n' +
            '• iOS device connected or simulator running\n' +
            '• Developer certificates configured (for real devices)\n' +
            '• Note: iOS testing requires macOS';
        } else {
          throw new Error(
            `Invalid platform: ${platform}. Please choose 'android' or 'ios'.`
          );
        }

        console.log(`Platform selected: ${platform.toUpperCase()}`);

        return {
          content: [
            {
              type: 'text',
              text: `✅ ${platformInfo}\n\n📋 Next Steps:\n${nextSteps}\n\n🚀 Ready to create a session? Use the create_session tool with platform='${platform}'`,
            },
          ],
        };
      } catch (error: any) {
        console.error('Error selecting platform:', error);
        throw new Error(`Failed to select platform: ${error.message}`);
      }
    },
  });
}
