import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver, getPlatformName } from '../sessionStore.js';
import { checkIsValidElementId } from '../../utils.js';
import { elementUUIDScheme } from '../../schema.js';

export default function doubleTap(server: FastMCP): void {
  const doubleTapActionSchema = z.object({
    elementUUID: elementUUIDScheme,
  });

  server.addTool({
    name: 'appium_double_tap',
    description: 'Perform double tap on an element',
    parameters: doubleTapActionSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      const driver = getDriver();
      if (!driver) {
        throw new Error('No driver found');
      }

      try {
        checkIsValidElementId(args.elementUUID);

        const platform = getPlatformName(driver);

        if (platform === 'Android') {
          // Get element location for Android double tap
          const element = await driver.findElement('id', args.elementUUID);
          const location = await element.getLocation();
          const size = await element.getSize();

          // Calculate center coordinates
          const x = location.x + size.width / 2;
          const y = location.y + size.height / 2;

          // Perform double tap using performActions
          await driver.performActions([
            {
              type: 'pointer',
              id: 'finger1',
              parameters: { pointerType: 'touch' },
              actions: [
                { type: 'pointerMove', duration: 0, x, y },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 50 },
                { type: 'pointerUp', button: 0 },
                { type: 'pause', duration: 100 },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 50 },
                { type: 'pointerUp', button: 0 },
              ],
            },
          ]);
        } else if (platform === 'iOS') {
          // Use iOS mobile: doubleTap execute method
          await driver.execute('mobile: doubleTap', [
            { elementId: args.elementUUID },
          ]);
        } else {
          throw new Error(
            `Unsupported platform: ${platform}. Only Android and iOS are supported.`
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: `Successfully performed double tap on element ${args.elementUUID}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to perform double tap on element ${args.elementUUID}. Error: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
