import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver } from '../sessionStore.js';

export default function getText(server: FastMCP): void {
  const getTextSchema = z.object({
    elementId: z
      .string()
      .describe(
        'The id of the element returned by findelement to retreieve text'
      ),
  });

  server.addTool({
    name: 'appium_get_text',
    description: 'Get text from an element',
    parameters: getTextSchema,
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
        const text = await driver.getText(args.elementId);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully got text ${text} from element ${args.elementId}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get text from element ${args.elementId}. err: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
