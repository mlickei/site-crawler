const Bookshelf = require('../utils/bookshelf');
const shell = require('../shell');
const tableName = 'example_relations';

require('./User');
const ExampleRelation = Bookshelf.model('ExampleRelation', {

  tableName,

  user(){ return this.belongsTo('User'); },

});

module.exports = {
  Model: ExampleRelation,
  Collection: Bookshelf.Collection.extend({model: ExampleRelation}),
  get QueryBuilder(){ return Bookshelf.knex(tableName) },
  get Query(){ return Bookshelf.knex.raw }
}
