if (process.env.NODE_ENV === 'no-mocks') {
  console.log('NOT USING MOCKS! EMAILS WILL BE SENT FOR REAL!');
  try {
    global.config = require('./config.json');
  } catch (err) {
    console.error('Make sure you create a test/config.json file before ' +
                  'running the tests without mockups!');
    process.exit(1);
  }
} else {
  // Mock nodemailer
  global.nodemailer = {
    createTransport: function (type, options) {
      return {
        transportType: type,
        options: options,
        close: function () {},
        sendMail: function (msg, cb) {
          if (msg.to === 'bad email') { return cb('error!'); }
          cb(null, { message: '', messageId: '' });
        }
      };
    }
  };
  global.config = {
    'sendmail': {},
    'SMTP': {},
    'SES': {}
  };
}

global.config.SMTP.tmplPath = __dirname + '/mail_templates';
