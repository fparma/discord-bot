import { unlink } from 'fs';
import { basename, join } from 'path';
import { Message } from 'discord.js';
import * as rimraf from 'rimraf';
import * as sanitizeFilename from 'sanitize-filename';
import { Command } from './command';
import * as Messages from '../messages';
import { Database } from './../database';
import { LoggerFactory } from '../logger';
import { PboDownloader } from '../pbo/pbo-downloader';
import { PBO_STATES } from '../pbo/pbo-states-enum';

export class UploadCommand implements Command {
  private log = LoggerFactory.create(UploadCommand);
  readonly type = '!upload';
  readonly usageInfo = 'Uploads a pbo to the server. Usage: !upload (repo) (url) (optional: wanted pbo name. MUST INCLUDE WORLD). Example: !upload main http://www.dl.com/test.pbo tvt30_terry.tanoa';
  readonly rateLimit = 20;

  constructor(public readonly tempFolder: string) {
  }

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    const [repo, url, wantedName] = arg.split(' ').map((v = '') => v.trim());
    const sanitizedName = UploadCommand.sanitizePboName(url, wantedName);
    this.log.info(`url: ${url}, repo: ${repo}, wanted name: ${wantedName}, sanitized: ${sanitizedName}`);

    const validateMessage = UploadCommand.validate(url, repo, sanitizedName);
    if (validateMessage != null) {
      this.log.info('Upload validation failed', url, 'reason:', validateMessage);
      sendReply(validateMessage);
      return;
    }

    const goodEnoughRandom = `${Date.now()}.${Math.random()}`.replace(/\./g, '_');
    const pboFolder = join(this.tempFolder, `${sanitizedName}_${goodEnoughRandom}`);
    const pboPath = `${pboFolder}.pbo`;

    message.channel.startTyping();
    const done = (reply: string) => {
      message.channel.stopTyping();
      unlink(pboPath, err => err && err.code != 'ENOENT' && this.log.warn('Error unlinking pbo', pboPath, err));
      rimraf(pboFolder, { glob: false }, err => err && this.log.warn('Error removing pbo folder', pboFolder, err));
      sendReply(reply);
    }

    const downloadState = await UploadCommand.download(url, pboPath);
    this.log.debug('Download state after downloading:', downloadState);
    if (downloadState !== PBO_STATES.DOWNLOAD_OK) {
      return done(Messages.pboStateToReply(downloadState));
    }

  }

  static async download(url: string, pboPath: string) {
    const status = await PboDownloader.verifyHeaders(url);
    if (status !== PBO_STATES.DOWNLOAD_HEADERS_OK) return status;
    return PboDownloader.download(url, pboPath)
  }

  private static sanitizePboName(url: string, wantedName: string) {
    let name;
    if (wantedName) {
      name = wantedName.slice(0, this.indexOfPbo(wantedName));
    } else {
      const file = basename(url);
      name = file.slice(0, this.indexOfPbo(file));
    }
    return sanitizeFilename(name).toLowerCase();
  }

  private static indexOfPbo(str: string) {
    const idx = str.indexOf('.pbo');
    return idx === -1 ? str.length : idx;
  }

  private static validate(url: string, repo: string, name: string) {
    if (!PboDownloader.checkUrl(url)) {
      return Messages.UPLOAD_VALIDATION_INVALID_URL;
    }

    const repos: string[] = `${process.env.FTP_REPOS}`.split(',');
    if (!repos.includes(repo)) {
      return Messages.UPLOAD_VALIDATION_INVALID_REPO(repos);
    }

    if (name.length < 5) {
      return Messages.UPLOAD_VALIDATION_LONGER_NAME;
    }

    if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9-_]+$/.test(name)) {
      return Messages.UPLOAD_VALIDATION_PROVIDE_WORLD;
    }
    return null;
  }
}
