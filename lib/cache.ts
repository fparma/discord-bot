import { LoggerFactory } from './logger';
import { writeFile } from 'fs';
import { resolve } from 'path';

export interface Cache { [key: string]: null };

export abstract class EventsCache {
  private static log = LoggerFactory.create(EventsCache);

  static read(): Cache {
    try {
      return require('../cache.json');
    } catch (e) {
      this.log.warn('Failed to read cache.json file, using empty object', e);
      return {};
    }
  }

  static write(cache: Cache) {
    writeFile(resolve(__dirname, '..', 'cache.json'), JSON.stringify(cache), e => {
      if (e) this.log.fatal('Failed to write cache file', e);
    });
  }
}
