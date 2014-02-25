// # Horseshoe

var path = require('path');
var fs = require('fs');
var Stream = require('stream');
var async = require('async');
var _ = require('lodash');
var Handlebars = require('handlebars');

// If `nodemailer` has been defined globally we use that. This allows us to
// easily replace `nodemailer` with a mockup when running tests.
var nodemailer = global.nodemailer || require('nodemailer');

// Default options.
var defaults = {
  tmplPath: path.join(process.cwd(), 'mail_templates'),
  tmplCache: {}
};

//
// ## Horseshoe
//
function Horseshoe(type, opt) {
  this.type = type;
  this.options = _.extend({}, defaults, opt);
}

//
// ## Horseshoe.send()
//
Horseshoe.prototype.send = function (msg, cb) {
  var transport = this._createTransport();
  return this._send(transport, msg, function (err, res) {
    transport.close(); // Make sure we close de transport pool when done!
    cb(err, res);
  });
};

// Send a single email message.
Horseshoe.prototype._send = function (transport, msg, cb, retries, errors) {
  var that = this;

  if (!retries) { retries = 0; }
  if (!errors) { errors = []; }

  // Check if errors so far contain fatal errors. If so we won't retry.
  var fatalErrors = errors.filter(function (error) {
    return [ 'AuthError' ].indexOf(error.name) >= 0;
  });

  if (retries > 2 || fatalErrors.length) {
    var err = new Error('Failed sending email after ' + retries + ' attempt(s).');
    err.msg = msg;
    err.transport = transport;
    err.attempts = errors;
    return cb(err);
  }

  that.render(msg, function (err) {
    if (err) { return cb(err); }
    // Set default sender if exists as transport option.
    if (!msg.sender && transport.options.sender) {
      msg.sender = transport.options.sender;
    }
    transport.sendMail(msg, function (err, res) {
      if (err) {
        errors.push(err);
        return that._send(transport, msg, cb, ++retries, errors);
      }
      res.messageObject = msg;
      cb(null, res);
    });
  });
};

var formats = [
  {
    name: 'text',
    ext: 'txt',
    parse: function (msg, body) {
      if (typeof body !== 'string') { return; }
      var textTmplRawArray = body.split('\n');
      if (!msg.subject) {
        msg.subject = textTmplRawArray.shift();
        textTmplRawArray.shift(); // remove empty line after subject line
      }
      msg.text = textTmplRawArray.join('\n');
    }
  },
  {
    name: 'html',
    parse: function (msg, body) {
      msg.html = body;
      if (!msg.subject) {
        // TODO: msg.subject = // get page title using cheerio...
      }
    }
  }
];

//
// ## Horseshoe.render()
//
// Render a message object before sending.
//
Horseshoe.prototype.render = function (msg, cb) {
  var that = this;
  var cache = that.options.tmplCache;
  var tmplPath = that.options.tmplPath;
  var template = msg.template;

  if (!template) { return cb(null); }
  if (!msg.data) { msg.data = {}; }

  // Render both `html` and `txt` templates. If files are not found...?
  async.each(formats, function (format, cb) {
    var key = format.name;
    var file = path.join(tmplPath, template + '.' + (format.ext || key));
    // If template is already cached no need to re-compile.
    if (_.isFunction(cache[file])) {
      format.parse(msg, cache[file](msg.data));
      return cb();
    }
    that.compile(file, function (fn) {
      try {
        format.parse(msg, fn(msg.data));
      } catch (exception) {
        return cb(exception);
      }
      cache[file] = fn;
      cb();
    });
  }, cb);
};

//
// ## Horseshoe.compile()
//
// Compile a Handlebars template from file. If file doesn't exist or can not be
// read no error will be raised. The callback will be invoked passing a dummy
// template function that does nothing.
// NOTE: callback will be invoked with only one argument as no errors can be
// raised.
//
Horseshoe.prototype.compile = function (fname, cb) {
  fs.exists(fname, function (exists) {
    if (!exists) { return cb(function () {}); }
    fs.readFile(fname, function (err, source) {
      if (err) { return cb(function () {}); }
      cb(Handlebars.compile(source.toString()));
    });
  });
};

//
// ## Horseshoe.createStream()
//
// Create a writable stream that will send message objects written to it.
//
Horseshoe.prototype.createStream = function () {
  var that = this;
  var s = new Stream();
  var transport = that._createTransport();
  var count = 0;
  var processed = 0;

  s.readable = true;
  s.writable = true;
  s.destroy = function () { s.writable = false; };

  s.write = function (msg) {
    count += 1;
    that._send(transport, msg, function (err, res) {
      if (err) { return s.emit('error', err); }
      s.emit('data', res);
      processed += 1;
    });
  };

  s.end = function (msg) {
    if (arguments.length) { s.write(msg); }
    var intvl = setInterval(function () {
      if (count === processed) {
        transport.close();
        s.emit('end');
        clearInterval(intvl);
      }
    }, 25);
    s.destroy();
  };

  return s;
};

Horseshoe.prototype._createTransport = function () {
  return nodemailer.createTransport(this.type, this.options);
};

module.exports = function (type, opt) {
  return new Horseshoe(type, opt);
};

