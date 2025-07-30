import { getDriver, getPlatformName } from './sessionStore.js';
import { findElementSchema } from './interactions/find.js';

const getValue = (xpath: string, expression: string): string => {
  // Extracts the value from an XPath expression.
  let start = xpath.indexOf(expression) + expression.length;
  start = xpath.indexOf("'", start) + 1;
  let end = xpath.indexOf("'", start);
  return xpath.substring(start, end);
};

const transformXPath = (
  xpath: string
): { strategy: string; selector: string } => {
  // normalize xpath expression by replacing " by '
  xpath = xpath.replace(/"/g, "'");
  if (xpath.includes('@text='))
    return { strategy: 'text', selector: getValue(xpath, '@text=') };

  if (xpath.includes('@content-desc='))
    return {
      strategy: 'description',
      selector: getValue(xpath, '@content-desc='),
    };

  if (xpath.includes('contains(@text,'))
    return {
      strategy: 'textContains',
      selector: getValue(xpath, 'contains(@text,'),
    };

  if (xpath.includes('contains(@content-desc,'))
    return {
      strategy: 'descriptionContains',
      selector: getValue(xpath, 'contains(@content-desc,'),
    };

  throw new Error(
    `Unsupported XPath expression: ${xpath}. Supported expressions are: @text, @content-desc, contains(@text, ...), contains(@content-desc, ...)`
  );
};

const transformLocator = (
  strategy: string,
  selector: string
): { strategy: string; selector: string } => {
  if (strategy === 'id') return { strategy: 'resourceId', selector };
  if (strategy === 'xpath') return transformXPath(selector);
  if (strategy === 'class name') return { strategy: 'className', selector };

  return { strategy, selector };
};

export default function scrollToElement(server: any): void {
  server.addTool({
    name: 'appium_scroll_to_element',
    description: 'Scrolls the current screen till a certain element is visible',
    parameters: findElementSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      const driver = getDriver();
      if (!driver) {
        throw new Error(
          'No active driver session. Please create a session first.'
        );
      }

      try {
        switch (getPlatformName(driver)) {
          case 'Android':
            let { strategy, selector } = transformLocator(
              args.strategy,
              args.selector
            );
            const sel = `new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().${strategy}("${selector}"))`;
            await driver.findElement('-android uiautomator', sel);
            break;
          case 'iOS':
            const element = await driver.findElement(
              args.strategy,
              args.selector
            );
            await driver.execute('mobile: scroll', {
              element: element.ELEMENT,
              toVisible: true,
            });
            break;
          default:
            throw new Error(
              'Unsupported driver type. This tool only supports Android and iOS drivers.'
            );
        }
        return {
          content: [
            {
              type: 'text',
              text: 'Scrolled down successfully.',
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to scroll down. Error: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
