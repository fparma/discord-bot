import * as SftpClient from 'ssh2-sftp-client';
import * as path from 'path';

export abstract class PboUploader {
  static uploadPbo(pboFilePath: string, wantedUploadName: string, callback: Function) {
    let uploadedAs: string;
    const cwd = String(process.env.FTP_CWD);
    const sftp = new SftpClient();
    sftp.connect({
      host: process.env.FTP_HOST,
      port: Number(process.env.FTP_PORT),
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })
      .then(() => sftp.list(cwd))
      .then(allFiles => {
        const pboFiles = this.getPboNames(allFiles);
        uploadedAs = this.getValidFilename(wantedUploadName, pboFiles);
        if (!uploadedAs.endsWith('.pbo')) uploadedAs += '.pbo';
        return sftp.put(pboFilePath, `${cwd}/${uploadedAs}`);
      })
      .then(() => {
        sftp.end();
        callback(null, { ok: true, uploadedAs });
      })
      .catch(err => {
        sftp.end();
        callback(err);
      });
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
