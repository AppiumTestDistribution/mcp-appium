import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { getDriver } from './sessionStore.js';
import { z } from 'zod';

export default function terminateApp(server: FastMCP): void {
  const terminateAppSchema = z.object({
    id: z.string().describe('The app id'),
  });

  server.addTool({
    name: 'terminate_app',
    description: 'Terminate app by id',
    parameters: terminateAppSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: { id: string }, context: any): Promise<any> => {
      const driver = getDriver();
      if (!driver) {
        throw new Error('No driver found');
      }

      try {
        await driver.terminateApp(args.id);
        return {
          content: [
            {
              type: 'text',
              text: `App ${args.id} terminated correctly.`,
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error terminating the app ${args.id}: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}