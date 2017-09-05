import * as SftpClient from 'ssh2-sftp-client';
import * as path from 'path';
import { LoggerFactory } from '../logger';

export abstract class PboUploader {
  private static log = LoggerFactory.create(PboUploader);

  static async uploadPbo(pboFilePath: string, wantedUploadName: string, callback: Function) {
    let finalUploadName: string;
    const cwd = String(process.env.FTP_CWD);
    const sftp = new SftpClient();

    try {
      await sftp.connect({
        host: process.env.FTP_HOST,
        port: Number(process.env.FTP_PORT),
        username: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD
      })

      const list = await sftp.list(cwd);
      const files = this.getPboNames(list);
      finalUploadName = this.getValidFilename(wantedUploadName, files);
      if (!finalUploadName.endsWith('.pbo')) finalUploadName += '.pbo';

      await sftp.put(pboFilePath, `${cwd}/${finalUploadName}`);
      await sftp.end();
      return finalUploadName;
    } catch (err) {
      sftp.end();
      this.log.error('Error during upload of ', pboFilePath, err);
      return null;
    }

  }

  private static getPboNames(files: SftpClient.FileInfo[]) {
    return files
      .filter(v => v.type === '-' && v.name.endsWith('.pbo'))
      .map(v => v.name);
  }

  private static getValidFilename(wantedName: string, fileNames: string[]) {
    const wantedLower = path.basename(wantedName.toLowerCase(), '.pbo');
    const matches = fileNames
      .map(v => path.basename(v.toLowerCase(), '.pbo'))
      .filter(v => v.startsWith(wantedLower.substring(0, wantedLower.lastIndexOf('.'))));

    let i = 0;
    let ret = wantedLower;
    while (matches.includes(ret)) {
      ret = this.appendVersion(wantedLower, `_v${++i}`);
    }
    return ret;
  }

  private static appendVersion(filename: string, version: string) {
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex == -1) return filename + version;
    else return filename.substring(0, dotIndex) + version + filename.substring(dotIndex);
  }
}
