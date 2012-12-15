# horseshoe

[![Build Status](https://secure.travis-ci.org/E-NOISE/horseshoe.png)](http://travis-ci.org/E-NOISE/horseshoe)

`horseshoe` is a mailer module for [node.js](http://nodejs.org/). It provides a
wrapper around [nodemailer](https://github.com/andris9/nodemailer) used for
sending email using [handlebars](http://handlebarsjs.com/) templates.

`horseshoe` is designed for a very specific use case. We use it at ENOISE to
send out system emails using SMTP and Amazon SES. This emails are predesigned
using `handlebars` templates and then rendered and sent using this module.

`horseshoe` renders templates using the `data` specified in the `message`
object:

```javascript
var message = {
  to: 'someone@somewhere.com',
  template: 'users-signup',
  data: { user: { firstname: 'Lupo' } }
};
```

`horseshoe` will search the templates path for files with either a `.txt` or
`.html` extension (`users-signup.txt` and `users-signup.html` in this case) and
render them using `handlebars` to create the email body.

The `horseshoe.send()` method can send both individual messages or an array of
messages.

`horseshoe` will retry to send individual emails if they fail (up to 3 times).

**THIS MODULE IS STILL WORK IN PROGRESS**

## Installation

    npm install horseshoe

## Usage

Let's assume that your script is `myscript.js` and you have a directory called
`mail_templates` in the same location containing a template called
`users-signup.txt` (relative to script: `mail_templates/users-signup.txt`).

In `myscript.js`:

```javascript
var
  Horseshoe = require('horseshoe'),
  horseshoe = new Horseshoe({ transport: 'sendmail' }),
  message = {
    to: 'someone@somewhere.com',
    template: 'users-signup',
    data: { user: { firstname: 'Lupo' } }
  };

horseshoe.setTemplatesPath(__dirname + '/mail_templates/');
horseshoe.send(message, function (errors, success) {
  if (errors && errors.length) {
    // handle errors
    // errors is an array with errors for each mail sent (one per recipient)
    console.log(errors);
  }
});
```

Note that `horseshoe.send()` takes a single message in this example, but we can
also pass an array of messages.

The `mail_templates/users-signup.txt` template:

    This is a test subject

    Hey {{user.firstname}},

    I hope you like my test email...

    Bye!

## Events

`horseshoe` is an `EventEmitter` and the following events are implemented:

* `data`: This event is emitted for every individual email sent. Listeners will
  be passed `error` and `success` arguments.
* `end`: This event is emitted when all messages have been sent. No arguments
  are passed to when this event is emitted.

Example:

```javascript
var
  Horseshoe = require('horseshoe'),
  horseshoe = new Horseshoe({ transport: 'sendmail' }),
  messages = [
    {
      to: 'someone@somewhere.com',
      template: 'users-signup',
      data: { user: { firstname: 'Lupo' } }
    },
    {
      to: 'someone.else@somewhere.com',
      template: 'users-signup',
      data: { user: { firstname: 'Someone' } }
    }
  ];

horseshoe.send(messages)
  .on('error', function (err) {
    // something went wrong
  })
  .on('data', function (data) {
    // email was sent...
  })
  .on('end', function () {
    // all messages have been proceesed
  });
```

## Supported transports

### sendmail

```javascript
var Horseshoe = require('horseshoe');
var horseshoe = new Horseshoe({ transport: 'sendmail' });

// now you can use the horseshoe instance to send email
// horseshoe.send(msg, function (errors, success) {});
// ...
```

### SMTP

```javascript
var horseshoe = new Horseshoe({
  transport: 'smtp',
  sender: 'Someone <someone@somewhere.com>',
  host: 'mail.somewhere.com',
  port: 587,
  use_authentication: true,
  user: 'someone@somewhere.com',
  pass: 'somepassowrd'
});
```

### Amazon SES

```javascript
var horseshoe = new Horseshoe({
  transport: 'ses',
  key: "YOUR-AMAZON-SES-KEY",
  secret: "YOUR-AMAZON-SES-SECRET"
});
```

### Postmark

```javascript
var horseshoe = new Horseshoe({
  transport: 'postmark',
  key: "YOUR-POSTMARK-KEY"
});
```

