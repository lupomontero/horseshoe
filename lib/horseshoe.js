/*jslint indent: 2, nomen: true, plusplus: true, sloppy: true, stupid: true */

// ## Dependencies
var
  util = require('util'),
  fs = require('fs'),
  events = require('events'),
  hbs = require('hbs');

// ## Horseshoe( options )
// Constructor.
//
// #### Arguments
// * _Object_ **options**
//
// Returns: `Horseshoe`
var Horseshoe = function (options) {
  options = options || {};
  options.transport = (options.transport || 'sendmail').toLowerCase();
  this.nodemailer = options.nodemailer || require('nodemailer');
  this.sender = options.sender || options.user;
  this.tmplPath = options.tmplPath || __dirname;

  switch (options.transport) {
  case 'smtp':
    this.transport = this.nodemailer.createTransport("SMTP", {
      host: options.host,
      port: options.port,
      use_authentication: true,
      /* ssl: true, */
      user: options.user,
      pass: options.pass
    });
    break;
  case 'ses':
    this.transport = this.nodemailer.createTransport("SES", {
      AWSAccessKeyID: options.key, // required
      AWSSecretKey: options.secret // required
      /* ServiceUrl: 'https://email.us-east-1.amazonaws.com' */ // optional
    });
    break;
  case 'sendmail':
    options.path = options.path || "/usr/bin/sendmail";
    this.transport = this.nodemailer.createTransport("Sendmail", options.path);
    break;
  default:
    throw new Error('Horseshoe: Unknown transport "' + options.transport + '"');
  }
};

// Inherit from `EventEmitter`
util.inherits(Horseshoe, events.EventEmitter);

// ## Methods

// ### setTemplatesPath( )
// Set path to template files.
//
// #### Arguments
// * _String_ **str** Path to template files.
//
// Returns: `void`
Horseshoe.prototype.setTemplatesPath = function (str) {
  this.tmplPath = str;
};

// ### render( msg )
// Render message using template.
//
// #### Arguments
// * _Object_ **msg** A message object.
//
// Returns: `void`
Horseshoe.prototype.render = (function () {
  var
    self = this,
    cache = {},
    compile = function (fname) {
      // if already in cache we return cached value
      if (cache.hasOwnProperty(fname)) { return cache[fname]; }

      if (fs.existsSync(fname)) {
        cache[fname] = hbs.compile(fs.readFileSync(fname, 'utf8'));
        return cache[fname];
      }
    };

  return function (msg) {
    var
      htmlPath = this.tmplPath + msg.template + '.html',
      textPath = this.tmplPath + msg.template + '.txt',
      body, textTmplRawArray;

    if (!msg.data) { msg.data = {}; }

    msg.data.blockHelpers = null;

    cache[htmlPath] = compile(htmlPath);
    if (typeof cache[htmlPath] === 'function') {
      msg.html = cache[htmlPath](msg.data);
    } else {
      delete cache[htmlPath];
    }

    cache[textPath] = compile(textPath);
    if (typeof cache[textPath] === 'function') {
      body = cache[textPath](msg.data);
      textTmplRawArray = body.split('\n');
      msg.subject = textTmplRawArray.shift();
      textTmplRawArray.shift(); // remove empty line after subject line
      msg.body = textTmplRawArray.join('\n');
    } else {
      delete cache[textPath];
    }
  };
}());

// ### send( msg, cb )
// Send message.
//
// #### Arguments
// * _Object_ | _Array_ **msg** A message object or an array of messages.
// * _Function_ **cb** Callback function to be invoked when done.
//
// Returns: `void`
Horseshoe.prototype.send = function (msg, cb) {
  var
    self = this,
    processed = 0,
    errors = [],

    handleCallback = function (er, success) {
      if (er) { errors.push(er); }
      processed++;
      if (processed === msg.length) {
        self.emit('end');
        if (errors.length) { return cb(errors); }
        cb(null, true);
      }
    },

    makeSend = function () {
      var
        retries = 0,
        handleSendCallback = function (msg, er, success) {
          if (er) {
            er = new Error(er.message);
            er.email = msg;
            // errors are emitted as data because otherwise the whole queue
            // stops...
            self.emit('data', er);
            handleCallback(er);
          } else {
            self.emit('data', null, success);
            handleCallback(null, success);
          }
        };

      return function send(msg, cb) {
        if (!msg.sender) { msg.sender = self.sender; }
        if (msg.template) {
          try {
            self.render(msg);
          } catch (er) {
            return handleSendCallback(msg, er);
          }
        }

        self.nodemailer.sendMail(msg, function (er, success) {
          if (er) {
            if (retries < 3) {
              retries++;
              setTimeout(function () { send(msg, cb); }, 3000);
            } else {
              handleSendCallback(msg, er);
            }
          } else {
            handleSendCallback(msg, null, true);
          }
        });
      };
    };

  if (typeof cb !== 'function') { cb = function () {}; }
  if (!util.isArray(msg)) { msg = [ msg ]; }

  msg.forEach(function (m) {
    m.transport = self.transport;
    (makeSend())(m, handleCallback);
  });
};

// Publish Horseshoe constructor to module's public interface
exports.Horseshoe = Horseshoe;
