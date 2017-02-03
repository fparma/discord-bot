'use strict';
const test = require('tape');
const path = require('path');
const proxyquire = require('proxyquire');
const noop = () => {
};

test('extractPbo', t => {
  t.plan(4);
  const pboFile = path.join(__dirname, 'test_folder.pbo');
  const pboFolder = path.join(__dirname, 'test_folder');

  const err = new Error('test');
  const stub = {child_process: {exec: (path, cb) => cb(err)}};
  const {extractPbo} = proxyquire.noCallThru().load('../lib/pbo-tools', stub);

  extractPbo(pboFile, (e, res) => {
    t.equals(err, e, 'returns error from exec');
  });

  stub.child_process.exec = (path, cb) => cb(null);
  extractPbo(pboFile, (e, res) => {
    t.error(e, 'no error');
    t.ok(res.ok, 'callback is ok');
    t.equals(res.folder, pboFolder, 'provides folder');
  });
});

test('lintPbo', t => {
  const pboFile = path.join(__dirname, 'test_folder.pbo');
  const pboFolder = path.join(__dirname, 'test_folder');

  const stub = {
    child_process: {exec: (cmd, cb) => cb(new Error('test'))},
    fs: {
      constants: {R_OK: null},
      access: (p, c, cb) => cb()
    }
  };
  const {lintPboFolder} = proxyquire.noCallThru().load('../lib/pbo-tools', stub);

  lintPboFolder(pboFolder, (e, res) => {
    t.ok(e instanceof Error, 'callbacks with error');
    t.ok(e.message.includes('Makepbo fail'), 'makepbo failed');
  })

  const err = new Error('Test');
  err.code = 87;
  const stdout = [
    'removed',
    pboFolder + ' lint fail'
  ].join('\n');

  stub.child_process.exec = (p, cb) => cb(err, stdout);
  lintPboFolder(pboFolder, (e, res) => {
    t.error(e, 'no error');
    t.false(res.ok, 'was not ok');
    const msg = res.message;
    t.false(msg.includes('removed'), 'does not print removed');
    t.false(msg.includes(pboFolder), 'path removed');
    t.ok(msg.includes('lint fail'), 'err msg included');
  });

  stub.child_process.exec = cmd => t.equals(cmd, 'makepbo -PQN ' + pboFolder + ' bla.pbo', 'exec called with folder');
  lintPboFolder(pboFolder, (e, res) => {
    t.error(e, 'no error');
    t.ok(res.ok, 'was ok');
  });

  t.end();
});
