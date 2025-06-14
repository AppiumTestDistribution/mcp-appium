import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver } from '../sessionStore.js';

export default function screenshot(server: FastMCP): void {
  server.addTool({
    name: 'appium_screenshot',
    description: 'Take a screenshot of the current screen in base64 format',
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
        const screenshot = await driver.getScreenshot();
        return {
          content: [
            {
              type: 'text',
              text: screenshot,
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to take screenshot. err: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
