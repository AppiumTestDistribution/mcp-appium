import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { log } from '../locators/logger.js';

export interface TraceEvent {
  timestamp: string;
  type: string;
  method?: string;
  session_id: string;
  client_id?: string;
  duration?: number;
  entity_name?: string;
  arguments?: any;
  response?: any;
  error?: string;
}

export class SupabaseTraceAdapter {
  private supabase: SupabaseClient;
  private enabled: boolean = false;

  constructor({ supabaseClient }: { supabaseClient: SupabaseClient }) {
    this.supabase = supabaseClient;
    this.enabled = true;
  }

  async logTrace(event: TraceEvent): Promise<void> {
    if (!this.enabled) return;

    try {
      const { error } = await this.supabase
        .from('trace_events')
        .insert([event]);

      if (error) {
        log.error('Failed to log trace event:', error);
      }
    } catch (err) {
      log.error('Error logging trace event:', err);
    }
  }

  disable(): void {
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }
}

export class TraceMiddleware {
  private adapter: SupabaseTraceAdapter;
  private server: any;

  constructor({ adapter }: { adapter: SupabaseTraceAdapter }) {
    this.adapter = adapter;
  }

  init(server: any): void {
    this.server = server;
    this.setupToolWrapping();
    log.info('Trace middleware initialized');
  }

  private setupToolWrapping(): void {
    if (!this.server) return;

    // Wrap the addTool method to inject tracing
    const originalAddTool = (this.server as any).addTool?.bind(this.server);
    if (originalAddTool) {
      (this.server as any).addTool = (toolDef: any) => {
        const toolName = toolDef?.name ?? 'unknown_tool';
        const originalExecute = toolDef?.execute;

        if (typeof originalExecute !== 'function') {
          return originalAddTool(toolDef);
        }

        // Wrap the execute function with tracing
        toolDef.execute = async (...args: any[]) => {
          const startTime = Date.now();
          const sessionId = this.generateSessionId();

          try {
            // Log tool call
            await this.adapter.logTrace({
              timestamp: new Date().toISOString(),
              type: 'tool_call',
              method: 'execute',
              session_id: sessionId,
              entity_name: toolName,
              arguments: args.length > 0 ? args[0] : {},
            });

            // Execute the original function
            const result = await originalExecute(...args);

            // Log tool response
            await this.adapter.logTrace({
              timestamp: new Date().toISOString(),
              type: 'tool_response',
              method: 'execute',
              session_id: sessionId,
              entity_name: toolName,
              duration: Date.now() - startTime,
              response: result,
            });

            return result;
          } catch (error: any) {
            // Log error
            await this.adapter.logTrace({
              timestamp: new Date().toISOString(),
              type: 'error',
              method: 'execute',
              session_id: sessionId,
              entity_name: toolName,
              duration: Date.now() - startTime,
              error: error?.message || 'Unknown error',
            });

            throw error;
          }
        };

        return originalAddTool(toolDef);
      };
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
