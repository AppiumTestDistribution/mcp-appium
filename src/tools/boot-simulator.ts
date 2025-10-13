/**
 * Tool to boot iOS simulator
 */
import { z } from 'zod';
import { Simctl } from 'node-simctl';
import { IOSManager } from '../devicemanager/ios-manager.js';

export default function bootSimulator(server: any): void {
  server.addTool({
    name: 'boot_simulator',
    description:
      'Boot an iOS simulator and wait for it to be ready. This speeds up subsequent session creation by ensuring the simulator is already running.',
    parameters: z.object({
      udid: z
        .string()
        .describe(
          'The UDID of the iOS simulator to boot. Use select_platform and select_device tools first to get the UDID.'
        ),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const { udid } = args;

        // Verify it's a macOS system
        if (process.platform !== 'darwin') {
          throw new Error('iOS simulators can only be booted on macOS systems');
        }

        const iosManager = IOSManager.getInstance();
        const simulators = await iosManager.listSimulators();

        // Find the simulator with the given UDID
        const simulator = simulators.find(sim => sim.udid === udid);

        if (!simulator) {
          throw new Error(
            `Simulator with UDID "${udid}" not found. Please use select_platform and select_device tools to get a valid UDID.`
          );
        }

        // Check current state
        if (simulator.state === 'Booted') {
          return {
            content: [
              {
                type: 'text',
                text: `✅ Simulator "${simulator.name}" is already booted and ready!\n\nUDID: ${udid}\niOS Version: ${simulator.platform || 'Unknown'}\nState: ${simulator.state}`,
              },
            ],
          };
        }

        console.log(`Booting iOS simulator: ${simulator.name} (${udid})...`);

        const simctl = new Simctl();
        simctl.udid = udid;

        // Boot the device
        await simctl.bootDevice();
        console.log(
          'Simulator boot initiated, waiting for boot to complete...'
        );

        // Wait for boot to complete with 2 minute timeout
        await simctl.startBootMonitor({ timeout: 120000 });

        console.log(`Simulator "${simulator.name}" booted successfully!`);

        return {
          content: [
            {
              type: 'text',
              text: `✅ Simulator booted successfully!\n\nDevice: ${simulator.name}\nUDID: ${udid}\niOS Version: ${simulator.platform || 'Unknown'}\n\n🚀 The simulator is now ready for session creation. You can now use the create_session tool to start an Appium session.`,
            },
          ],
        };
      } catch (error: any) {
        console.error('Error booting simulator:', error);
        throw new Error(`Failed to boot simulator: ${error.message}`);
      }
    },
  });
}
