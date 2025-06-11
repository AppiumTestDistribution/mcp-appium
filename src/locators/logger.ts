class Logger {
  info(...args: any[]): void {
    console.info(...args); // eslint-disable-line no-console
  }

  warn(...args: any[]): void {
    console.warn(...args); // eslint-disable-line no-console
  }

  error(...args: any[]): void {
    console.error(...args); // eslint-disable-line no-console
  }
}

export const log = new Logger();
