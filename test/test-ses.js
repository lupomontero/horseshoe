require(__dirname + '/common');

var suite = vows.describe('Horseshoe SES');

if (process.argv.indexOf('--live') === -1) {
  config = {
    sender: 'someone',
    transport: 'ses',
    key: 'YOUR-AMAZON-SES-KEY',
    secret: 'YOUR-AMAZON-SES-SECRET',
    nodemailer: global.nodemailer
  };
} else {
  config.transport = 'ses';
}

var horseshoe = new Horseshoe(config)
horseshoe.setTemplatesPath(__dirname + '/mail_templates/');

suite.addBatch({

  'send ses': {
    topic: function () {
      var msg = {
        to: 'noreply@timbodi.com',
        template: 'users-signup',
        data: { user: { firstname: 'Lupo' } }
      };

      horseshoe.send(msg, this.callback);
    },
    'send ok (this has sent real email, check mailbox)': function (errors, success) {
      assert.ok(!errors);
      assert.ok(success);
    }
  },

  'send msg to many recipients': {
    topic: function () {
      horseshoe.send([
        {
          to: 'noreply@timbodi.com',
          template: 'users-signup',
          data: { user: { firstname: 'Lupo' } }
        },
        {
          to: 'lupo@e-noise.com',
          template: 'users-signup',
          data: { user: { firstname: 'Lupo' } }
        }
      ], this.callback);
    },
    'all good (this has sent real email, check mailboxes)': function (errors, success) {
      assert.ok(!errors);
      assert.ok(success);
    }
  }

});

suite.export(module);
