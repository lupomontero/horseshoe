var
  fs = require('fs'),
  Horseshoe = require(__dirname + '/../lib/horseshoe'),
  defaultConfigs = {
    smtp: {
      host: 'mail.somewhere.com',
      port: 587,
      use_authentication: true,
      user: 'someone@somewhere.com',
      pass: 'somepassword'
    },
    ses: {
      key: 'YOUR-AMAZON-SES-KEY',
      secret: 'YOUR-AMAZON-SES-SECRET'
    },
    postmark: { key: 'YOUR-POSTMARK-KEY' }
  },

  config = function (type) {
    var
      configObj = {},
      configFile = __dirname + '/config-' + type + '.json',
      nodemailer;

    if (process.env.NODE_ENV === 'production') {
      if (!fs.existsSync(configFile)) {
        throw new Error('No config file!');
      }
      configObj = require(configFile);
    } else {
      nodemailer = require(__dirname + '/mock-nodemailer');
      configObj = defaultConfigs[type];
      configObj.transport = type;
      configObj.sender = "someone <someone@somewhere.com>";
      configObj.nodemailer = nodemailer;
    }

    return configObj;
  };

exports.createHorseshoe = function (type) {
  var h = new Horseshoe(config(type));
  h.setTemplatesPath(__dirname + '/mail_templates/');
  return h;
};

