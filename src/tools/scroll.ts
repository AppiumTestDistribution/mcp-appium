import { z } from 'zod';
import { getDriver, getPlatformName } from './sessionStore.js';

export default function scroll(server: any): void {
  server.addTool({
    name: 'appium_scroll',
    description: 'Scrolls the current screen up or down',
    parameters: z.object({
      direction: z
        .enum(['up', 'down'])
        .default('down')
        .describe('Scroll direction'),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      const driver = getDriver();
      if (!driver) {
        throw new Error(
          'No active driver session. Please create a session first.'
        );
      }

      try {
        const { width, height } = await driver.getWindowSize();
        console.log('Device screen size:', { width, height });
        const startX = Math.floor(width / 2);
        // calculate start and end Y positions for scrolling depending on the direction
        // startY is at 80% of the height, endY is at 20% of the height for downward scroll
        // and vice versa for upward scroll
        // this ensures that the scroll starts from the bottom of the screen and goes to the top
        // or starts from the top and goes to the bottom
        // Adjust these percentages as needed for your specific use case
        const startY =
          args.direction === 'down'
            ? Math.floor(height * 0.8)
            : Math.floor(height * 0.2);
        const endY =
          args.direction === 'down'
            ? Math.floor(height * 0.2)
            : Math.floor(height * 0.8);

        console.log('Going to scroll from:', { startX, startY });
        console.log('Going to scroll to:', { startX, endY });

        if (getPlatformName(driver) === 'Android') {
          await driver.performActions([
            {
              type: 'pointer',
              id: 'finger1',
              parameters: { pointerType: 'touch' },
              actions: [
                { type: 'pointerMove', duration: 0, x: startX, y: startY },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 250 },
                { type: 'pointerMove', duration: 600, x: startX, y: endY },
                { type: 'pointerUp', button: 0 },
              ],
            },
          ]);
          console.log('Scroll action completed successfully.');
        } else if (getPlatformName(driver) === 'iOS') {
          await driver.execute('mobile: scroll', {
            direction: args.direction,
            startX: startX,
            startY: startY,
            endX: startX,
            endY: endY,
          });
        } else {
          throw new Error(
            `Unsupported platform: ${getPlatformName(driver)}. Only Android and iOS are supported.`
          );
        }
        return {
          content: [
            {
              type: 'text',
              text: `Scrolled ${args.direction} successfully.`,
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to scroll ${args.direction}. Error: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
