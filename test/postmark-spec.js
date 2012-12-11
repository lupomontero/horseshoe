var common = require(__dirname + '/common');

exports['send ses'] = function (t) {
  t.expect(2);
  common.createHorseshoe('postmark').send({
    to: 'lupomontero@gmail.com',
    template: 'users-signup',
    data: { user: { firstname: 'Svencho' } }
  }, function (er, success) {
    t.ok(!er);
    t.ok(success);
    t.done();
  });
};

exports['send msg to many recipients'] = function (t) {
  t.expect(2);
  common.createHorseshoe('postmark').send([
    {
      to: 'lupomontero@gmail.com',
      template: 'users-signup',
      data: { user: { firstname: 'Lupo' } }
    },
    {
      to: 'me@svenlito.com',
      template: 'users-signup',
      data: { user: { firstname: 'Sven' } }
    }
 ], function (er, success) {
   t.ok(!er);
   t.ok(success);
   t.done();
 });
};

