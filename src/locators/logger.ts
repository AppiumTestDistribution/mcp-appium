import { appendFileSync } from 'node:fs';
import { format as utilFormat } from 'node:util';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE';

class Logger {
  private write(level: LogLevel, ...args: any[]): void {
    const message = utilFormat(...args);
    const logfile = process.env.LOG_FILE;

    if (logfile) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${level} ${message}`;
      try {
        appendFileSync(logfile, logMessage + '\n');
      } catch {
        // Avoid throwing from logger; still print to console below
      }
    }

    // Console output behavior:
    // - Keep prior behavior for info/warn/error/debug
    // - For TRACE, emulate competitor: print to stderr (via console.error)
    switch (level) {
      case 'ERROR':
        console.error(...args);
        break;
      case 'WARN':
        console.warn(...args);
        break;
      case 'DEBUG':
        console.debug(...args);
        break;
      case 'TRACE':
        // Competitor logger writes trace to stderr
        console.error(message);
        break;
      default:
        console.info(...args);
    }
  }

  info(...args: any[]): void {
    this.write('INFO', ...args);
  }

  warn(...args: any[]): void {
    this.write('WARN', ...args);
  }

  error(...args: any[]): void {
    this.write('ERROR', ...args);
  }

  debug(...args: any[]): void {
    this.write('DEBUG', ...args);
  }

  trace(...args: any[]): void {
    this.write('TRACE', ...args);
  }
}

export const log = new Logger();

// For API parity with competitor, also export trace/error functions
export const trace = (message: string) => log.trace(message);
export const error = (message: string) => log.error(message);
