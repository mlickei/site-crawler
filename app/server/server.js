const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

global.Promise = require('bluebird');

const config = require('./utils/config');
const passportStrategy = require('./utils/passport-strategy');

const userRoute = require('./routes/user');
const exampleSocket = require('./sockets/ExampleSocket');

const shell = require('./shell');
const cron = require('./cron');

passport.use(passportStrategy);

const app = express()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({
    extended: true
  }))
  .use(passport.initialize())
  .use(passport.session())
  .use('/', express.static(
    path.join(__dirname, '../client/build')
  ))
  .use('/user', userRoute);
  // Add additional routes here.

let server;

if(!config.ssl) {
  server = require('http').createServer(app);
} else {
  const fs = require('fs');
  const key = fs.readFileSync(config.ssl_key);
  const cert = fs.readFileSync(config.ssl_cert);
  server = require('https').createServer({key, cert}, app).listen(config.port, shell.start);
}

const io = require('socket.io')(server);

exampleSocket(io);

server.listen(config.port, shell.start);
