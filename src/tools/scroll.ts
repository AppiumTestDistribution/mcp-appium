import { z } from 'zod';
import { getDriver } from './sessionStore.js';
import { AndroidUiautomator2Driver } from 'appium-uiautomator2-driver';
import { XCUITestDriver } from 'appium-xcuitest-driver';

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
  // XXX: Maybe in this case it is needed to use the appPackage property and be the selector like THE_APP_PACKAGE:id/THE_SELECTOR
  if (strategy === 'id') return { strategy: 'resourceId', selector };
  if (strategy === 'xpath') return transformXPath(selector);
  if (strategy === 'class name') return { strategy: 'className', selector };

  return { strategy, selector };
};

export default function scroll(server: any): void {
  const findElementSchema = z.object({
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
  });

  server.addTool({
    name: 'scroll_to_element',
    description: 'Scrolls the current screen till a certain element is visible',
    parameters: findElementSchema,
    annotations: {
      readOnlyHint: true,
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
        // Use the Appium scroll command
        // await driver.execute('mobile: scroll', { direction: 'down' });

        // const scrollClasses =
        //   '(?:android.widget.ScrollView|' +
        //   'androidx.recyclerview.widget.RecyclerView|' +
        //   'android.widget.ListView)';
        // const parent = driver.findParentElement(args.strategy, args.selector);

        // driver.findElement(
        //     `new UiScrollable(new UiSelector().classNameMatches("${scrollClasses}").instance(0).scrollable(true)).` +
        //     `setSwipeDeadZonePercentage(0.2).scrollIntoView(new UiSelector().{}("${}").` +
        //     "fromParent(new UiSelector().{}(\"{}\")));".format(scroll_clases, parent.strategy,
        //         parent.selector, args.strategy, args.selector))

        const platformName =
          driver instanceof AndroidUiautomator2Driver
            ? 'Android'
            : driver instanceof XCUITestDriver
              ? 'iOS'
              : null;

        // TODO TRACE
        console.log(`CAPABILITIES: ${getDriver().capabilities}`);

        if (platformName === 'Android') {
          // console.log(`PLATFORM1:  ${driver['platformName']}`);
          console.log(`KEYS:  ${console.log(Object.keys(driver))}`);
          console.log(`DRIVER: ${JSON.stringify(driver)}`);
          console.log(`DRIVER opts: ${driver.opts}`);
          // console.log(`AUTOMATION NAME: ${driver.capabilities.automationName}`);
          // console.log(`CAPABILITIES: ${JSON.stringify(driver.capabilities)}`);
          console.log(`ARGS.STRATEGY: ${args.strategy}`);
          console.log(`ARGS.SELECTOR: ${args.selector}`);

          let { strategy, selector } = transformLocator(
            args.strategy,
            args.selector
          );

          console.log(`STRATEGY: ${strategy}`);
          console.log(`SELECTOR: ${selector}`);
          const sel = `new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().${strategy}("${selector}"))`;
          console.log(`SEL: ${sel}`);

          await driver.findElement('-android uiautomator', sel);

          // console.log('TEMPORARY XPATH');
          // driver.findElement(
          //   '-android uiautomator',
          //   `new UiScrollable(new UiSelector().classNameMatches("${scrollClasses}").instance(0).scrollable(true)).scrollIntoView(new UiSelector().xpath("//android.widget.TextView[@text=\\"Cerrar sesión\\"]"))`
          // );

          // const sel =
          //   'new UiScrollable(new UiSelector().scrollable(true))' +
          //   '.scrollIntoView(new UiSelector().text("Cerrar sesión"))';
          // console.log('Seleccionado');
          // console.log(sel);
          // await driver.findElement('-android uiautomator', sel);
          // console.log('Swipe done');
        } else if (platformName === 'iOS') {
          const element = await driver.findElement(
            args.strategy,
            args.selector
          );
          await driver.execute('mobile: scroll', {
            element: element.ELEMENT,
            toVisible: true,
          });
          // await driver.execute('mobile: scroll', [
          //   {
          //     direction: 'down',
          //   },
          // ]);
        } else {
          throw new Error(
            'Unsupported driver type. This tool only works with Android Uiautomator2 Driver.'
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
