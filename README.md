# horseshoe

`horseshoe` is a mailer module for [node.js](http://nodejs.org/). It provides a
wrapper around [nodemailer](https://github.com/andris9/nodemailer) used for
sending email using [handlebars](http://handlebarsjs.com/) templates.

## Installation

    npm install horseshoe

## Usage

    var
      Horseshoe = require('horseshoe').Horseshoe,
      horseshoe = new Horseshoe({ transport: 'sendmail' }),
      msg = {
        to: 'lupo@e-noise.com',
        template: 'users-signup',
        data: { user: { firstname: 'Lupo' } }
      };

    horseshoe.setTemplatesPath(__dirname + '/mail_templates/');
    horseshoe.send(msg, function (er, data) {
      //...
    });

## Supported transports

### sendmail

    var horseshoe = new (require('horseshoe').Horseshoe)({ transport: 'sendmail' });

### SMTP

    var horseshoe = new (require('horseshoe').Horseshoe)({
      transport: 'smtp',
      sender: 'Someone <someone@somewhere.com>',
      host: 'mail.somewhere.com',
      port: 587,
      use_authentication: true,
      user: 'someone@somewhere.com',
      pass: 'somepassowrd'
    });

### Amazon SES

    var horseshoe = new (require('horseshoe').Horseshoe)({
      transport: 'ses',
      key: "YOUR-AMAZON-SES-KEY",
      secret: "YOUR-AMAZON-SES-SECRET"
    });

## Running the tests
