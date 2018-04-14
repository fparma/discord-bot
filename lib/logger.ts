enum Level {
  OFF, DEBUG, INFO, WARN, ERROR, FATAL
}

/**
 * Super simple logger, use unix pipe and logrotate to save to file
 */
class Logger {
  level: Level;
  private name: string;

  constructor(fn: Function, level: Level = -1) {
    this.name = fn.name;
    const env = process.env.NODE_ENV || 'development';
    this.level = level !== -1 ? level : env === 'production' ? Level.INFO : Level.DEBUG;
  }

  private canLog(level: Level) {
    return level >= this.level && this.level != Level.OFF;
  }

  private details(type: string): string {
    return `[${new Date().toISOString()}] ${type.toUpperCase()} [${this.name}]:`;
  }

  debug(...args: any[]): void {
    if (!this.canLog(Level.DEBUG)) return;
    args.unshift(this.details('debug'));
    console.debug.apply(console, args);
  }

  info(...args: any[]): void {
    if (!this.canLog(Level.INFO)) return;
    args.unshift(this.details('info'));
    console.info.apply(console, args);
  }

  warn(...args: any[]): void {
    if (!this.canLog(Level.WARN)) return;
    args.unshift(this.details('warn'));
    console.warn.apply(console, args);
  }

  error(...args: any[]): void {
    if (!this.canLog(Level.INFO)) return;
    args.unshift(this.details('error'));
    console.error.apply(console, args);
  }

  fatal(...args: any[]): void {
    args.unshift(this.details('fatal'));
    console.error.apply(console, args);
  }
}

export class LoggerFactory {
  static create(fn: Function, level: Level = -1): Logger {
    return new Logger(fn, level);
  }
}
