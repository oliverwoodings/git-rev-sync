'use strict';

var fs = require('graceful-fs')
var path = require('path')
var childProcess = require('child_process')
var shell = require('shelljs')

var HAS_NATIVE_EXECSYNC = childProcess.hasOwnProperty('spawnSync')
var PATH_SEP = path.sep
var RE_BRANCH = /^ref: refs\/heads\/(.*)\n/

function _command(cmd, args) {
  var result;

  if (HAS_NATIVE_EXECSYNC) {
    result = childProcess.spawnSync(cmd, args);

    if (result.status !== 0) {
      throw new Error('[git-rev-sync] failed to execute command: ' + result.error.code);
    }

    return result.stdout.toString('utf8').replace(/^\s+|\s+$/g, '');
  }

  result = shell.exec(cmd + ' ' + args.join(' '), {silent: true});

  if (result.code !== 0) {
    throw new Error('[git-rev-sync] failed to execute command: ' + result.output);
  }

  return result.output.toString('utf8').replace(/^\s+|\s+$/g, '');
}

function _getGitDirectory(start) {
  start = start || module.parent.filename
  if (typeof start === 'string') {
    start = start.split(PATH_SEP)
  }
  start.pop()
  var testPath = path.resolve(start.join(PATH_SEP), '.git')
  if (fs.existsSync(testPath)) {
    return testPath
  }

  if (!start.length) {
    throw new Error('[git-rev-sync] no git repository found');
  }

  return _getGitDirectory(start)
}

function branch () {
  var gitDir = _getGitDirectory()
  var head = fs.readFileSync(path.resolve(gitDir, 'HEAD'), 'utf8')
  var b = head.match(RE_BRANCH)

  if (b) {
    return b[1]
  }

  return 'Detatched: ' + head.trim()
}

function long() {
  return _command('git', ['rev-parse', 'HEAD']);
}

function short() {
  return long().substr(0, 7)
}

function message() {
  return _command('git', ['log', '-1', '--pretty=%B'])
}

function tag() {
  return _command('git', ['describe', '--always', '--tag', '--abbrev=0']);
}

function log() {
  throw new Error('not implemented')
}

module.exports = {
  branch : branch,
  log : log,
  long : long,
  message : message,
  short : short,
  tag : tag
}
