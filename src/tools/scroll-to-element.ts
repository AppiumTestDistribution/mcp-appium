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
  // XXX: Maybe in this case it is needed to use the appPackage property and be the selector like THE_APP_PACKAGE:id/THE_SELECTOR
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

        // TODO TRACE
        console.log(`CAPABILITIES: ${getDriver().capabilities}`);

        switch (getPlatformName(driver)) {
          case 'Android':
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
            break;
          case 'iOS':
            const element = await driver.findElement(
              args.strategy,
              args.selector
            );
            if (!element || !element.elementId) {
              throw new Error(
                'El elemento con selector no se encontró o no es scrollable.'
              );
            }
            await driver.execute('mobile: scroll', {
              element: element.ELEMENT,
              toVisible: true,
              direct: true,
            });
            // let found = false;
            // let scrollCount = 0;
            // const maxScrolls = 3; // Máximo número de scrolls para evitar bucles infinitos
            // let direction: 'down' | 'up' = 'down'; // Puedes alternar según la lógica

            // while (!found && scrollCount < maxScrolls) {
            //   try {
            //     // Intentar encontrar el elemento primero
            //     const element = await driver.findElement(
            //       args.strategy,
            //       args.selector
            //     );
            //     if (await element.isDisplayed()) {
            //       found = true;
            //       break;
            //     }
            //   } catch (error) {
            //     // El elemento no se encuentra visible, continuar con scroll
            //   }

            //   // Ejecuta scroll hacia abajo
            //   const { width, height } = await driver.getWindowSize();
            //   const startX = width / 2;
            //   const startY = direction === 'down' ? height * 0.7 : height * 0.3;
            //   const endY = direction === 'down' ? height * 0.3 : height * 0.7;

            //   await driver.execute('mobile: scroll', {
            //     direction: direction,
            //     startX: startX,
            //     startY: startY,
            //     endX: startX,
            //     endY: endY,
            //   });

            //   scrollCount++;
            // }

            // if (!found) {
            //   throw new Error(
            //     `No se encontró el elemento después de ${maxScrolls} scrolls`
            //   );
            // }

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

const scrollOniOSToElement = async (
  driver: any,
  strategy: string,
  selector: string,
  maxScrolls = 1
) => {
  let element = await driver.findElement(strategy, selector);
  let found = await element.isDisplayed();
  if (found) {
    console.log(`Element ${selector} is already visible.`);
    return;
  }

  try {
    const elementId = element.elementId;
    await driver.execute('mobile: scroll', {
      elementId: elementId,
      toVisible: true,
      direct: true, // scroll directo al elemento si es posible
    });
  } catch (error) {
    // Si falla el scroll directo, puedes intentar scroll manual con dirección
    const { width, height } = await driver.getWindowSize();
    await driver.execute('mobile: scroll', {
      direction: 'down',
      startX: width / 2,
      startY: height * 0.7,
      endX: width / 2,
      endY: height * 0.3,
    });
  }

  // Reintenta buscar y comprobar si el elemento es visible
  element = await driver.findElement(strategy, selector);
  found = await element.isDisplayed();

  if (!found) {
    throw new Error(
      `Elemento '${selector}' no encontrado después de ${maxScrolls} intentos de scroll`
    );
  }
};
