# horseshoe

`horseshoe` is a mailer module for [node.js](http://nodejs.org/). It provides a
wrapper around [nodemailer](https://github.com/andris9/nodemailer) used for
sending email using [handlebars](http://handlebarsjs.com/) templates.

## Installation

    npm install horseshoe

## Usage

    var
      Horseshoe = require('horseshoe').Horseshoe,
      horseshoe = new Horseshoe({ transport: 'smtp' }),
      msg = {
        to: 'lupo@e-noise.com',
        template: 'users-signup',
        data: { user: { firstname: 'Lupo' } }
      };

    horseshoe.setTemplatesPath(__dirname + '/mail_templates/');
    horseshoe.send(msg, function (er, data) {
      //...
    });

## Running the tests
