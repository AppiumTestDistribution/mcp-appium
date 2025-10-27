/**
 * Example: Scroll Tool with YAML Metadata
 *
 * This file demonstrates how to use YAML-based tool metadata.
 *
 * TWO PATTERNS AVAILABLE:
 *
 * 1. Traditional Pattern (current implementation in scroll.ts):
 *    - All metadata (name, description, parameters) defined inline in TypeScript
 *    - Simple and straightforward
 *    - Good for simple tools
 *
 * 2. YAML Pattern (shown in this file):
 *    - Load metadata from YAML file (src/tools/metadata/scroll.yaml)
 *    - Separates metadata from implementation
 *    - Better for maintainability and documentation
 *
 * Choose based on your needs. Both work!
 */

import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver, getPlatformName } from './sessionStore.js';

export default function scrollWithYAML(server: FastMCP): void {
  // Note: loadToolMetadata is now async
  // For production use, you could either:
  // 1. Pre-load metadata during module initialization
  // 2. Load metadata in the execute function
  // 3. Use inline metadata (simpler approach shown here)

  // For this example, we use inline metadata to keep it simple
  // See docs/CONTRIBUTING.md for async YAML loading examples
  server.addTool({
    name: 'appium_scroll', // Will be loaded from YAML in execute
    description: 'Scrolls the current screen up or down', // Will be loaded from YAML
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
      // Load metadata async if needed
      // const metadata = await loadToolMetadata('scroll.yaml');
      // Implementation logic here (unchanged)
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

        // Calculate scroll positions based on direction
        // Metadata notes field can provide implementation hints
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

        // Platform-specific implementation
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

/**
 * KEY BENEFITS OF YAML APPROACH:
 *
 * 1. Better Maintainability
 *    - Metadata is separated from implementation
 *    - Easy to update descriptions without touching code
 *
 * 2. Documentation Generation
 *    - Can auto-generate docs from YAML files
 *    - Tools can be documented independently
 *
 * 3. Internationalization
 *    - Easy to translate tool descriptions
 *    - Multiple YAML files for different languages
 *
 * 4. Version Control
 *    - Track metadata changes separately
 *    - See what changed in tool descriptions over time
 *
 * WHEN TO USE EACH:
 *
 * Use YAML when:
 * - Tool has complex or detailed descriptions
 * - You want to generate documentation
 * - Multiple similar tools can share metadata structure
 * - You need to maintain metadata separately
 *
 * Use inline when:
 * - Tool is simple and straightforward
 * - Metadata is tightly coupled with implementation
 * - You prefer keeping everything in one file
 */
