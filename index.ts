import { StatsCommand } from './lib/commands/stats';
import { Database } from './lib/database';
import * as Discord from 'discord.js';
import { DiscordBot } from './lib/bot';
import { PingCommand } from './lib/commands/ping';
import * as mongodb from 'mongodb';
import { LoggerFactory } from './lib/logger';

const log = LoggerFactory.create('bootstrap');
log.info('Using environment', process.env.NODE_ENV);

(async function () {
  const db = new Database(new mongodb.MongoClient());
  const bot = new DiscordBot(new Discord.Client());
  bot.registerCommand(new PingCommand());
  bot.registerCommand(new StatsCommand(db));

  await Promise.all([
    db.connect(String(process.env.DB_URL)),
    bot.connect(String(process.env.BOT_TOKEN))
  ]);

  log.info('Started');
})();
