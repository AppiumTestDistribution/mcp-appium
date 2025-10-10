import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { setHealingConfig, HealingMode, getHealingConfig } from '../../healing/config.js';

export const configureHealingSchema = z.object({
  mode: z.enum(['conservative', 'moderate', 'aggressive', 'disabled']).describe(
    'Healing mode: conservative (basic retries), moderate (retries + AI), aggressive (retries + AI + visual matching), disabled (no healing)'
  ),
});

export default function configureHealing(server: FastMCP): void {
  server.addTool({
    name: 'configure_healing',
    description:
      'Configure the test healing and auto-recovery mode. Conservative mode uses basic retry strategies, moderate adds AI-powered healing, and aggressive includes visual matching. Set to disabled to turn off healing.',
    parameters: configureHealingSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any): Promise<any> => {
      try {
        const mode = args.mode as HealingMode;
        setHealingConfig(mode);
        const config = getHealingConfig();

        return {
          content: [
            {
              type: 'text',
              text: `Test healing configured to ${mode} mode:
- Max retries: ${config.maxRetries}
- Retry delay: ${config.retryDelayMs}ms
- Exponential backoff: ${config.useExponentialBackoff}
- AI fallback: ${config.enableAIFallback}
- Visual matching: ${config.enableVisualMatching}
- Auto-update locators: ${config.autoUpdateLocators}

Test healing is now active. When elements fail to be found, the system will automatically try alternative locators.`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to configure healing: ${error.message}`,
            },
          ],
        };
      }
    },
  });
}
