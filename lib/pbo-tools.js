'use strict';
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const DIR_VENDOR = path.join(__dirname, 'vendor');

/**
 * Extracts a pbo
 * @param pboFilePath
 * @param callback
 */
exports.extractPbo = (pboFilePath, callback) => {
  const command = `extractpbo -PWS ${pboFilePath}`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (err) return callback(err);
    const folder = path.resolve(pboFilePath.slice(0, pboFilePath.lastIndexOf('.pbo')));
    callback(null, {ok: true, folder});
  });
};

/**
 * Lints an extracted pbo folder
 * @param folderPath
 * @param callback
 */
exports.lintPboFolder = (folderPath, callback) => {
  // the bla.pbo is just to stop makepbo from deleting the actual pbo we want to upload
  fs.access(path.join(folderPath, 'mission.sqm'), fs.constants.R_OK, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(null, {ok: false, message: 'Failure, pbo seems to be missing a mission.sqm'});
      }
      return callback(err);
    }

    const command = `makepbo -PQN ${folderPath} bla.pbo`;
    child_process.exec(command, (err, stdout, stderr) => {
      if (!err) return callback(null, {ok: true});

      const lintMessages = getLintErrors(err, stdout, folderPath);
      if (lintMessages) return callback(null, {ok: false, message: lintMessages});

      const msg = [folderPath, stdout, stderr].join(' - ');
      return callback(new Error(`Makepbo fail CODE:${err.code} ${msg}`));
    });
  });
};

//The linter exits wih 87 for lint errors. Either return that or a new err
function getLintErrors(err, stdout, folderPath) {
  if (err.code !== 87) return null;
  const errors = stdout.split(/\r?\n/)
    .filter(str => str.includes(folderPath))
    .map(str => removePathFromLintError(str, folderPath))
    .join('\n');
  return `Failed, lint check: ${errors}`;
}

function removePathFromLintError(str, folderPath) {
  return str.replace(folderPath, '').trim()
}
