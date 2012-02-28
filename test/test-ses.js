var
  fs = require('fs'),
  vows = require('vows'),
  assert = require('assert'),
  Horseshoe = require(__dirname + '/../lib/horseshoe').Horseshoe,
  suite = vows.describe('Horseshoe SES'),
  horseshoe,
  // This assumes you have a file with horseshoe options in json format called
  // config.json in the directory above this script. This config file IS NOT
  // included in the repo so you should create your own.
  config = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf8'));

// make sure the transport is set to ses
config.transport = 'ses';
horseshoe = new Horseshoe(config)
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
