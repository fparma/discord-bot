'use strict';
const test = require('tape');
const proxyquire = require('proxyquire');
const EventEmitter = require('events');
const path = require('path');

const validUrl = 'http://test.pbo';
const validFile = path.join(__dirname, 'test.pbo');
function noop () {
}

test('verifyUrl', t => {
  const {verifyUrl} = require('../lib/downloader');
  t.equals(typeof verifyUrl, 'function', 'is function');

  t.false(verifyUrl(null), 'null is invalid');
  t.false(verifyUrl('asd'), 'not an url');
  t.false(verifyUrl('http://test'), 'fail if missing .pbo');
  t.ok(verifyUrl('http://test.pbo'), 'http ok');
  t.ok(verifyUrl('https://test.pbo'), 'https ok');

  t.end();
});

test('verifyHeaders', t => {
  const stub = {needle: {head: null}};
  const {verifyHeaders} = proxyquire.noCallThru().load('../lib/downloader', stub);
  t.equals(typeof verifyHeaders, 'function', 'is function');

  const err = new Error('fail');
  stub.needle.head = (url, cb) => cb(err);
  verifyHeaders(validUrl, e => t.equals(e, err, 'callback with err from needle'));

  stub.needle.head = (url, cb) => cb(null, {statusCode: 400});
  verifyHeaders(validUrl, (e, res) => {
    t.error(e, 'no error');
    t.false(res.ok, 'response not ok');
    t.ok(res.message.includes('400'), 'replies with bad statuscode')
  });

  const response = {statusCode: 200, headers: {}};
  stub.needle.head = (url, cb) => cb(null, response);
  verifyHeaders(validUrl, (e, res) => {
    t.error(e, 'no error');
    t.false(res.ok, 'response not ok');
    t.ok(res.message.includes('file size'), 'rejects when missing content-length')
  });

  response.headers['content-length'] = 1e32;
  verifyHeaders(validUrl, (e, res) => {
    t.error(e, 'no error');
    t.false(res.ok, 'response not ok');
    t.ok(res.message.includes('too big'), 'rejects when too big content-length')
  });

  response.headers['content-length'] = 1;
  verifyHeaders(validUrl, (e, res) => {
    t.error(e, 'no error');
    t.ok(res.ok, 'headers were ok');
  });

  t.end();
});


function getDownloadStubs (t) {
  const evt = new EventEmitter();
  evt.pipe = noop;
  evt.request = {abort: t.fail};

  const stub = {
    fs: {createWriteStream: noop},
    needle: {get: () => evt}
  };

  return {evt, stub};
}

test('downloadPboFile - error on file too large', t => {
  t.plan(3);
  const {stub, evt}= getDownloadStubs(t);
  evt.request = {abort: () => t.ok(true, 'calls abort')};
  evt.read = () => {
    // any better ideas?
    if (Math.random() > 0.9) return {length: 1E10};
    return null;
  };

  let rejected = false;
  const handle = setInterval(() => {
    if (!rejected) return evt.emit('readable');
    clearInterval(handle);
  });

  const {downloadPboFile} = proxyquire.noCallThru().load('../lib/downloader', stub);
  downloadPboFile(validUrl, validFile, (e, res) => {
    rejected = true;
    t.error(e, 'no error');
    t.ok(res.message.includes('too big'), 'file is too big error');
  });

});

test('downloadPboFile - rejects on needle error', t => {
  t.plan(1);
  const {stub, evt}= getDownloadStubs(t);
  const {downloadPboFile} = proxyquire.noCallThru().load('../lib/downloader', stub);

  const err = new Error('test');
  downloadPboFile(validUrl, validFile, (e, res) => {
    t.equals(e, err, 'callback with needle error')
  });

  process.nextTick(() => evt.emit('end', err));
});


test('downloadPboFile - end event with no error means done', t => {
  t.plan(3);
  const {stub, evt}= getDownloadStubs(t);
  const {downloadPboFile} = proxyquire.noCallThru().load('../lib/downloader', stub);

  stub.fs.createWriteStream = file => t.equals(file, validFile, 'file given to fs');

  downloadPboFile(validUrl, validFile, (e, res) => {
    t.error(e, 'no error');
    t.ok(res.ok, 'downloaded successfully')
  });

  process.nextTick(() => evt.emit('end', null));
});
