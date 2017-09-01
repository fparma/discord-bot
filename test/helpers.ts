import { LoggerFactory } from '../lib/logger';

const noop = () => {}
const fakeLog = LoggerFactory.create('fakeLog');
for (const i in fakeLog) {
  (fakeLog as any)[i] = noop;
}

export abstract class Helpers {
  static disableLogging() {
    return spyOn(LoggerFactory, 'create').and.returnValue(fakeLog);
  }
}

