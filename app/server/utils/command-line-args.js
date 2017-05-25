const argsArray = process.argv.splice(2);
const argsObject = {};

argsArray.forEach((arg) => {
  const argArray = arg.split('=');
  argsObject[argArray[0].trim()] = argArray[1] ? argArray[1].trim() : true;
});

module.exports = argsObject;
