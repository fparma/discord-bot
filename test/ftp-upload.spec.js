'use strict';
const test = require('tape');
const proxyquire = require('proxyquire');
const path = require('path');

test('uploadPbo', t => {
  t.plan(4);
  const pboFile = path.join(__dirname, 'test.pbo');
  let files = [
    {type: '-', name: 'test1.pbo'},
    {type: '-', name: 'test_v1.pbo'},
    {type: '-', name: 'tesT.pbo'},
    {type: '-', name: 'tESt_v2.pbo'},
    {type: '-', name: 'test_v3.txt'}
  ];

  function SftpMock() {
  }
  SftpMock.prototype.connect = () => Promise.resolve();
  SftpMock.prototype.list = () => Promise.resolve(files);
  SftpMock.prototype.put = () => Promise.resolve();
  SftpMock.prototype.end = () => Promise.resolve();
  const stub = {'ssh2-sftp-client': SftpMock};
  const {uploadPbo} = proxyquire.noCallThru().load('../lib/ftp-upload', stub);

  const wanted = 'test.pbo';
  const expected = 'test_v3.pbo';
  uploadPbo({workDir: __dirname}, pboFile, wanted, (e, res) => {
    t.error(e, 'no error')
    t.ok(res.ok, 'was ok');
    t.equals(res.uploadedAs, expected, 'figured out new file name');
  });

  SftpMock.prototype.connect = () => Promise.reject(new Error('fail'));
  uploadPbo({workDir: __dirname}, pboFile, wanted, (e, res) => {
    t.ok(e, 'failed to connect');
  });
});
