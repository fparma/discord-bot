import { Logger } from './logger';
import { writeFile } from 'fs';
import { resolve } from 'path';

export abstract class EventsCache {
  private static log = new Logger(EventsCache);

  read(): Promise<{ [key: string]: null }> {
    return new Promise((resolve) => {
      try {
        resolve(require('../cache.json'));
      } catch (e) {
        EventsCache.log.warn('Failed to read cache file', e);
        resolve({});
      }
    });
  }

  write(cache: { [key: string]: null }) {
    writeFile(resolve(__dirname, '..', 'cache.json'), JSON.stringify(cache), e => {
      if (e) EventsCache.log.fatal('Failed to write cache file', e);
    });
  }
}
