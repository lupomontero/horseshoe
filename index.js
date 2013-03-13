var
  path = require('path'),
  fs = require('fs'),
  Stream = require('stream'),
  nodemailer = global.nodemailer || require('nodemailer'),
  Handlebars = require('handlebars');

function compile(fname, cb) {
  fs.exists(fname, function (exists) {
    if (!exists) {
      // Fail silently...
      //console.log('Template "' + fname + '" doesnt exist!');
      return cb(null, function () {});
    }

    fs.readFile(fname, function (err, source) {
      var fn;

      if (err) {
        // Fail silently...
        //console.log('Error readind template "' + fname + '".');
        return cb(null, function () {});
      }

      cb(null, Handlebars.compile(source.toString()));
    });
  });
}

function render(msg, cb) {
  var
    self = this,
    cache = self._tmplCache,
    htmlPath = path.join(self._tmplPath, msg.template + '.html'),
    textPath = path.join(self._tmplPath, msg.template + '.txt'),
    count = 0;

  function done() { if (++count === 2) { cb(); } }

  if (!msg.template) { return cb(null); }
  if (!msg.data) { msg.data = {}; }

  // If not in cache we need to compile!
  if (typeof cache[htmlPath] !== 'function') {
    self._compile(htmlPath, function (err, fn) {
      if (err) { return cb(err); }
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
    self._compile(textPath, function (err, fn) {
      if (err) { return cb(err); }
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

function sendMessage(transport, msg, cb, retries, errors) {
  var self = this, err;

  if (!retries) { retries = 0; }
  if (!errors) { errors = []; }

  if (retries > 2) {
    err = new Error('Retried 3 times!');
    err.msg = msg;
    err.transport = transport;
    err.attempts = errors;
    return cb(err);
  }

  this._render(msg, function (err) {
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

function createStream() {
  var
    self = this,
    s = new Stream(),
    transport = self._createTransport(),
    count = 0,
    processed = 0;

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

// Public interface
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
      return sendMessage.call(this, transport,  msg, function (err, res) {
        transport.close(); // Make sure we close de transport pool when done!
        return cb(err, res);
      });
    },
    createStream: createStream
  };
};
