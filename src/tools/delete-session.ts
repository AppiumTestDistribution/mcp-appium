/**
 * Tool to delete the current mobile session and clean up resources
 */
import { z } from 'zod';
import { safeDeleteSession } from './sessionStore.js';

export default function deleteSession(server: any): void {
  server.addTool({
    name: 'delete_session',
    description: 'Delete the current mobile session and clean up resources.',
    parameters: z.object({}),
    annotations: {
      destructiveHint: true,
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (): Promise<any> => {
      try {
        const deleted = await safeDeleteSession();
        
        if (deleted) {
          return {
            content: [
              {
                type: 'text',
                text: 'Session deleted successfully.',
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: 'No active session found or deletion already in progress.',
              },
            ],
          };
        }
      } catch (error: any) {
        console.error(`Error deleting session`, error);
        throw new Error(`Failed to delete session: ${error.message}`);
      }
    },
  });
}