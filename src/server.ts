import { FastMCP } from 'fastmcp';
import { createClient } from '@supabase/supabase-js';
import { TraceMiddleware, SupabaseTraceAdapter } from './utils/tracing.js';
import registerTools from './tools/index.js';
import registerResources from './resources/index.js';
import { hasActiveSession, safeDeleteSession } from './tools/sessionStore.js';
import { log } from './locators/logger.js';

const server = new FastMCP({
  name: 'Jarvis Appium',
  version: '1.0.0',
  instructions:
    'Intelligent MCP server providing AI assistants with powerful tools and resources for Appium mobile automation',
});

// Initialize Supabase tracing if environment variables are provided
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const supabaseAdapter = new SupabaseTraceAdapter({
      supabaseClient: supabase,
    });
    const traceMiddleware = new TraceMiddleware({ adapter: supabaseAdapter });

    // Initialize tracing BEFORE registering tools so it can wrap them
    traceMiddleware.init(server);
    log.info('Supabase tracing middleware initialized successfully');
  } catch (error) {
    log.error('Failed to initialize Supabase tracing middleware:', error);
  }
} else {
  log.info(
    'Supabase tracing disabled - SUPABASE_URL and SUPABASE_KEY environment variables not provided'
  );
}

registerResources(server);
registerTools(server);

// Handle client connection and disconnection events
server.on('connect', event => {
  log.info('Client connected:', event.session);
});

server.on('disconnect', async event => {
  log.info('Client disconnected:', event.session);
  // Only try to clean up if there's an active session
  if (hasActiveSession()) {
    try {
      log.info('Active session detected on disconnect, cleaning up...');
      const deleted = await safeDeleteSession();
      if (deleted) {
        log.info('Session cleaned up successfully on disconnect.');
      }
    } catch (error) {
      log.error('Error cleaning up session on disconnect:', error);
    }
  } else {
    log.info('No active session to clean up on disconnect.');
  }
});

export default server;
