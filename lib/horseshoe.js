// ## Dependencies
var
  util = require('util'),
  fs = require('fs'),
  path = require('path'),
  nodemailer = require('nodemailer'),
  hbs = require('hbs');

// ## HorseshoeError( message, email )
// Constructor.
//
// #### Arguments
// * _String_ **message**
// * _Object_ **email** An email message object.
//
// Returns: `HorseshoeError`
var HorseshoeError = function HorseshoeError(message, email) {
  this.name = 'HorseshoeError';
  this.email = email;
  this.message = message;
  Error.call(this, message);
  Error.captureStackTrace(this, arguments.callee);
};

// Inherit from `Error`
util.inherits(HorseshoeError, Error);

// ## Horseshoe( options )
// Constructor.
//
// #### Arguments
// * _Object_ **options**
//
// Returns: `Horseshoe`
var Horseshoe = function (options) {
  options = options || {};
  this.transport = (options.transport || 'sendmail').toLowerCase();
  this.sender = options.sender || options.user;
  this.tmplPath = options.tmplPath || __dirname;

  switch (this.transport) {
    case 'smtp':
      nodemailer.SMTP = {
        host: options.host,
        port: options.port,
        use_authentication: true,
        /* ssl: true, */
        user: options.user,
        pass: options.pass
      };
      break;
    case 'ses':
      nodemailer.SES = {
        AWSAccessKeyID: options.key, // required
        AWSSecretKey: options.secret // required
        /* ServiceUrl: 'https://email.us-east-1.amazonaws.com' */ // optional
      };
      break;
    case 'sendmail':
      nodemailer.sendmail = options.path || true;
      break;
    default:
      throw new Error('Horseshoe: Unknown transport "' + options.transport + '"');
  }
};

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
    cache = {},
    compile = function (fname) {
      if (cache.hasOwnProperty(fname)) {
        return cache[fname];
      }

      if (path.existsSync(fname)) {
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
})();

// ### send( msg, cb )
// Send message.
//
// #### Arguments
// * _Object_ **msg** A message object.
// * _Function_ **cb** Callback function to be invoked when done.
//
// Returns: `void`
Horseshoe.prototype.send = function (msg, cb) {
  var
    self = this,
    i, processed = 0,
    errors = [],
    makeSend = function () {
      var retries = 0;

      return function send(msg, cb) {
        if (!msg.sender) { msg.sender = self.sender; }
        if (msg.template) { self.render(msg); }

        nodemailer.send_mail(msg, function (er, success) {
          if (er) {
            if (retries < 3) {
              retries++;
              setTimeout(function () { send(msg, cb); }, 3000);
            } else {
              cb(new HorseshoeError(er.message, msg));
            }
          } else {
            cb(null, true);
          }
        });
      };
    },
    handleCallback = function (er, success) {
      if (er) { errors.push(er); }
      processed++;
      if (processed === msg.length) {
        if (errors.length) { cb(errors); }
        else { cb(null, true); }
      }
    };

  if (typeof cb !== 'function') { cb = function () {}; }
  if (!util.isArray(msg)) { msg = [ msg ]; }

  for (i = 0; i < msg.length; i++) {
    (makeSend())(msg[i], handleCallback)
  }
};

// Publish Horseshoe constructor to module's public interface
exports.Horseshoe = Horseshoe;
