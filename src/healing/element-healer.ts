import { getDriver } from '../tools/sessionStore.js';
import { getHealingConfig } from './config.js';
import { HealingLogger, HealingEvent } from './logger.js';
import { FallbackStrategies, LocatorStrategy } from './strategies.js';
import { AIHealer } from './ai-healer.js';

export interface HealingResult {
  success: boolean;
  element?: any;
  strategyUsed?: string;
  selectorUsed?: string;
  attemptCount: number;
  timeTakenMs: number;
  healingPath: string[];
}

export class ElementHealer {
  private static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getRetryDelay(attempt: number, baseDelay: number, useExponential: boolean): number {
    if (!useExponential) return baseDelay;
    return baseDelay * Math.pow(2, attempt - 1);
  }

  static async findElementWithHealing(
    strategy: string,
    selector: string,
    elementDescription?: string
  ): Promise<HealingResult> {
    const startTime = Date.now();
    const config = getHealingConfig();
    const healingPath: string[] = [`Original: ${strategy}=${selector}`];

    const driver = getDriver();
    if (!driver) {
      throw new Error('No active driver session');
    }

    try {
      const element = await driver.findElement(strategy, selector);
      return {
        success: true,
        element,
        strategyUsed: strategy,
        selectorUsed: selector,
        attemptCount: 1,
        timeTakenMs: Date.now() - startTime,
        healingPath,
      };
    } catch (originalError: any) {
      if (config.maxRetries === 0) {
        throw originalError;
      }

      console.log(
        `Element not found with ${strategy}="${selector}". Starting healing process...`
      );

      let pageSource = '';
      try {
        pageSource = await driver.getPageSource();
      } catch (err) {
        console.warn('Could not retrieve page source for healing');
      }

      const platform = (await driver.getCapabilities()).platformName?.toLowerCase() as 'android' | 'ios';

      const fallbackLocators =
        platform === 'ios'
          ? FallbackStrategies.generateIOSFallbackLocators(strategy, selector)
          : FallbackStrategies.generateFallbackLocators(strategy, selector, pageSource);

      for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        const delay = this.getRetryDelay(attempt, config.retryDelayMs, config.useExponentialBackoff);
        await this.sleep(delay);

        const locatorToTry = fallbackLocators[attempt - 1];
        if (!locatorToTry) break;

        healingPath.push(`Attempt ${attempt}: ${locatorToTry.strategy}=${locatorToTry.selector}`);

        const healingEvent: HealingEvent = {
          timestamp: new Date().toISOString(),
          originalStrategy: strategy,
          originalSelector: selector,
          failureReason: originalError.message,
          healingAttempt: attempt,
          healingStrategy: locatorToTry.strategy,
          healingSelector: locatorToTry.selector,
          success: false,
          timeTakenMs: 0,
          aiUsed: false,
        };

        try {
          console.log(
            `Healing attempt ${attempt}: trying ${locatorToTry.strategy}="${locatorToTry.selector}"`
          );

          const element = await driver.findElement(locatorToTry.strategy, locatorToTry.selector);

          healingEvent.success = true;
          healingEvent.timeTakenMs = Date.now() - startTime;

          if (config.logHealingAttempts) {
            HealingLogger.logHealingSuccess(healingEvent);
          }

          return {
            success: true,
            element,
            strategyUsed: locatorToTry.strategy,
            selectorUsed: locatorToTry.selector,
            attemptCount: attempt + 1,
            timeTakenMs: Date.now() - startTime,
            healingPath,
          };
        } catch (err: any) {
          healingEvent.timeTakenMs = Date.now() - startTime;
          if (config.logHealingAttempts) {
            HealingLogger.logHealingAttempt(healingEvent);
          }
          console.log(`Healing attempt ${attempt} failed: ${err.message}`);
        }
      }

      if (config.enableAIFallback && elementDescription) {
        console.log('Attempting AI-powered healing with Gemini Flash...');
        healingPath.push('AI-powered healing with Gemini Flash');

        try {
          const screenshot = await driver.takeScreenshot();
          const aiSuggestions = await AIHealer.analyzeScreenshotForLocators(
            screenshot,
            elementDescription,
            platform
          );

          for (let i = 0; i < Math.min(aiSuggestions.length, 3); i++) {
            const suggestion = aiSuggestions[i];
            healingPath.push(
              `AI Suggestion ${i + 1}: ${suggestion.strategy}=${suggestion.selector} (confidence: ${suggestion.confidence})`
            );

            const healingEvent: HealingEvent = {
              timestamp: new Date().toISOString(),
              originalStrategy: strategy,
              originalSelector: selector,
              failureReason: originalError.message,
              healingAttempt: config.maxRetries + i + 1,
              healingStrategy: suggestion.strategy,
              healingSelector: suggestion.selector,
              success: false,
              timeTakenMs: 0,
              aiUsed: true,
            };

            try {
              const element = await driver.findElement(suggestion.strategy, suggestion.selector);

              healingEvent.success = true;
              healingEvent.timeTakenMs = Date.now() - startTime;

              if (config.logHealingAttempts) {
                HealingLogger.logHealingSuccess(healingEvent);
              }

              return {
                success: true,
                element,
                strategyUsed: suggestion.strategy,
                selectorUsed: suggestion.selector,
                attemptCount: config.maxRetries + i + 2,
                timeTakenMs: Date.now() - startTime,
                healingPath,
              };
            } catch (err: any) {
              healingEvent.timeTakenMs = Date.now() - startTime;
              if (config.logHealingAttempts) {
                HealingLogger.logHealingAttempt(healingEvent);
              }
            }
          }
        } catch (aiError: any) {
          console.error('AI healing failed:', aiError.message);
        }
      }

      const finalEvent: HealingEvent = {
        timestamp: new Date().toISOString(),
        originalStrategy: strategy,
        originalSelector: selector,
        failureReason: originalError.message,
        healingAttempt: config.maxRetries,
        healingStrategy: 'none',
        success: false,
        timeTakenMs: Date.now() - startTime,
        aiUsed: config.enableAIFallback,
      };

      if (config.logHealingAttempts) {
        HealingLogger.logHealingFailure(finalEvent);
      }

      return {
        success: false,
        attemptCount: config.maxRetries + 1,
        timeTakenMs: Date.now() - startTime,
        healingPath,
      };
    }
  }
}
