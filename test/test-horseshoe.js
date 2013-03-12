require('./common');

var
  Stream = require('stream'),
  horseshoe = require('../index');

exports.sendBadRecipient = function (t) {
  var msg = { to: 'bad email', subject: 'hola', text: 'hello world!' };

  horseshoe('Sendmail', {}).send(msg, function (err, res) {
    t.ok(err);
    t.ok(err instanceof Error);
    t.ok(err.msg);
    t.ok(err.transport);
    t.ok(err.attempts);
    t.ok(!res);
    t.done();
  });
};

exports.sendBadTemplate = function (t) {
  var msg = {
    to: 'lupo@e-noise.com',
    template: 'bad-template',
    data: { user: { firstname: 'Lupo' } }
  };

  horseshoe('SMTP', global.config.SMTP).send(msg, function (err, res) {
    t.ok(err);
    t.ok(err instanceof Error);
    t.ok(/parse error/i.test(err.message));
    t.done();
  });
};

exports.sendPlainTextWithoutTemplate = function (t) {
  var msg = { to: 'lupo@e-noise.com', subject: 'hola', text: 'hello world!' };

  horseshoe('SMTP', global.config.SMTP).send(msg, function (err, res) {
    t.ok(!err);
    t.ok(res && res.messageObject);
    t.equal(res.messageObject.to, msg.to);
    t.equal(res.messageObject.subject, msg.subject);
    t.equal(res.messageObject.text, msg.text);
    t.equal(res.failedRecipients.length, 0);
    t.equal(typeof res.message, 'string');
    t.equal(typeof res.messageId, 'string');
    t.done();
  });
};

exports.sendWithPlainTextTemplateOnly = function (t) {
  var msg = {
    to: 'lupo@e-noise.com',
    template: 'users-signup',
    data: { user: { firstname: 'Lupo' } }
  };

  horseshoe('SMTP', global.config.SMTP).send(msg, function (err, res) {
    t.ok(!err);
    t.ok(res && res.messageObject);
    t.equal(res.messageObject.to, msg.to);
    t.equal(res.messageObject.template, msg.template);
    t.equal(res.messageObject.data.user.firstname, msg.data.user.firstname);
    t.equal(res.messageObject.html, undefined);
    t.equal(res.messageObject.subject, 'This is a test subject');
    t.equal(res.messageObject.text, 'Hey Lupo,\n\nI hope you like my test email...\n\nBye!\n');
    t.equal(typeof res.failedRecipients.length, 'number');
    t.equal(typeof res.message, 'string');
    t.equal(typeof res.messageId, 'string');
    t.done();
  });
};

exports.sendWithPlainTextTemplateOnlyDontOverrideSubject = function (t) {
  var msg = {
    to: 'lupo@e-noise.com',
    template: 'users-signup',
    subject: 'I am the SUBJECT',
    data: { user: { firstname: 'Lupo' } }
  };

  horseshoe('SMTP', global.config.SMTP).send(msg, function (err, res) {
    t.ok(!err);
    t.ok(res && res.messageObject);
    t.equal(res.messageObject.to, msg.to);
    t.equal(res.messageObject.template, msg.template);
    t.equal(res.messageObject.data.user.firstname, msg.data.user.firstname);
    t.equal(res.messageObject.html, undefined);
    t.equal(res.messageObject.subject, 'I am the SUBJECT');
    t.equal(res.messageObject.text, 'This is a test subject\n\nHey Lupo,\n\nI hope you like my test email...\n\nBye!\n');
    t.equal(typeof res.failedRecipients.length, 'number');
    t.equal(typeof res.message, 'string');
    t.equal(typeof res.messageId, 'string');
    t.done();
  });
};

exports.sendWithHtmlTemplateOnly = function (t) {
  var msg = {
    to: 'lupo@e-noise.com',
    template: 'foo',
    subject: 'I am the SUBJECT',
    data: { name: 'Lupo' }
  };

  horseshoe('SMTP', global.config.SMTP).send(msg, function (err, res) {
    t.ok(!err);
    t.ok(res && res.messageObject);
    t.equal(res.messageObject.to, msg.to);
    t.equal(res.messageObject.template, msg.template);
    t.equal(res.messageObject.data.name, msg.data.name);
    t.equal(res.messageObject.text, undefined);
    t.equal(res.messageObject.subject, 'I am the SUBJECT');
    t.ok(/<h1>Hi Lupo!<\/h1>/.test(res.messageObject.html));
    t.equal(typeof res.failedRecipients.length, 'number');
    t.equal(typeof res.message, 'string');
    t.equal(typeof res.messageId, 'string');
    t.done();
  });
};

exports.sendManyUsingtStream = function (t) {
  var
    stream = horseshoe('SMTP', global.config.SMTP).createStream(),
    msg, i;

  stream.on('data', function (buf) {
    t.equal(typeof buf.failedRecipients.length, 'number');
    t.equal(typeof buf.message, 'string');
    t.equal(typeof buf.messageId, 'string');
    t.equal(buf.messageObject.to, msg.to);
    t.equal(buf.messageObject.text, msg.text);
    t.ok(/^hmm-\d$/.test(buf.messageObject.subject));
  });
  stream.on('end', function () {
    t.equal(arguments.length, 0);
    t.done();
  });

  for (i = 0; i < 5; i++) {
    msg = { to: 'lupo@e-noise.com', subject: 'hmm-' + i, text: 'hallo' };
    stream.write(msg);
  }

  stream.end();
};

exports.pipeIntoStream = function (t) {
  var
    fs = require('fs'),
    parser = require('JSONStream').parse([ true ]),
    stream = horseshoe('SMTP', global.config.SMTP).createStream(),
    through = new Stream();

  t.expect(18);

  through.readable = true;
  through.writable = true;
  through.destroy = function () { through.writable = false; };
  through.write = function (buf) {
    t.ok(buf.email);
    t.ok(buf.name);
    through.emit('data', { to: buf.email, template: 'foo', data: buf });
  };
  through.end = function (buf) {
    if (arguments.length) { through.write(buf); }
    through.destroy();
    through.emit('end');
  };

  stream.on('data', function (buf) {
    t.equal(typeof buf.failedRecipients.length, 'number');
    t.equal(typeof buf.message, 'string');
    t.equal(typeof buf.messageId, 'string');
    t.ok(buf.messageObject);
  });
  stream.on('end', function () {
    t.done();
  });

  fs.createReadStream(__dirname + '/users.json')
    .pipe(parser).pipe(through).pipe(stream);
};


exports.invokeSendSeveralTimesOnSameInstance = function (t) {
  var
    h = horseshoe('SMTP', global.config.SMTP),
    msg = {
      to: 'lupo@e-noise.com',
      template: 'users-signup',
      data: { user: { firstname: 'Lupo' } }
    },
    msg2 = {
      to: 'lupo@e-noise.com',
      template: 'users-signup',
      data: { user: { firstname: 'Someone' } }
    },
    msg3 = {
      to: 'lupo@e-noise.com',
      template: 'users-signup',
      data: { user: { firstname: 'Test' } }
    },
    count = 0;

  function done() { if (++count === 4) { t.done(); } }

  h.send(msg, function (err, res) {
    t.ok(!err);
    done();
  });
  h.send(msg2, function (err, res) {
    t.ok(!err);
    done();
  });
  h.send(msg3, function (err, res) {
    t.ok(!err);
    done();
  });

  setTimeout(function () {
    h.send(msg, function (err) {
      t.ok(!err);
      done();
    });
  }, 100);
};
