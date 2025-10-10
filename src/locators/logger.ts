class Logger {
  info(...args: any[]): void {
    console.info(...args);
  }

  warn(...args: any[]): void {
    console.warn(...args);
  }

  error(...args: any[]): void {
    console.error(...args);
  }
}

export const log = new Logger();
