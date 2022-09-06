enum Level {
  OFF = -1,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  FATAL,
}

/**
 * Super simple logger, use unix pipe and logrotate to save to file
 */
class Logger {
  level: Level
  private name: string

  constructor(fn: Function, level: Level) {
    this.name = fn.name
    const env = process.env.NODE_ENV || 'development'
    this.level = level ? level : env === 'production' ? Level.INFO : Level.DEBUG
  }

  private canLog(level: Level) {
    return level >= this.level && this.level != Level.OFF
  }

  private details(type: string): string {
    return `[${new Date().toISOString()}] ${type.toUpperCase()} [${this.name}]:`
  }

  debug(...args: any[]): void {
    if (!this.canLog(Level.DEBUG)) return
    const toLog = [...args]
    toLog.unshift(this.details('debug'))
    console.debug.apply(console, toLog)
  }

  info(...args: any[]): void {
    if (!this.canLog(Level.INFO)) return
    const toLog = [...args]
    toLog.unshift(this.details('info'))
    console.info.apply(console, toLog)
  }

  warn(...args: any[]): void {
    if (!this.canLog(Level.WARN)) return
    const toLog = [...args]
    toLog.unshift(this.details('warn'))
    console.warn.apply(console, toLog)
  }

  error(...args: any[]): void {
    const toLog = [...args]
    toLog.unshift(this.details('error'))
    console.error.apply(console, toLog)
  }

  fatal(...args: any[]): void {
    const toLog = [...args]
    toLog.unshift(this.details('fatal'))
    console.error.apply(console, toLog)
  }
}

export class LoggerFactory {
  static create(fn: Function, level: Level = -1): Logger {
    return new Logger(fn, level)
  }
}
