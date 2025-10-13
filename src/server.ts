import { FastMCP } from 'fastmcp';
import registerTools from './tools/index.js';
import registerResources from './resources/index.js';
import { hasActiveSession, safeDeleteSession } from './tools/sessionStore.js';

const server = new FastMCP({
  name: 'Jarvis Appium',
  version: '1.0.0',
  instructions:
    'Intelligent MCP server providing AI assistants with powerful tools and resources for Appium mobile automation',
});

registerResources(server);
registerTools(server);

// Handle client connection and disconnection events
server.on('connect', event => {
  console.log('Client connected:', event.session);
});

server.on('disconnect', async event => {
  console.log('Client disconnected:', event.session);
  // Only try to clean up if there's an active session
  if (hasActiveSession()) {
    try {
      console.log('Active session detected on disconnect, cleaning up...');
      const deleted = await safeDeleteSession();
      if (deleted) {
        console.log('Session cleaned up successfully on disconnect.');
      }
    } catch (error) {
      console.error('Error cleaning up session on disconnect:', error);
    }
  } else {
    console.log('No active session to clean up on disconnect.');
  }
});

export default server;
