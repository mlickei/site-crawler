const args = require('./command-line-args');
let config;

try {
  config = require('../../../config.json');
} catch (e) {
  config = {};
}

const defaults = {
  "debug": true,
  "port": 3000,
	"secret": "abc@123",
  "ssl": false,
  "ssl_key": "",
  "ssl_cert": "",
  "sql_database_host": "localhost",
  "sql_database_user": "root",
  "sql_database_password": "",
  "sql_database_name": "",
  "nosql_database_host": "localhost",
  "nosql_database_user": "root",
  "nosql_database_password": "",
  "nosql_database_name": ""
};

for(let key in config) defaults[key] = config[key];
for(let key in args) defaults[key] = args[key];

const nosqlAuth = config.nosql_database_user && config.nosql_database_password ?
  `${config.nosql_database_user}:${config.nosql_database_password}@` : '';

defaults.nosql_database_connection_string = `mongodb://${nosqlAuth}${defaults.nosql_database_host}/${config.nosql_database_name}`;

module.exports = defaults;
