import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver } from '../sessionStore.js';

export default function generateTest(server: FastMCP): void {
  const clickActionSchema = z.object({
    elementId: z
      .string()
      .describe('The id of the element returned by findelement to click'),
  });

  server.addTool({
    name: 'appium_click',
    description: 'Click on an element',
    parameters: clickActionSchema,
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
        await driver.click(args.elementId);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully clicked on element ${args.elementId}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to click on element ${args.elementId}. err: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
