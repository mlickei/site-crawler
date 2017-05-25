const shell = require('../shell');
const Socket = require('./Socket');

// See Socket.io documentation
module.exports = Socket.extend(function(io){

  this.on('example', message => {
    shell.trace(message);
    this.broadcast.emit('example', message);
  });

});
