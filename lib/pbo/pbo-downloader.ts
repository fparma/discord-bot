import * as needle from 'needle';
import { createWriteStream } from 'fs';
import { IncomingMessage } from 'http';
import { LoggerFactory } from '../logger';

export enum DownloadState {
  BAD_HEADERS, BAD_HOST, BAD_STATUS_CODE, UNKNOWN_CONTENT_LENGTH, FILE_TOO_LARGE, OK
}

export class PboDownloader {
  private log = LoggerFactory.create(PboDownloader);
  private static MAX_FILESIZE = 10485760; // 10mb
  constructor(private url: string) {
  }

  checkUrl(): boolean {
    return new RegExp('^https?://').test(this.url) && this.url.endsWith('.pbo');
  }

  async verifyHeaders(): Promise<DownloadState> {
    try {
      const headers = await PboDownloader.getHeaders(this.url);
      return PboDownloader.verifyHeaderResponse(headers as IncomingMessage);
    } catch (err) {
      if (err) this.log.error('Error getting headers for pbo', err);
      return DownloadState.BAD_HOST;
    }
  }

  async download(filePath: string) {
    let totalSize = 0;
    const stream = needle.get(this.url);

    return new Promise((resolve, reject) => {
      stream.on('readable', () => {
        totalSize += PboDownloader.calculateStreamSize.apply(stream);
        if (totalSize > PboDownloader.MAX_FILESIZE) {
          (stream as any).request.abort();
          return reject(DownloadState.FILE_TOO_LARGE);
        }
      });

      stream.on('end', err => {
        if (err) return reject(DownloadState.BAD_HOST);
        return resolve(DownloadState.OK);
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
      return needle.head(url, (err, response) => {
        if (err) return reject(err)
        resolve(response);
      });
    });
  }
}
