import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { ElementHealer } from '../../healing/element-healer.js';

export const findWithHealingSchema = z.object({
  strategy: z.enum([
    'xpath',
    'id',
    'name',
    'class name',
    'accessibility id',
    'css selector',
    '-android uiautomator',
    '-ios predicate string',
    '-ios class chain',
  ]),
  selector: z.string().describe('The selector to find the element'),
  elementDescription: z
    .string()
    .optional()
    .describe(
      'Optional human-readable description of the element (e.g., "login button", "username field") to help AI-powered healing'
    ),
});

export default function findWithHealing(server: FastMCP): void {
  server.addTool({
    name: 'appium_find_element_with_healing',
    description:
      'Find an element with automatic healing and recovery. If the element is not found with the primary locator, it will automatically try alternative strategies including AI-powered suggestions. Returns element UUID for interaction.',
    parameters: findWithHealingSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any): Promise<any> => {
      try {
        const result = await ElementHealer.findElementWithHealing(
          args.strategy,
          args.selector,
          args.elementDescription
        );

        if (result.success && result.element) {
          const healingInfo = result.attemptCount > 1 
            ? `\n\n🔧 Element was healed! Original locator failed, but found using ${result.strategyUsed}="${result.selectorUsed}" after ${result.attemptCount} attempts (${result.timeTakenMs}ms).\n\nHealing path:\n${result.healingPath.join('\n')}`
            : '';

          return {
            content: [
              {
                type: 'text',
                text: `Successfully found element. Element UUID: ${result.element.ELEMENT}${healingInfo}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to find element after ${result.attemptCount} attempts (${result.timeTakenMs}ms). Tried the following strategies:\n\n${result.healingPath.join('\n')}\n\nConsider providing an element description for better AI-powered healing, or try a different locator strategy.`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error during element healing: ${error.message}`,
            },
          ],
        };
      }
    },
  });
}
