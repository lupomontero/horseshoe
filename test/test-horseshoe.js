require('./common');

var Stream = require('stream');
var _ = require('lodash');
var horseshoe = require('../index');

exports['module exports a single function'] = function (t) {
  t.equal(typeof horseshoe, 'function');
  t.done();
};

exports['horseshoe returns a "mailer" object of type Horseshoe'] = function (t) {
  var mailer = horseshoe();
  t.equal(mailer.constructor.name, 'Horseshoe');
  t.done();
};

// > This test is currently failing when running tests in `no-mocks` environment
// (that is using real nodemailer and not the mock).
// TODO: Needs further investigation...
//exports.sendBadRecipient = function (t) {
//  var msg = { to: 'bad email', subject: 'hola', text: 'hello world!' };
//
//  horseshoe('Sendmail', {}).send(msg, function (err, res) {
//    t.ok(err);
//    t.ok(err instanceof Error);
//    t.ok(err.msg);
//    t.ok(err.transport);
//    t.ok(err.attempts);
//    t.ok(!res);
//    t.done();
//  });
//};

exports.sendBadTemplate = function (t) {
  var msg = {
    to: 'lupomontero@gmail.com',
    template: 'bad-template',
    data: {}
  };
  horseshoe('SMTP', global.config.SMTP).send(msg, function (err, res) {
    t.ok(err);
    t.ok(err instanceof Error);
    t.ok(/parse error/i.test(err.message));
    t.done();
  });
};

if (process.env.NODE_ENV === 'no-mocks') {

// bad host
// bad port
// bad user
// bad pass
exports.incorrectAuthFailure = function (t) {
  var msg = { to: 'lupomontero@gmail.com', subject: 'hola', text: 'hello world!' };
  var cfg = _.extend({}, global.config.SMTP);
  cfg.auth = _.extend({}, cfg.auth);
  cfg.auth.pass = 'foo';
  horseshoe('SMTP', cfg).send(msg, function (err, res) {
    t.ok(err instanceof Error);
    t.ok(/ 1 attempt\(s\)/.test(err.message));
    t.equal(err.attempts.length, 1);
    t.ok(err.attempts[0] instanceof Error);
    t.equal(err.attempts[0].name, 'AuthError');
    t.ok(/incorrect auth/i.test(err.attempts[0].data));
    t.equal(err.attempts[0].stage, 'auth');
    t.done();
  });
};

}

exports.sendPlainTextWithoutTemplate = function (t) {
  var msg = { to: 'lupomontero@gmail.com', subject: 'hola', text: 'hello world!' };

  horseshoe('SMTP', global.config.SMTP).send(msg, function (err, res) {
    t.ok(!err);
    t.ok(res && res.messageObject);
    t.equal(res.messageObject.to, msg.to);
    t.equal(res.messageObject.subject, msg.subject);
    t.equal(res.messageObject.text, msg.text);
    t.equal(typeof res.message, 'string');
    t.equal(typeof res.messageId, 'string');
    t.done();
  });
};

exports.sendWithPlainTextTemplateOnly = function (t) {
  var msg = {
    to: 'lupomontero@gmail.com',
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
    t.equal(typeof res.message, 'string');
    t.equal(typeof res.messageId, 'string');
    t.done();
  });
};

exports.sendWithPlainTextTemplateOnlyDontOverrideSubject = function (t) {
  var msg = {
    to: 'lupomontero@gmail.com',
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
    t.equal(typeof res.message, 'string');
    t.equal(typeof res.messageId, 'string');
    t.done();
  });
};

exports.sendWithHtmlTemplateOnly = function (t) {
  var msg = {
    to: 'lupomontero@gmail.com',
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
    t.equal(typeof res.message, 'string');
    t.equal(typeof res.messageId, 'string');
    t.done();
  });
};

exports.sendManyUsingtStream = function (t) {
  var stream = horseshoe('SMTP', global.config.SMTP).createStream();
  var msg, i;

  stream.on('data', function (buf) {
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
    msg = { to: 'lupomontero@gmail.com', subject: 'hmm-' + i, text: 'hallo' };
    stream.write(msg);
  }

  stream.end();
};

exports.pipeIntoStream = function (t) {
  var fs = require('fs');
  var parser = require('JSONStream').parse([ true ]);
  var stream = horseshoe('SMTP', global.config.SMTP).createStream();
  var through = new Stream();

  t.expect(15);

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
  var h = horseshoe('SMTP', global.config.SMTP);
  var msg1 = { to: 'lupomontero@gmail.com', template: 'foo', data: { name: 'Lupo'} };
  var msg2 = { to: 'lupomontero@gmail.com', template: 'foo', data: { name: 'Someone' } };
  var msg3 = { to: 'lupomontero@gmail.com', template: 'foo', data: { name: 'Test' } };
  var msg4 = { to: 'lupomontero@gmail.com', template: 'foo', data: { name: 'Not me' } };
  var count = 0;

  function done() { if (++count === 4) { t.done(); } }

  h.send(msg1, function (err) { t.ok(!err); done(); });
  h.send(msg2, function (err) { t.ok(!err); done(); });
  h.send(msg3, function (err) { t.ok(!err); done(); });
  h.send(msg4, function (err) { t.ok(!err); done(); });
};

