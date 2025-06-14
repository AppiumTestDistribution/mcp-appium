import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import createSession from './create-session.js';
import createCloudSession from './create-cloud-session.js';
import uploadApp from './upload-app.js';
import generateLocators from './locators.js';
import selectPlatform from './select-platform.js';
import generateTest from './generate-tests.js';
import findElement from './interactions/find.js';
import clickElement from './interactions/click.js';
import setValue from './interactions/setValue.js';
import getText from './interactions/getText.js';
import screenshot from './interactions/screenshot.js';

export default function registerTools(server: FastMCP): void {
  selectPlatform(server);
  createSession(server);
  createCloudSession(server);
  uploadApp(server);
  generateLocators(server);

  findElement(server);
  clickElement(server);
  setValue(server);
  getText(server);
  screenshot(server);

  generateTest(server);
  console.log('All tools registered');
}
