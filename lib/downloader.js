'use strict';
const fs = require('fs');
const needle = require('needle');

const MAX_FILE_SIZE = 10485760; // 10mb
const MSG = {
  BAD_STATUS_CODE: 'Bad status code from server: ',
  UNKNOWN_SIZE: 'Unknown file size, use a better host',
  FILE_TOO_LARGE: `File is too big (max ${MAX_FILE_SIZE / 1024 / 1024}mb)`,
};

/**
 * cheap url verification
 * @param url
 * @returns {boolean}
 */
exports.verifyUrl = url => {
  return new RegExp('^https?://').test(url) && url.endsWith('.pbo');
};

function getHeaders(url, callback) {
  needle.head(url, (e, response) => {
    callback(e ? e : null, response);
  });
}

function verifyResponse(response) {
  const {statusCode, headers} = response;
  if (+statusCode >= 400) return MSG.BAD_STATUS_CODE + statusCode;

  let contentLength = headers ? headers['content-length'] : null;
  if (!contentLength) return MSG.UNKNOWN_SIZE;

  contentLength = +contentLength;
  if (contentLength > MAX_FILE_SIZE) return MSG.FILE_TOO_LARGE;
  return null;
}

/**
 * Verifies a header of file. Check resposne codes etc
 * @param url
 * @param callback
 */
exports.verifyHeaders = (url, callback) => {
  getHeaders(url, (e, response) => {
    if (e) return callback(e);
    const responseProblem = verifyResponse(response);
    if (responseProblem) return callback(null, {ok: false, message: responseProblem});
    callback(null, {ok: true});
  });
};

function getChunckSize() {
  let size = 0, chunck;
  while (chunck = this.read()) {
    size += chunck.length;
  }
  return size;
}

/**
 * Downloads pbo file to local folder
 * @param url
 * @param filePath
 * @param callback
 */
exports.downloadPboFile = (url, filePath, callback) => {
  let totalSize = 0;
  const stream = needle.get(url);

  stream.on('readable', function () {
    totalSize += getChunckSize.apply(this);
    if (totalSize > MAX_FILE_SIZE) {
      stream.request.abort();
      callback(null, {ok: false, message: MSG.FILE_TOO_LARGE});
    }
  });

  stream.on('end', err => {
    if (err) return callback(err);
    callback(null, {ok: true});
  });
  stream.pipe(fs.createWriteStream(filePath));
};
