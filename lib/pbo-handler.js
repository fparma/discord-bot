'use strict';
const fs = require('fs');
const path = require('path');

const rimraf = require('rimraf');
const sanitizeFilename = require('sanitize-filename');

const downloader = require('./downloader');
const uploader = require('./ftp-upload');
const tools = require('./pbo-tools');

function noop() {
}

const TEMP_FOLDER = path.resolve(__dirname, '..', 'tmp');
fs.mkdir(TEMP_FOLDER, e => {
  if (e.code !== 'EEXIST') throw e;
});

function indexOfDot(str) {
  const idx = str.indexOf('.');
  return idx === -1 ? str.length : idx;
}

function getValidName(url, wantedName) {
  let ret;
  if (wantedName) {
    ret = wantedName.slice(0, indexOfDot(wantedName));
  } else {
    const name = path.basename(url);
    ret = name.slice(0, indexOfDot(name));
  }
  return sanitizeFilename(ret);
}

exports.upload = (url = '', wantedName = '', cb) => {
  url = url.trim();
  wantedName = getValidName(url, wantedName.trim());

  if (wantedName.length < 5) {
    return cb(null, 'Please provide a longer name (min 6 chars)');
  }

  if (!downloader.verifyUrl(url)) {
    return cb(null, 'Failed, bad URL. Must be a direct link to a .pbo');
  }

  const goodEnoughRandom = `${Date.now()}.${Math.random()}`.replace(/\./g, '_');
  const pboFolder = path.join(TEMP_FOLDER, `${wantedName}_${goodEnoughRandom}`);
  const pboPath = `${pboFolder}.pbo`;

  function done(err, status) {
    fs.unlink(pboPath, noop);
    rimraf(pboFolder, {glob: false}, noop);
    cb(err ? err : null, err ? null : status ? status.message : null);
  }

  // god help me
  downloader.verifyHeaders(url, (err, status) => {
    if (err || !status.ok) return done(err, status);

    downloader.downloadPboFile(url, pboPath, (err, status) => {
      if (err || !status.ok) return done(err, status);

      tools.extractPbo(pboPath, (err, status) => {
        if (err || !status.ok) return done(err, status);

        tools.lintPboFolder(pboFolder, (err, status) => {
          if (err || !status.ok) return done(err, status);

          const ftpOpts = {};
          uploader.uploadPbo(ftpOpts, pboPath, wantedName, (err, status) => {
            if (err || !status.ok) return done(err, status);
            done(null, {message: `Done. Uploaded as ${status.uploadedAs}`});
          });
        });
      });
    });
  });
};
