import { FastMCP } from 'fastmcp';
import registerTools from './tools/index.js';
import registerResources from './resources/index.js';

const server = new FastMCP({
  name: 'Jarvis Appium',
  version: '1.0.0',
  instructions:
    'Intelligent MCP server providing AI assistants with powerful tools and resources for Appium mobile automation',
});

registerResources(server);
registerTools(server);
export default server;
