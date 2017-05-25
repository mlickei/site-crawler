module.exports = {
  extend(definition){
    return function(io){
      io.on('connect', socket => definition.call(socket, io))
    };
  }
};
