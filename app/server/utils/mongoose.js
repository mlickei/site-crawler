const config = require('./config');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(config.nosql_database_connection_string, {
  server: {
    socketOptions: {
      keepAlive: 120
    }
  }
});

module.exports = mongoose;
