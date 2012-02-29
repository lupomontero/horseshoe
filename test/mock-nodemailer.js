exports.createTransport = function (type, options) {
  return { type: type, options: options };
};

exports.sendMail = function (msg, cb) {
  var type = msg.transport.type;

  if (!msg.sender) {
    return cb({ message: 'Sender is required' });
  }

  if (type === 'SMTP' && !msg.transport.options.host) {
    return cb({ message: 'ECONNREFUSED' });
  }

  cb(null, true);
};
