import * as proxyquire from 'proxyquire';
import * as path from 'path';
import { resolve } from 'path';
import { Helpers } from '../helpers';
import pboToolsType = require('../../lib/pbo/pbo-tools');

describe('PboTools', () => {
  let mock: any = {};
  let pboPath: string;
  let pboFolderPath: string;

  beforeEach(() => {
    Helpers.disableLogging();
    mock = {};
    pboFolderPath = resolve('test/testing/atest');
    pboPath = resolve('test/testing/atest.pbo');
  })

  function getPboTools() {
    const ret = <typeof pboToolsType>proxyquire('../../lib/pbo/pbo-tools', mock);
    return ret.PboTools;
  }

  it('calls extractpbo with the pbopath', async (done) => {
    mock.child_process = {
      exec: (command: string, callback: Function) => {
        expect(command).toEqual(`extractpbo -PWS ${pboPath}`);
        callback(null);
      }
    };

    const res = await getPboTools().extractPbo(pboPath);
    expect(res).toEqual(pboFolderPath);
    done();
  });

  it('rejects an error from extractpbo', async (done) => {
    const expectedErr = new Error('test error');
    mock.child_process = {
      exec: (command: string, callback: Function) => {
        expect(command).toEqual(`extractpbo -PWS ${pboPath}`);
        callback(expectedErr);
      }
    };

    try {
      await getPboTools().extractPbo(pboPath)
      fail('should not be reached');
    } catch (err) {
      expect(err).toEqual(expectedErr)
      done();
    }
  });


  it('calls extractpbo with correct parameters', async (done) => {
    mock.fs = {
      access: (folderPath: string, constant: any, callback: Function) => {
        expect(folderPath).toEqual(path.join(pboFolderPath, 'mission.sqm'))
        callback();
      }
    }

    mock.child_process = {
      exec: (command: string) => {
        expect(command).toEqual(`makepbo -WP ${pboFolderPath} bla.pbo`);
        done();
      }
    };

    await getPboTools().lintPboFolder(pboFolderPath);
  });
});
