import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface LintError extends Error {
  code: number;
}

export abstract class PboTools {

  static extractPbo(filePath: string): Promise<string> {
    const command = `extractpbo -PWS ${filePath}`;

    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) return reject(err);
        const folder = path.resolve(filePath.slice(0, filePath.lastIndexOf('.pbo')));
        resolve(folder);
      });
    });
  }

  static lintPboFolder(folderPath: string, callback: Function) {
    fs.access(path.join(folderPath, 'mission.sqm'), fs.constants.R_OK, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return callback(null, { ok: false, message: 'Failure, pbo seems to be missing a mission.sqm' });
        }
        return callback(err);
      }

      const command = `makepbo -WP ${folderPath} bla.pbo`;
      exec(command, (err: LintError, stdout, stderr) => {
        if (!err) return callback(null, { ok: true });

        const lintMessages = PboTools.getLintErrors(err, stdout, folderPath);
        if (lintMessages) return callback(null, { ok: false, message: lintMessages });

        const msg = [folderPath, stdout, stderr].join(' - ');
        return callback(new Error(`Makepbo fail CODE:${err.code} ${msg}`));
      });
    });
  }

  private static getLintErrors(err: LintError, stdout: string, folderPath: string) {
    const {code = -1} = err;
    // previously the exit was 87 for lint errors, now it's 17?
    if (![17, 87].includes(code)) return null;
  
    const errors = stdout.split(/\r?\n/)
      .filter(str => str.includes(folderPath))
      .map(str => str.replace(folderPath, '').trim())
      .join('\n');
    return errors;
  }
}
