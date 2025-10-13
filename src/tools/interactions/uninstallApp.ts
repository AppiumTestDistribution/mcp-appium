import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver, getPlatformName } from '../sessionStore.js';

export default function uninstallApp(server: FastMCP): void {
  const schema = z.object({
    id: z
      .string()
      .describe('App identifier (package name for Android, bundle ID for iOS)'),
  });

  server.addTool({
    name: 'appium_uninstallApp',
    description: 'Uninstall an app from the device.',
    parameters: schema,
    execute: async (args: z.infer<typeof schema>) => {
      const { id } = args;
      const driver = await getDriver();
      if (!driver) {
        throw new Error('No driver found');
      }
      try {
        const platform = getPlatformName(driver);
        const params =
          platform === 'Android' ? { appId: id } : { bundleId: id };
        await (driver as any).execute('mobile: removeApp', params);
        return {
          content: [
            {
              type: 'text',
              text: 'App uninstalled successfully',
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to uninstall app. err: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
