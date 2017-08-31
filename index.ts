import { StatsCommand } from './lib/commands/stats';
import { Database } from './lib/database';
import * as Discord from 'discord.js';
import { DiscordBot } from './lib/bot';
import { PingCommand } from './lib/commands/ping';
import * as mongodb from 'mongodb';

(async function () {
  const db = new Database(new mongodb.MongoClient());
  await db.connect(String(process.env.DB_URL));

  const bot = new DiscordBot(new Discord.Client(), db);
  bot.registerCommand(new PingCommand());
  bot.registerCommand(new StatsCommand());
  
  await bot.connect(String(process.env.BOT_TOKEN));
})();
