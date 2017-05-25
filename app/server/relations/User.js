const bcrypt = require('bcryptjs');
const Bookshelf = require('../utils/bookshelf');
const shell = require('../shell');
const tableName = 'users';

// Require related models here
const User = Bookshelf.model('User', {

  tableName,

  initialize(){
    this.on('creating', async (model, attrs, options) => {
      try {
        this.set('password', await bcrypt.hash(this.get('password'), 10));
      } catch (e) {
        shell.trace(e);
      }
    });
  },

  authenticate(password){
    return bcrypt.compare(password, this.get('password'));
  },

  // Add relationships here. See Bookshelf.js documentation

});

module.exports = {
  Model: User,
  Collection: Bookshelf.Collection.extend({model: User}),
  get QueryBuilder(){ return Bookshelf.knex(tableName) },
  get Query(){ return Bookshelf.knex.raw }
}
