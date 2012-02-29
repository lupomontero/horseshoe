global.util = require('util'),
global.path = require('path'),
global.fs = require('fs'),
global.vows = require('vows'),
global.assert = require('assert'),
global.nodemailer = require('nodemailer'),
global.Horseshoe = require(__dirname + '/../lib/horseshoe').Horseshoe;
global.configFile = __dirname + '/../config.json';

if (process.argv.indexOf('--live') >= 0) {
  // This assumes you have a file with horseshoe options in json format called
  // config.json in the directory above this script. This config file IS NOT
  // included in the repo so you should create your own.
  if (!path.existsSync(configFile)) {
    console.error('Config file required for live tests!');
    return process.exit(1);
  }

  try {
    global.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (er) {
    console.error(er);
    return process.exit(1);
  }

  global.config.nodemailer = global.nodemailer;

} else {
  global.nodemailer = require(__dirname + '/mock-nodemailer');
  // if running tests with mock nodemailer we still need some dummy config data
  global.config = {
    sender: "Someone <someone@somewhere.com>",
    transport: "smtp",
    host: "mail.somewhere.com",
    port: 587,
    use_authentication: true,
    user: "someone@somewhere.com",
    pass: "somepassword",
    nodemailer: global.nodemailer
  };
}
