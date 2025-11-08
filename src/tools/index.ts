/**
 * Tools Registration Module
 *
 * This file registers all available MCP tools with the server.
 *
 * ADDING A NEW TOOL:
 * 1. Create your tool file in src/tools/
 * 2. Import it at the top of this file
 * 3. Call it in the registerTools function below
 *
 * See docs/CONTRIBUTING.md for detailed instructions.
 * See src/tools/README.md for tool organization.
 * See src/tools/metadata/README.md for YAML metadata approach.
 */
import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import log from '../locators/logger.js';
import answerAppium from './answer-appium.js';
import createSession from './create-session.js';
import deleteSession from './delete-session.js';
import generateLocators from './locators.js';
import selectPlatform from './select-platform.js';
import selectDevice from './select-device.js';
import bootSimulator from './boot-simulator.js';
import setupWDA from './setup-wda.js';
import installWDA from './install-wda.js';
import generateTest from './generate-tests.js';
import scroll from './scroll.js';
import scrollToElement from './scroll-to-element.js';
import findElement from './interactions/find.js';
import clickElement from './interactions/click.js';
import doubleTap from './interactions/double-tap.js';
import setValue from './interactions/set-value.js';
import getText from './interactions/get-text.js';
import getPageSource from './interactions/get-page-source.js';
import screenshot from './interactions/screenshot.js';
import activateApp from './interactions/activate-app.js';
import installApp from './interactions/install-app.js';
import uninstallApp from './interactions/uninstall-app.js';
import terminateApp from './interactions/terminate-app.js';
import listApps from './interactions/list-apps.js';

export default function registerTools(server: FastMCP): void {
  // Wrap addTool to inject logging around tool execution
  const originalAddTool = (server as any).addTool.bind(server);
  (server as any).addTool = (toolDef: any) => {
    const toolName = toolDef?.name ?? 'unknown_tool';
    const originalExecute = toolDef?.execute;
    if (typeof originalExecute !== 'function') {
      return originalAddTool(toolDef);
    }
    const SENSITIVE_KEYS = [
      'password',
      'token',
      'accessToken',
      'authorization',
      'apiKey',
      'apikey',
      'secret',
      'clientSecret',
    ];
    const redactArgs = (obj: any) => {
      try {
        return JSON.parse(
          JSON.stringify(obj, (key, value) => {
            if (
              key &&
              SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))
            ) {
              return '[REDACTED]';
            }
            // Avoid logging extremely large buffers/strings
            if (value && typeof value === 'string' && value.length > 2000) {
              return `[string:${value.length}]`;
            }
            if (
              value &&
              typeof Buffer !== 'undefined' &&
              Buffer.isBuffer(value)
            ) {
              return `[buffer:${(value as Buffer).length}]`;
            }
            return value;
          })
        );
      } catch {
        return '[Unserializable args]';
      }
    };
    return originalAddTool({
      ...toolDef,
      execute: async (args: any, context: any) => {
        const start = Date.now();
        log.info(`[TOOL START] ${toolName}`, redactArgs(args));
        try {
          const result = await originalExecute(args, context);
          const duration = Date.now() - start;
          log.info(`[TOOL END] ${toolName} (${duration}ms)`);
          return result;
        } catch (err: any) {
          const duration = Date.now() - start;
          const msg = err?.stack || err?.message || String(err);
          log.error(`[TOOL ERROR] ${toolName} (${duration}ms): ${msg}`);
          throw err;
        }
      },
    });
  };

  selectPlatform(server);
  selectDevice(server);
  bootSimulator(server);
  setupWDA(server);
  installWDA(server);
  createSession(server);
  deleteSession(server);
  generateLocators(server);
  answerAppium(server);
  scroll(server);
  scrollToElement(server);

  activateApp(server);
  installApp(server);
  uninstallApp(server);
  terminateApp(server);
  listApps(server);
  findElement(server);
  clickElement(server);
  doubleTap(server);
  setValue(server);
  getText(server);
  getPageSource(server);
  screenshot(server);
  generateTest(server);
  log.info('All tools registered');
}
