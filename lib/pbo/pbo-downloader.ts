import * as needle from 'needle';
import { createWriteStream } from 'fs';
import { IncomingMessage } from 'http';
import { LoggerFactory } from '../logger';

export enum DownloadState {
  BAD_HEADERS, BAD_HOST, BAD_STATUS_CODE, FILE_TOO_LARGE, OK
}

export class PboDownloader {
  private static log = LoggerFactory.create(PboDownloader);
  private static MAX_FILESIZE = 10485760; // 10mb
  constructor(private url: string) {
  }

  static checkUrl(url: string): boolean {
    return new RegExp('^https?://').test(url) && url.endsWith('.pbo');
  }

  static async verifyHeaders(url: string): Promise<DownloadState> {
    this.log.debug('Getting headers for url:', url);
    try {
      const headers = await PboDownloader.getHeaders(url);
      return PboDownloader.verifyHeaderResponse(headers as IncomingMessage);
    } catch (err) {
      if (err) this.log.error('Error getting headers for url: ', url, err);
      return DownloadState.BAD_HOST;
    }
  }

  static download(url: string, filePath: string): Promise<DownloadState> {
    this.log.info('Downloading file... ', url);
    return new Promise((resolve, reject) => {
      const stream = needle.get(url);
      let totalSize = 0;

      stream.on('readable', () => {
        totalSize += PboDownloader.calculateStreamSize(stream);
        if (totalSize > PboDownloader.MAX_FILESIZE) {
          this.log.info(`Aborting download for ${url}, file too large`);
          (stream as any).request.abort();
          reject(DownloadState.FILE_TOO_LARGE);
        }
      });

      stream.on('end', err => {
        if (err) {
          this.log.warn('Download interrupted', url, err);
          return reject(DownloadState.BAD_HOST);
        }

        this.log.info(`Download finished for url: ${url}`);
        resolve(DownloadState.OK);
      });
      stream.pipe(createWriteStream(filePath));
    });
  }

  private static calculateStreamSize(stream: NodeJS.ReadableStream) {
    let size = 0;
    let chunck = null;

    while (chunck = stream.read()) {
      size += chunck.length;
    }
    return size;
  }


  private static verifyHeaderResponse(response: IncomingMessage): DownloadState {
    const { statusCode = 500, headers } = response;
    if (+statusCode >= 400) return DownloadState.BAD_HOST;

    const length = headers ? +headers['content-length'] : null;
    if (!length) return DownloadState.BAD_HOST;
    if (length > PboDownloader.MAX_FILESIZE) return DownloadState.FILE_TOO_LARGE;

    return DownloadState.OK;
  }

  private static async getHeaders(url: string) {
    return new Promise((resolve, reject) => {
      needle.head(url, (err, response) => {
        if (err) return reject(err)
        resolve(response);
      });
    });
  }
}
