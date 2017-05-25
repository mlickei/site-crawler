const config = require('./config');

const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: config.sql_database_host,
    user: config.sql_database_user,
    password: config.sql_database_password,
    database: config.sql_database_name
  }
});

module.exports = require('bookshelf')(knex).plugin('registry');
