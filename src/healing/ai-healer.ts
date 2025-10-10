// Using Gemini Flash for AI-powered element locator generation
// Reference: blueprint:javascript_gemini integration
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { LocatorStrategy } from './strategies.js';

// DON'T DELETE THIS COMMENT
// Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AILocatorSuggestion {
  strategy: string;
  selector: string;
  confidence: number;
  reasoning: string;
}

export class AIHealer {
  static async analyzeScreenshotForLocators(
    screenshotBase64: string,
    elementDescription: string,
    platform: 'android' | 'ios'
  ): Promise<AILocatorSuggestion[]> {
    try {
      const imageBuffer = Buffer.from(screenshotBase64, 'base64');
      
      const resizedImage = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const prompt = `You are an expert mobile test automation engineer. Analyze this mobile app screenshot and suggest the best locators to find the element described as: "${elementDescription}"

Platform: ${platform}
Available locator strategies for ${platform}:
${platform === 'android' ? '- id (resource-id)\n- accessibility id (content-desc)\n- xpath\n- class name\n- -android uiautomator' : '- id/name\n- accessibility id\n- xpath\n- -ios predicate string\n- -ios class chain'}

Please provide 3-5 locator suggestions in order of reliability. For each suggestion, provide:
1. strategy: the locator strategy name
2. selector: the actual selector string
3. confidence: a number between 0-1 indicating how confident you are
4. reasoning: why this locator would work

Return your response as JSON array of suggestions.`;

      const contents = [
        {
          inlineData: {
            data: resizedImage.toString('base64'),
            mimeType: 'image/jpeg',
          },
        },
        prompt,
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                strategy: { type: 'string' },
                selector: { type: 'string' },
                confidence: { type: 'number' },
                reasoning: { type: 'string' },
              },
              required: ['strategy', 'selector', 'confidence', 'reasoning'],
            },
          },
        },
        contents: contents,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error('Empty response from Gemini');
      }

      const suggestions: AILocatorSuggestion[] = JSON.parse(rawJson);
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error: any) {
      console.error('AI Healer error:', error);
      return [];
    }
  }

  static async suggestLocatorFromPageSource(
    pageSource: string,
    elementDescription: string,
    platform: 'android' | 'ios'
  ): Promise<AILocatorSuggestion[]> {
    try {
      const truncatedPageSource = pageSource.substring(0, 15000);

      const prompt = `You are an expert mobile test automation engineer. Analyze this mobile app page source XML and suggest the best locators to find the element described as: "${elementDescription}"

Platform: ${platform}
Page Source XML (truncated):
${truncatedPageSource}

Available locator strategies for ${platform}:
${platform === 'android' ? '- id (resource-id)\n- accessibility id (content-desc)\n- xpath\n- class name\n- -android uiautomator' : '- id/name\n- accessibility id\n- xpath\n- -ios predicate string\n- -ios class chain'}

Please provide 3-5 locator suggestions in order of reliability. For each suggestion, provide:
1. strategy: the locator strategy name
2. selector: the actual selector string
3. confidence: a number between 0-1 indicating how confident you are
4. reasoning: why this locator would work based on the XML

Return your response as JSON array of suggestions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                strategy: { type: 'string' },
                selector: { type: 'string' },
                confidence: { type: 'number' },
                reasoning: { type: 'string' },
              },
              required: ['strategy', 'selector', 'confidence', 'reasoning'],
            },
          },
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error('Empty response from Gemini');
      }

      const suggestions: AILocatorSuggestion[] = JSON.parse(rawJson);
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error: any) {
      console.error('AI Healer page source analysis error:', error);
      return [];
    }
  }

  static convertToLocatorStrategy(
    suggestion: AILocatorSuggestion,
    priority: number
  ): LocatorStrategy {
    return {
      strategy: suggestion.strategy,
      selector: suggestion.selector,
      priority,
    };
  }
}
