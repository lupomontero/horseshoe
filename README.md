# horseshoe

`horseshoe` is a mailer module for [node.js](http://nodejs.org/). It provides a
wrapper around [nodemailer](https://github.com/andris9/nodemailer) used for
sending email using [handlebars](http://handlebarsjs.com/) templates.

`horseshoe` is designed for a very specific use case. We use it at E-NOISE to
send out system emails using SMTP and Amazon SES. This emails are predesigned
using `handlebars` templates and then sent using `nodemailer`.

`horseshoe` renders templates using the data specified in the `message`
object:

    var message = {
      to: 'someone@somewhere.com',
      template: 'users-signup',
      data: { user: { firstname: 'Lupo' } }
    };

`horseshoe` will search the templates path for files with either a `.txt` or
`.html` extension (`users-signup.txt` and `users-signup.html` in this case) and
render them using `handlebars` to create the email body.

`horseshoe` will retry to send individual emails if they fail (up to 3 times).

**THIS MODULE IS STILL WORK IN PROGRESS**

## Installation

    npm install horseshoe

## Usage

Let's assume that your script is `myscript.js` and you have a directory called
`mail_templates` in the same location containing a template called
`users-signup.txt` (relative to script: `mail_templates/users-signup.txt`).

In `myscript.js`:

    var
      Horseshoe = require('horseshoe').Horseshoe,
      horseshoe = new Horseshoe({ transport: 'sendmail' }),
      msg = {
        to: 'someone@somewhere.com',
        template: 'users-signup',
        data: { user: { firstname: 'Lupo' } }
      };

    horseshoe.setTemplatesPath(__dirname + '/mail_templates/');
    horseshoe.send(msg, function (errors, success) {
      if (errors && errors.length) {
        // handle errors
        // errors is an array with errors for each mail sent (one per recipient)
        console.log(errors);
      }

    });

The `mail_templates/users-signup.txt` template:

    This is a test subject

    Hey {{user.firstname}},

    I hope you like my test email...

    Bye!

## Supported transports

### sendmail

    var Horseshoe = require('horseshoe').Horseshoe;
    var horseshoe = new Horseshoe({ transport: 'sendmail' });

    // now you can use the horseshoe instance to send email
    // horseshoe.send(msg, function (errors, success) {});
    // ...

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

