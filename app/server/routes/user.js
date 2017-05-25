const express = require('express');

const passport = require('passport');
const jwt = require('jsonwebtoken');

const shell = require('../shell');
const response = require('./response');
const config = require('../utils/config');
const passportStrategy = require('../utils/passport-strategy');

const User = require('../relations/User');

const router = express.Router();

function token(user) {
  return {
    name: user.get('name'),
    id: user.get('id'),
    token: `JWT ${jwt.sign(user, config.secret, {subject: String(user.id), expiresIn: 172800})}`
  };
}

router.get('/profile', passport.authenticate('jwt', {session: false}), (req, res, next) => {

  res.json(response.success('Profile goes here'));

});

router.post('/authenticate', async (req, res, next) => {

  let json;

  try {
    const user = await new User.Model({name: req.body.name}).fetch();

    if(!user) json = response.failure('User does not exist');
    else if(!(await user.authenticate(req.body.password))) json = response.failure('Invalid credentials');
    else json = token(user);
  } catch (e) {
    shell.trace(e);
    json = response.failure('Error while logging in');
  }

  res.json(json);

});

router.post('/register', async (req, res, next) => {

  let json;

  try {
    const user = new User.Model({name: req.body.name});

    if(await user.fetch()) json = response.failure('Username already exists');
    else json = token(await user.save('password', req.body.password));
  } catch (e) {
    shell.trace(e);
    json = response.failure('Error while registering');
  }

  res.json(json);

});

module.exports = router;
