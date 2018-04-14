import * as proxyquire from 'proxyquire';
import * as path from 'path';
import { resolve } from 'path';
import { Helpers } from '../helpers';
import { PBO_STATES } from '../../lib/pbo/pbo-states-enum';
import { IncomingMessage, IncomingHttpHeaders } from 'http';
import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';
import pboToolsType = require('../../lib/pbo/pbo-downloader');

type Partial<T> = {
  [K in keyof T]?: T[K];
}

describe('PboDownloader', () => {
  let mock: any = {};
  const pboPath = resolve('test/testing/atest.pbo')
  const pboUrl = 'http://testing/apbo.pbo';

  beforeEach(() => {
    Helpers.disableLogging();
    mock = {};
  })

  function getPboDownloader() {
    const ret = <typeof pboToolsType>proxyquire('../../lib/pbo/pbo-downloader', mock);
    return ret.PboDownloader;
  }

  it('does simple url verification', () => {
    const checkUrl = getPboDownloader().checkUrl;
    expect(checkUrl('')).toEqual(false);
    expect(checkUrl('asd')).toEqual(false);
    expect(checkUrl('http://test')).toEqual(false);
    expect(checkUrl('http://test.pbo')).toEqual(true);
    expect(checkUrl('https://test.pbo')).toEqual(true);
  });

  it('a needle head error is resolved as bad host', async (done) => {
    mock.needle = {
      head: (url: string, callback: Function) => {
        expect(url).toEqual(pboUrl);
        callback(new Error(''));
      }
    };

    const state = await getPboDownloader().verifyHeaders(pboUrl);
    expect(state).toEqual(PBO_STATES.DOWNLOAD_BAD_HOST);
    done();
  });

  it('verifies headers on file', async (done) => {
    const response: Partial<IncomingMessage> = {
      statusCode: 500
    }

    mock.needle = {
      head: (url: string, callback: Function) => {
        expect(url).toEqual(pboUrl);
        callback(null, response);
      },
      get: () => fail('Get should never be called')
    }

    const downloader = getPboDownloader();
    let status = await downloader.verifyHeaders(pboUrl);
    expect(status).toEqual(PBO_STATES.DOWNLOAD_BAD_STATUS_CODE);

    response.statusCode = 200;
    status = await downloader.verifyHeaders(pboUrl);
    expect(status).toEqual(PBO_STATES.DOWNLOAD_BAD_HOST);

    response.headers = {
      'content-length': `${downloader.MAX_FILESIZE + 1}`,
      'content-type': 'text/html'
    };

    status = await downloader.verifyHeaders(pboUrl);
    expect(status).toEqual(PBO_STATES.DOWNLOAD_FILE_TOO_LARGE);

    response.headers['content-length'] = '100';
    status = await downloader.verifyHeaders(pboUrl);
    expect(status).toEqual(PBO_STATES.DOWNLOAD_BAD_HOST);

    response.headers['content-type'] = 'application/octet-stream';
    status = await downloader.verifyHeaders(pboUrl);
    expect(status).toEqual(PBO_STATES.DOWNLOAD_HEADERS_OK);

    done();
  });

  it('aborts a download if size too large', async (done) => {
    const emitter = new EventEmitter();

    mock.needle = {
      head: () => fail('should not be called'),
      get: (url: string) => {
        expect(url).toEqual(pboUrl);
        return emitter;
      }
    }

    mock.fs = {
      createWriteStream: (path: string) => expect(path).toEqual(pboPath)
    }

    const resp = [{ length: getPboDownloader().MAX_FILESIZE + 1 }, { length: 0 }];
    (emitter as any).read = () => {
      return resp.shift();
    }

    let aborted = false;
    (emitter as any).request = {
      abort: () => aborted = true
    }

    let piped = false;
    (emitter as any).pipe = () => {
      piped = true;
      process.nextTick(() => {
        emitter.emit('readable');
      })
    }

    getPboDownloader().download(pboUrl, pboPath).then(status => {
      expect(status).toEqual(PBO_STATES.DOWNLOAD_FILE_TOO_LARGE);
      expect(piped).toEqual(true);
      expect(aborted).toEqual(true);
      done();
    });
  });

  function testErrorAndSuccess(msg: string, emitError: boolean) {
    it(msg, async (done) => {
      const emitter = new EventEmitter();

      mock.needle = {
        head: () => fail('should not be called'),
        get: (url: string) => {
          expect(url).toEqual(pboUrl);
          return emitter;
        }
      }

      mock.fs = {
        createWriteStream: (path: string) => expect(path).toEqual(pboPath)
      }

      const resp = [{ length: 1 }, { length: 0 }];
      (emitter as any).read = () => {
        return resp.shift();
      }

      let aborted = false;
      (emitter as any).request = {
        abort: () => aborted = true
      }

      let piped = false;
      (emitter as any).pipe = () => {
        piped = true;
        emitter.emit('readable');
      }

      resp.push({ length: 1 }, { length: 0 });
      getPboDownloader().download(pboUrl, pboPath).then((status) => {
        expect(status).toEqual(emitError ? PBO_STATES.DOWNLOAD_BAD_HOST: PBO_STATES.DOWNLOAD_OK);
        expect(aborted).toEqual(false);
        expect(piped).toEqual(true);
        done();
      });

      process.nextTick(() => {
        emitter.emit('end', emitError ? new Error(''): null);
      });
    });
  }
  
  testErrorAndSuccess('it fails when end event emits error', true);
  testErrorAndSuccess('it succeeds when end has no error', false);
});

