require(__dirname + '/common');

var suite = vows.describe('Horseshoe postmark'),
    config;

if (process.argv.indexOf('--live') === -1) {
  config = {
    sender: 'someone',
    transport: 'postmark',
    key: 'YOUR-POSTMARK-KEY',
    nodemailer: global.nodemailer
  };
} else {
  config.transport = 'postmark';
}

var horseshoe = new Horseshoe(config);
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
