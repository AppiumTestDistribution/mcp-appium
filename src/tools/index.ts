import createSession from './create-session.js';
import generateLocators from './locators.js';
import selectPlatform from './select-platform.js';

export default function registerTools(server: any): void {
  selectPlatform(server);
  createSession(server);
  generateLocators(server);
  console.log('All tools registered');
}
