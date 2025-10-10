import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { HealingLogger } from '../../healing/logger.js';

export default function healingReport(server: FastMCP): void {
  server.addTool({
    name: 'get_healing_report',
    description:
      'Get a comprehensive report of all healing attempts in the current session, including success rates, average healing time, and detailed history.',
    parameters: z.object({}),
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    execute: async (): Promise<any> => {
      try {
        const report = HealingLogger.generateReport();
        const history = HealingLogger.getHealingHistory();
        
        let detailedHistory = '';
        if (history.length > 0) {
          detailedHistory = '\n\nDetailed History (last 10 events):\n';
          const recentEvents = history.slice(-10);
          
          recentEvents.forEach((event, index) => {
            detailedHistory += `\n${index + 1}. ${event.timestamp}
   Original: ${event.originalStrategy}="${event.originalSelector}"
   Healing: ${event.healingStrategy}="${event.healingSelector || 'N/A'}"
   Result: ${event.success ? '✓ SUCCESS' : '✗ FAILED'}
   Time: ${event.timeTakenMs}ms
   AI Used: ${event.aiUsed ? 'Yes' : 'No'}\n`;
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: report + detailedHistory,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to generate healing report: ${error.message}`,
            },
          ],
        };
      }
    },
  });
}
