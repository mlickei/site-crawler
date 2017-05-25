const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../relations/User');
const config = require('./config');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: config.secret
};

module.exports = new JwtStrategy(opts, (jwt_payload, done) => {
  User.findById(jwt_payload.sub, (err, user) => {
    if(err) return done(err, false);
    else return done(null, user);
  });
});
