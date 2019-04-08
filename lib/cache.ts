import { writeFile } from 'fs';
import { resolve } from 'path';
import { LoggerFactory } from './logger';

export interface Cache { [key: string]: null | { [key: string]: string }, autoBan: { [key: string]: string } };

export abstract class AppCache {
  private static log = LoggerFactory.create(AppCache);

  static read(): Cache {
    try {
      return require('../cache.json');
    } catch (e) {
      this.log.warn('Failed to read cache.json file, using empty object', e);
      return { autoBan: {} };
    }
  }

  static write(cache: Cache) {
    writeFile(resolve(__dirname, '..', 'cache.json'), JSON.stringify(cache), e => {
      if (e) this.log.fatal('Failed to write cache file', e);
    });
  }
}
