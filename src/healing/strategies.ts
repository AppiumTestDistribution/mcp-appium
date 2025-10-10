export interface LocatorStrategy {
  strategy: string;
  selector: string;
  priority: number;
}

export class FallbackStrategies {
  static generateFallbackLocators(
    originalStrategy: string,
    originalSelector: string,
    pageSource: string
  ): LocatorStrategy[] {
    const fallbacks: LocatorStrategy[] = [];

    if (originalStrategy === 'id') {
      fallbacks.push(
        {
          strategy: 'accessibility id',
          selector: originalSelector,
          priority: 1,
        },
        {
          strategy: 'xpath',
          selector: `//*[@resource-id="${originalSelector}"]`,
          priority: 2,
        },
        {
          strategy: 'xpath',
          selector: `//*[contains(@resource-id, "${originalSelector}")]`,
          priority: 3,
        }
      );
    } else if (originalStrategy === 'accessibility id') {
      fallbacks.push(
        {
          strategy: 'id',
          selector: originalSelector,
          priority: 1,
        },
        {
          strategy: 'xpath',
          selector: `//*[@content-desc="${originalSelector}"]`,
          priority: 2,
        },
        {
          strategy: 'xpath',
          selector: `//*[contains(@content-desc, "${originalSelector}")]`,
          priority: 3,
        }
      );
    } else if (originalStrategy === 'xpath') {
      const idMatch = originalSelector.match(/@resource-id=['"](.*?)['"]/);
      const contentDescMatch = originalSelector.match(
        /@content-desc=['"](.*?)['"]/
      );
      const textMatch = originalSelector.match(/@text=['"](.*?)['"]/);

      if (idMatch) {
        fallbacks.push({
          strategy: 'id',
          selector: idMatch[1],
          priority: 1,
        });
      }
      if (contentDescMatch) {
        fallbacks.push({
          strategy: 'accessibility id',
          selector: contentDescMatch[1],
          priority: 2,
        });
      }
      if (textMatch) {
        fallbacks.push({
          strategy: 'xpath',
          selector: `//*[@text="${textMatch[1]}"]`,
          priority: 3,
        });
      }
    } else if (originalStrategy === 'class name') {
      fallbacks.push({
        strategy: 'xpath',
        selector: `//${originalSelector}`,
        priority: 1,
      });
    }

    fallbacks.push({
      strategy: '-android uiautomator',
      selector: `new UiSelector().descriptionContains("${this.extractKeyword(originalSelector)}")`,
      priority: 4,
    });

    fallbacks.push({
      strategy: '-android uiautomator',
      selector: `new UiSelector().textContains("${this.extractKeyword(originalSelector)}")`,
      priority: 5,
    });

    return fallbacks.sort((a, b) => a.priority - b.priority);
  }

  private static extractKeyword(selector: string): string {
    const matches =
      selector.match(/['"]([^'"]+)['"]/g) || selector.match(/\w+/g);
    if (matches && matches.length > 0) {
      return matches[0].replace(/['"]/g, '');
    }
    return selector.substring(0, 20);
  }

  static generateIOSFallbackLocators(
    originalStrategy: string,
    originalSelector: string
  ): LocatorStrategy[] {
    const fallbacks: LocatorStrategy[] = [];

    if (originalStrategy === 'id' || originalStrategy === 'name') {
      fallbacks.push(
        {
          strategy: 'accessibility id',
          selector: originalSelector,
          priority: 1,
        },
        {
          strategy: 'xpath',
          selector: `//*[@name="${originalSelector}"]`,
          priority: 2,
        },
        {
          strategy: '-ios predicate string',
          selector: `name == "${originalSelector}"`,
          priority: 3,
        },
        {
          strategy: '-ios predicate string',
          selector: `name CONTAINS "${originalSelector}"`,
          priority: 4,
        }
      );
    } else if (originalStrategy === 'accessibility id') {
      fallbacks.push(
        {
          strategy: 'id',
          selector: originalSelector,
          priority: 1,
        },
        {
          strategy: 'name',
          selector: originalSelector,
          priority: 2,
        },
        {
          strategy: '-ios predicate string',
          selector: `label == "${originalSelector}"`,
          priority: 3,
        }
      );
    }

    return fallbacks.sort((a, b) => a.priority - b.priority);
  }
}
