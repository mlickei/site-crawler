const config = require('./utils/config');
const cron = require('./cron');
const knex = require('./utils/bookshelf').knex;
const db = require('mongojs')(config.nosql_database_connection_string);
const colors = require('colors');
const spawn = require('child_process').spawn;
const shell = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  completer(line){
    let completions = line ? Command.Aliases : [];
    const hits = completions.filter(completion => completion.indexOf(line) == 0);
    return [hits&&hits.length>0 ? hits : completions, line];
  }
});

const startTime = Date.now();

const prompt1 = 'sh> '.green;
const prompt2 = '  * '.red;
const prompt3 = '  - '.grey;

function formatTimeDifference(ms){
  const ms2m = 60000;
  const ms2h = 3600000;
  const ms2d = 86400000;
  const days = (ms/ms2d)|0;
  const hours = ((ms -= days * ms2d)/ms2h)|0;
  const minutes = ((ms -= hours * ms2h)/ms2m)|0;
  const seconds = Math.round((ms -= minutes * ms2m)/10)/100;
  return [days>0?days+'d':'',
          hours>0?hours+'h':'',
          minutes>0?minutes+'m':'',
          seconds>0?seconds+'s':'']
          .filter(s => s.length>0).join(' ');
}

function trace(...strs){
  config.debug && strs && strs.forEach(console.log);
}

function hidden(query, callback) {
  const stdin = process.openStdin();
  const onPasswordEntry = (char) => {
    char = char + "";
    switch (char) {
      case "\n": case "\r": case "\u0004":
        stdin.removeListener('data', onPasswordEntry);
        break;
      default:
        process.stdout.write("\033[2K\033[200D" + query + Array(shell.line.length+1).join("*"));
        break;
    }
  };

  process.stdin.on('data', onPasswordEntry);

  shell.question(query, (value) => {
    shell.history = shell.history.slice(1);
    callback(value);
  });
}

function authenticate(callback){
  hidden('Password: ', (value) => {
    config.password = value;
    callback();
  });
}

function execute(line){
  const [cmd, ...args] = line.split(/('.*?'|".*?"|\S+)/g).filter(s=>s.trim()).map(s=>s.replace(/"(.*)"/g,"$1"));
  for(const command of Command.List)
    if(command.is(cmd)) return command.execute(args);
}

function printHeader(withIntro = true){
  const message = `| ${config.ssl ? 'HTTPS' : 'HTTP'} server running on port ${config.port} |`;
  const border = `+${'-'.repeat(message.length-2)}+`;
  const intro = withIntro ? 'm\'shell v0.1 (type "help")' : '';
  console.log(`${border}\n${message}\n${border}\n${' '.repeat(message.length/3-8) + intro}\n`.cyan);
}

function start(){
  printHeader();
  shell.setPrompt(prompt1);
  shell.prompt();
  shell.on('line', (line) => {
    const result = execute(line);
    result ? result.then(() => shell.prompt()) : shell.prompt();
  });
}

module.exports = !config['no-shell'] ?
{authenticate, start, trace}
:
{
  trace,
  start(){ printHeader(false) },
  authenticate(){}
}

function Command({aliases, help, execute = ()=>undefined}){
  if(typeof aliases === 'string') aliases = [aliases];
  aliases = aliases.map(alias => alias.toLowerCase());
  this.aliases = aliases;
  this.help = help;
  this.execute = execute.bind(this);
  this.is = (cmd) => cmd&&aliases.includes(cmd.toLowerCase());
  Command.List.push(this);
  Command.Aliases = Command.Aliases.concat(aliases);
}
Command.List = [];
Command.Aliases = [];
Command.Dangerous = function(properties){
  properties.help = properties.help + ' (dangerous!)'.red;
  Command.call(this, properties);
}
Command.Unstable = function(properties){
  properties.help = properties.help + ' (unstable!)'.yellow;
  Command.call(this, properties);
}
Command.print = (message) => console.log(`${prompt2}${message}`);
Command.prompt = (message, exec) => {
  return (args) => {
    shell.question(`${prompt2}${message} (y/n): `, (answer) => {
      if(Command.Yes.is(answer)) exec(args);
      shell.write('\n');
    });
  };
};

Command.Yes = new Command({aliases: ['yes', 'y']});
Command.No = new Command({aliases: ['no', 'n']});
Command.Help = new Command({
  aliases: ['help', 'man', 'command-list'],
  execute: (args) => {
    Command.List
    .sort((a,b) => {
      const _a = a.aliases[0], _b = b.aliases[0];
      if(_a < _b) return -1;
      else if(_a > _b) return 1;
      return 0;
    })
    .filter(command => command.help)
    .forEach((command,index) => {
      const [primary, ...aliases] = command.aliases;
      Command.print(`${primary}${(aliases.length>0?' ':'') + aliases.join('/').grey}: ${command.help.italic}`);
    });
  }
});
Command.Exit = new Command({
  aliases: ['exit', 'quit', 'kill'],
  help: 'Kill the server',
  execute: Command.prompt('Are you sure?', (args) => {
    process.exit(0);
  })
});
Command.Config = new Command({
  aliases: ['config', 'info'],
  help: 'Get configuration settings',
  execute: ([key = 'all', ...rest]) => {
    if(~['list','all','help'].indexOf(key)) {
      for(let k in config) {
        let v = config[k];
        if(typeof v == 'string') v = `"${v}"`;
        Command.print(`${k}: ${(''+v).grey}`);
      }
    } else Command.print(config[key]);
  }
});
Command.Time = new Command({
  aliases: ['time', 'up-time', 'start-time'],
  help: 'Details about server up time',
  execute: () => {
    Command.print(`Start time: ${new Date(startTime)}`);
    Command.print(`Up time: ${formatTimeDifference(Date.now() - startTime)}`);
  }
});
Command.Eval = new Command.Dangerous({
  aliases: ['eval'],
  help: 'Evaluate expression',
  execute: ([expr,...rest]) => {
    try {
      Command.print(eval(expr));
    } catch (e) {
      Command.print(e);
    }
  }
});
Command.Sql = new Command.Dangerous({
  aliases: ['sql'],
  help: 'Query SQL database',
  execute: ([query, ...rest]) => {
    const queryStart = Date.now();
    if(!query) return;
    return new Promise(async (resolve, reject) => {
      try {
        const [result, ...rest] = await knex.raw(query);
        result.forEach(r => Command.print(JSON.stringify(r)));
      } catch (e) {
        Command.print(e);
      }
      Command.print(`Execution time: ${Date.now() - queryStart}ms`.grey);
      resolve();
    });
  }
});
Command.NoSql = new Command.Unstable({
  aliases: ['nosql'],
  help: 'Query NoSQL database',
  execute: ([query, ...rest]) => {
    const queryStart = Date.now();
    if(!query) return;
    return new Promise(async (resolve, reject) => {
      eval(query).forEach((error, result) => {
        if(!result) {
          Command.print(`Execution time: ${Date.now() - queryStart}ms`.grey);
          resolve();
        }
        else if(!error) Command.print(JSON.stringify(result));
        else Command.print(error);
      });
    });
  }
});
Command.Cron = new Command.Unstable({
  aliases: ['cron'],
  help: 'Access to cronjob',
  execute: ([job, func, ...params]) => {
    job = cron[job];
    if(job && job[func]){
      func = job[func];
      if(func.apply) func.apply(job, params);
    }
  }
});
