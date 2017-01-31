'use strict';
const path = require('path');
const exec = require('child_process').exec;
const PLATFORM = require('os').platform();

const DIR_VENDOR = path.join(__dirname, 'vendor');

function getExecutableExtractCommand(filePath) {
  if (/win/.test(PLATFORM)) {
    const command = path.join(DIR_VENDOR, 'ExtractPbo.exe');
    return `${command} -PWS ${filePath}`;
  } else {
    // TOOD: unix
  }
  throw new Error('Unknown platform');
}

/**
 * Extracts a pbo
 * @param pboFilePath
 * @param callback
 */
exports.extractPbo = (pboFilePath, callback) => {
  const command = getExecutableExtractCommand(pboFilePath);
  exec(command, (err, stdout, stderr) => {
    if (err) return callback(err);
    const folder = path.resolve(pboFilePath.slice(0, pboFilePath.lastIndexOf('.pbo')));
    callback(null, {ok: true, folder});
  });
};

function getExecutableLintCommand(folderPath) {
  if (/win/.test(PLATFORM)) {
    const command = path.join(DIR_VENDOR, 'MakePbo.exe');
    return `${command} -PQ ${folderPath}`;
  } else {
    // TODO: unix
  }
  throw new Error('Unknown platform');

}

function removePathFromLintError(str, folderPath) {
  return str.replace(new RegExp(folderPath, 'i'), '').trim();
}

//The linter exits wih 87 for lint errors. Either return that or a new err
function getLintErrors(err, stdout, folderPath) {
  if (err.code === 87) {
    const errors = stdout.split(/\r?\n/)
      .filter(str => str.includes(folderPath))
      .map(str => removePathFromLintError(str, folderPath))
      .join('\n');
    return `Lint check fail:\n${errors}`;
  }
  return null;
}

/**
 * Lints an extracted pbo folder
 * @param folderPath
 * @param callback
 */
exports.lintFolder = (folderPath, callback) => {
  const command = getExecutableLintCommand(folderPath);
  exec(command, (err, stdout, stderr) => {
    if (err) {
      const lintMessages = getLintErrors(err, stdout, folderPath);
      if (lintMessages) return callback(null, {ok: false, message: lintMessages});

      const msg = [folderPath, stdout, stderr].join(' - ');
      return callback(new Error(`Makepbo fail CODE:${err.code} ${msg}`));
    }
    callback(null, {ok: true});
  });
};
