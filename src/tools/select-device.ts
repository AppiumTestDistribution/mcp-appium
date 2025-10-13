/**
 * Tool to select a specific device when multiple devices are available
 */
import { ADBManager } from '../devicemanager/adb-manager.js';
import { z } from 'zod';

// Store selected device globally
let selectedDeviceUdid: string | null = null;

export function getSelectedDevice(): string | null {
  return selectedDeviceUdid;
}

export function clearSelectedDevice(): void {
  selectedDeviceUdid = null;
}

export default function selectDevice(server: any): void {
  server.addTool({
    name: 'select_device',
    description:
      'REQUIRED when multiple devices are found: Ask the user to select which specific device they want to use from the available devices. This tool lists all available devices and allows selection by UDID. You MUST use this tool when select_platform returns multiple devices before calling create_session.',
    parameters: z.object({
      platform: z
        .enum(['ios', 'android'])
        .describe(
          'The platform to list devices for (must match previously selected platform)'
        ),
      deviceUdid: z
        .string()
        .optional()
        .describe(
          'The UDID of the device selected by the user. If not provided, this tool will list available devices for the user to choose from.'
        ),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const { platform, deviceUdid } = args;

        if (platform === 'android') {
          const adb = await ADBManager.getInstance().initialize();
          const devices = await adb.getConnectedDevices();

          if (devices.length === 0) {
            throw new Error('No Android devices/emulators found');
          }

          // If deviceUdid is provided, validate and select it
          if (deviceUdid) {
            const selectedDevice = devices.find((d) => d.udid === deviceUdid);
            if (!selectedDevice) {
              throw new Error(
                `Device with UDID "${deviceUdid}" not found. Available devices: ${devices.map((d) => d.udid).join(', ')}`
              );
            }

            selectedDeviceUdid = deviceUdid;
            console.log(`Device selected: ${deviceUdid}`);

            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Device selected: ${deviceUdid}\n\n🚀 You can now create a session using the create_session tool with:\n• platform='android'\n• capabilities: { "appium:udid": "${deviceUdid}" }`,
                },
              ],
            };
          }

          // If no deviceUdid provided, list available devices
          const deviceList = devices
            .map((device, index) => `  ${index + 1}. ${device.udid}`)
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `📱 Available Android devices/emulators (${devices.length}):\n${deviceList}\n\n⚠️ IMPORTANT: Please ask the user which device they want to use.\n\nOnce the user selects a device, call this tool again with the deviceUdid parameter set to their chosen device UDID.`,
              },
            ],
          };
        } else if (platform === 'ios') {
          throw new Error('iOS device selection not yet implemented');
        } else {
          throw new Error(
            `Invalid platform: ${platform}. Please choose 'android' or 'ios'.`
          );
        }
      } catch (error: any) {
        console.error('Error selecting device:', error);
        throw new Error(`Failed to select device: ${error.message}`);
      }
    },
  });
}

