import { LoggerFactory } from '../lib/logger'

const noop = () => {}
const fakeLog = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  fatal: noop,
}

export abstract class Helpers {
  static disableLogging() {
    return spyOn(LoggerFactory, 'create').and.returnValue(fakeLog)
  }
}
