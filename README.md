# horseshoe

[![NPM](https://nodei.co/npm/horseshoe.png?compact=true)](https://nodei.co/npm/horseshoe/)

[![Build Status](https://secure.travis-ci.org/lupomontero/horseshoe.png)](http://travis-ci.org/lupomontero/horseshoe) 
[![Dependency Status](https://david-dm.org/lupomontero/horseshoe.png)](https://david-dm.org/lupomontero/horseshoe) 
[![devDependency Status](https://david-dm.org/lupomontero/horseshoe/dev-status.png)](https://david-dm.org/lupomontero/horseshoe#info=devDependencies)

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

`horseshoe` exports a single function. You invoke this function to get a
`mailer` object that you can the use to either send a single message with
`mailer.send()` or create a writable stream with `mailer.createStream()` to send
multiple messages using the streaming interface.

`horseshoe` will retry to send individual emails if they fail (up to 3 times).

* * *

## Installation

    npm install horseshoe

To install globally and have the command line tool placed in your PATH use:

    npm install horseshoe -g

* * *

## Usage

Let's assume that your script is `myscript.js` and you have a directory called
`mail_templates` in the same location containing a template called
`users-signup.txt` (relative to script: `mail_templates/users-signup.txt`).

In `myscript.js`:

```javascript
var horseshoe = require('horseshoe');
var mailer = horseshoe('Sendmail', { tmplPath: __dirname + '/mail_templates/' });
var message = {
  to: 'someone@somewhere.com',
  template: 'users-signup',
  data: { user: { firstname: 'Lupo' } }
};

mailer.send(message, function (error, response) {
  if (error) {
    // handle error
  }
});
```

The `mail_templates/users-signup.txt` template:

    This is a test subject

    Hey {{user.firstname}},

    I hope you like my test email...

    Bye!

### Streaming interface

Example:

```javascript
var stream = require('horseshoe')('Sendmail').createStream();
var messages = [
  { to: 'someone@somewhere.com', template: 'signup', data: { name: 'Lupo' } },
  { to: 'someone.else@somewhere.com', template: 'signup', data: { name: 'Someone' } }
];

stream.on('error', function (error) { /*handle error*/ });
stream.on('data', function (response) { /*info about message sent */ });
stream.on('end', function () { /*done sending*/ });

messages.forEach(function (message) {
  stream.write(message);
});

stream.end();
```

* * *

## Supported transports

`horseshoe` passes its options to `nodemailer` and so you can use all transports
supported by `nodemailer`.

For more info see nodemailer's [README](https://github.com/andris9/nodemailer).

### Sendmail example

```javascript
var mailer = require('horseshoe')('Sendmail', {
  path: "/usr/local/bin/sendmail",
  args: ["-f foo@blurdybloop.com"]
});
```

### SMTP

```javascript
var mailer = require('horseshoe')('SMTP', {
  sender: 'Someone <someone@somewhere.com>',
  host: 'mail.somewhere.com',
  port: 587,
  auth: {
    user: 'someone@somewhere.com',
    pass: 'somepassowrd'
  }
});
```

### Amazon SES

```javascript
var mailer = require('horseshoe')('SES', {
  AWSAccessKeyID: "YOUR-AMAZON-SES-KEY",
  AWSSecretKey: "YOUR-AMAZON-SES-SECRET"
});
```

### Postmark

Note that you need to enable SMTP on https://postmarkapp.com/ and then use our
API key both as username and password.

More info here: http://developer.postmarkapp.com/developer-smtp.html

```javascript
var mailer = require('horseshoe')('SMTP', {
  service: 'Postmark',
  auth: {
    user: "YOUR-POSTMARK-API-KEY",
    pass: "YOUR-POSTMARK-API-KEY"
  }
});
```

* * *

## TODO

* Move cli to its own repo
* Add support for other template engines?
* ...


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/lupomontero/horseshoe/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

