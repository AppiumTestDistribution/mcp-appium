import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver } from '../sessionStore.js';
import { checkIsValidElementId } from '../../utils.js';
import { elementUUIDScheme } from '../../schema.js';

export default function generateTest(server: FastMCP): void {
  const clickActionSchema = z.object({
    elementUUID: elementUUIDScheme,
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
        checkIsValidElementId(args.elementUUID);
        await driver.click(args.elementUUID);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully clicked on element ${args.elementUUID}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to click on element ${args.elementUUID}. err: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
