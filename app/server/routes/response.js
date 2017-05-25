module.exports = {

  failure(msg){ return {success: false, msg}; },

  success(msg){ return {succes: true, msg}; }

};
