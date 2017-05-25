const Mongoose = require('../utils/mongoose');

// See Mongoose.js documentation
const ExampleSchema = new Mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true
  }
});

const Example = Mongoose.model('Example', ExampleSchema);

module.exports = {
  Model: Example
};
