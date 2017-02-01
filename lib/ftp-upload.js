'use strict';
const SftpClient = require('ssh2-sftp-client');
const path = require('path');

function getValidFilename(wantedName, fileNames) {
  const wantedLower = path.basename(wantedName.toLowerCase(), '.pbo');
  const matches = fileNames.map(v => path.basename(v.toLowerCase(), '.pbo'))
    .filter(v => v.startsWith(wantedLower));

  let i = 0;
  let ret = wantedLower;
  while (matches.includes(ret)) {
    ret = `${wantedLower}_v${++i}`;
  }
  return ret;
}

function getPboNames(files) {
  return files
    .filter(v => v.type === '-' && v.name.endsWith('.pbo'))
    .map(v => v.name);
}

exports.uploadPbo = (ftpOptions, pboFilepath, wantedUploadName, callback) => {
  let uploadedAs;
  const sftp = new SftpClient();
  sftp.connect({
    host: ftpOptions.host,
    user: ftpOptions.user,
    password: ftpOptions.password
  })
    .then(() => sftp.list(ftpOptions.workDir))
    .then(allFiles => {
      const pboFiles = getPboNames(allFiles);
      uploadedAs = getValidFilename(wantedUploadName, pboFiles);

      if (!uploadedAs.endsWith('.pbo')) uploadedAs += '.pbo';
      return sftp.put(pboFilepath, path.join(ftpOptions.workDir, uploadedAs))
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
