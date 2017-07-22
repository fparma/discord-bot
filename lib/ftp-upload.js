'use strict';
const SftpClient = require('ssh2-sftp-client');
const path = require('path');

function appendVersion(filename, string){
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex == -1) return filename + string;
  else return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
}

function getValidFilename(wantedName, fileNames) {
  const wantedLower = path.basename(wantedName.toLowerCase(), '.pbo');
  const matches = fileNames
    .map(v => path.basename(v.toLowerCase(), '.pbo'))
    .filter(v => v.startsWith(wantedLower.substring(0, wantedLower.lastIndexOf('.'))));

  let i = 0;
  let ret = wantedLower;
  while (matches.includes(ret)) {
    ret = appendVersion(wantedLower, `_v${++i}`);
  }
  return ret;
}

function getPboNames(files) {
  return files
    .filter(v => v.type === '-' && v.name.endsWith('.pbo'))
    .map(v => v.name);
}

exports.uploadPbo = (pboFilepath, wantedUploadName, callback) => {
  let uploadedAs;
  const cwd = process.env.FTP_CWD;
  const sftp = new SftpClient();
  sftp.connect({
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD
  })
    .then(() => sftp.list(cwd))
    .then(allFiles => {
      const pboFiles = getPboNames(allFiles);
      uploadedAs = getValidFilename(wantedUploadName, pboFiles);
      if (!uploadedAs.endsWith('.pbo')) uploadedAs += '.pbo';
      return sftp.put(pboFilepath, `${cwd}/${uploadedAs}`);
    })
    .then(() => {
      sftp.end();
      callback(null, {ok: true, uploadedAs});
    })
    .catch(err => {
      sftp.end();
      callback(err);
    });
};
