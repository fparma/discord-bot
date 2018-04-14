import * as SftpClient from 'ssh2-sftp-client';
import * as path from 'path';
import { LoggerFactory } from '../logger';

export abstract class PboUploader {
  private static log = LoggerFactory.create(PboUploader);

  static async uploadPbo(repo: string, pboFilePath: string, wantedUploadName: string) {
    const sftp = await PboUploader.getConnection();
    
    // can't use path.join, must be forwardslash
    const ftpRepoFolder = `${String(process.env.FTP_CWD_REPOS)}/${repo}/mpmissions`;
    
    this.log.debug('Using folder', ftpRepoFolder);
    const list = await sftp.list(ftpRepoFolder);
    const files = this.getPboNames(list);
    const finalUploadName = this.getValidFilename(wantedUploadName, files);
    
    const lastDeploy = await this.getLastDeploy(sftp);
    const targetRepoFolder = `${ftpRepoFolder}/${finalUploadName}`;
    this.log.info(`Uploading ${pboFilePath} to ${targetRepoFolder}`);
    await sftp.put(pboFilePath, targetRepoFolder);

    if (repo === lastDeploy) {
      const targetServerFolder = `${String(process.env.FTP_CWD_SERVER_MISSIONS)}/${finalUploadName}`;
      this.log.info(`Uploading ${pboFilePath} to ${targetServerFolder}`);
      await sftp.put(pboFilePath, targetServerFolder);
    }

    await sftp.end();
    return finalUploadName;
  }
  
  private static async getConnection() {
    const sftp = new SftpClient();

    try {
      await sftp.connect({
        host: process.env.FTP_HOST,
        port: Number(process.env.FTP_PORT),
        username: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD
      });
      return sftp;
    } catch (err) {
      sftp.end();
      this.log.error('Connection error', err);
      throw err;
    }
  }

  private static async getLastDeploy(sftp: SftpClient.Client) {
    const stream = await sftp.get(String(process.env.FTP_DEPLOYED_REPO_INFO));

    return new Promise((resolve, reject) => {
      let str = '';
      stream.on('data', chunck => str += chunck.toString());
      stream.on('error', err => stream.emit('end', err));
      stream.on('end', err => {
        if (err) {
          this.log.error('Failed to download last deploy info');
          return reject(err);
        } 
        return resolve(str);
      });
    })
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
    if (!ret.endsWith('.pbo')) ret += '.pbo';
    return ret;
  }

  private static appendVersion(filename: string, version: string) {
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex == -1) return filename + version;
    else return filename.substring(0, dotIndex) + version + filename.substring(dotIndex);
  }
}
