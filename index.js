// # Horseshoe

var path = require('path');
var fs = require('fs');
var Stream = require('stream');
var Handlebars = require('handlebars');
// If `nodemailer` has been defined globally we use that. This allows us to
// easily replace `nodemailer` with a mockup when running tests.
var nodemailer = global.nodemailer || require('nodemailer');

// ## compile
// Compile a Handlebars template from file. If file doesn't exist or can not be
// read no error will be raised. The callback will be invoked passing a dummy
// template function that does nothing.
// NOTE: callback will be invoked with only one argument as no errors can be
// raised.
function compile(fname, cb) {
  fs.exists(fname, function (exists) {
    if (!exists) { return cb(function () {}); }
    fs.readFile(fname, function (err, source) {
      if (err) { return cb(function () {}); }
      cb(Handlebars.compile(source.toString()));
    });
  });
}

// ## render
// Render a message object before sending.
function render(msg, cb) {
  var self = this;
  var cache = self._tmplCache;
  var htmlPath = path.join(self._tmplPath, msg.template + '.html');
  var textPath = path.join(self._tmplPath, msg.template + '.txt');
  var count = 0;

  function done() { if (++count === 2) { cb(); } }

  if (!msg.template) { return cb(null); }
  if (!msg.data) { msg.data = {}; }

  // If not in cache we need to compile!
  if (typeof cache[htmlPath] !== 'function') {
    self._compile(htmlPath, function (fn) {
      try {
        msg.html = fn(msg.data);
      } catch (exception) {
        return cb(exception);
      }
      cache[htmlPath] = fn;
      done();
    });
  } else {
    msg.html = cache[htmlPath](msg.data);
    done();
  }

  function parseTextBody(body) {
    var textTmplRawArray;

    if (typeof body !== 'string') { return; }

    textTmplRawArray = body.split('\n');
    if (!msg.subject) {
      msg.subject = textTmplRawArray.shift();
      textTmplRawArray.shift(); // remove empty line after subject line
    }

    msg.text = textTmplRawArray.join('\n');
  }

  if (typeof cache[textPath] !== 'function') {
    self._compile(textPath, function (fn) {
      try {
        parseTextBody(fn(msg.data));
      } catch (exception) {
        return cb(exception);
      }
      cache[textPath] = fn;
      done();
    });
  } else {
    parseTextBody(cache[textPath](msg.data));
    done();
  }
}

// ## sendMessage
// Send a single email message.
function sendMessage(transport, msg, cb, retries, errors) {
  var self = this;

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

  self._render(msg, function (err) {
    if (err) { return cb(err); }

    // Set default sender if exists as transport option.
    if (!msg.sender && transport.options.sender) {
      msg.sender = transport.options.sender;
    }

    transport.sendMail(msg, function (err, res) {
      if (err) {
        errors.push(err);
        return sendMessage.call(self, transport, msg, cb, ++retries, errors);
      }
      res.messageObject = msg;
      cb(null, res);
    });
  });
}

// ## createStream
// Create a writable stream that will send message objects written to it.
function createStream() {
  var self = this;
  var s = new Stream();
  var transport = self._createTransport();
  var count = 0;
  var processed = 0;

  s.readable = true;
  s.writable = true;
  s.destroy = function () { s.writable = false; };

  s.write = function (msg) {
    count += 1;
    sendMessage.call(self, transport, msg, function (err, res) {
      if (err) { return s.emit('error', err); }
      s.emit('data', res);
      processed += 1;
    });
  };

  s.end = function (msg) {
    var intvl;

    if (arguments.length) { s.write(msg); }

    intvl = setInterval(function () {
      if (count === processed) {
        transport.close();
        s.emit('end');
        clearInterval(intvl);
      }
    }, 25);
    s.destroy();
  };

  return s;
}

// ## Public interface
module.exports = function (type, options) {
  return {
    _tmplPath: options.tmplPath || process.cwd() + '/mail_templates',
    _tmplCache: options.tmplCache || {},
    _compile: compile,
    _render: render,
    _createTransport: function () {
      return nodemailer.createTransport(type, options);
    },
    send: function (msg, cb) {
      var transport = this._createTransport();
      return sendMessage.call(this, transport, msg, function (err, res) {
        transport.close(); // Make sure we close de transport pool when done!
        cb(err, res);
      });
    },
    createStream: createStream
  };
};

