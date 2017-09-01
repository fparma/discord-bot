import { StatsCommand } from './lib/commands/stats';
import { Database } from './lib/database';
import * as Discord from 'discord.js';
import { DiscordBot } from './lib/bot';
import { PingCommand } from './lib/commands/ping';
import * as mongodb from 'mongodb';
import { LoggerFactory } from './lib/logger';

abstract class Bootstrap {
  private static log = LoggerFactory.create(Bootstrap);

  static async init() {
    this.log.info('Using environment', process.env.NODE_ENV);

    const db = new Database(new mongodb.MongoClient());
    const bot = new DiscordBot(new Discord.Client());
    this.registerCommands(bot, db);

    try {
      await Promise.all([
        db.connect(String(process.env.DB_URL)),
        bot.connect(String(process.env.BOT_TOKEN))
      ]);
    } catch (err) {
      this.log.fatal('An error occured during launch', err);
      process.exit(1);
    }

    this.log.info('Started');
  }

  private static registerCommands(bot: DiscordBot, db: Database) {
    bot.registerCommand(new PingCommand());
    bot.registerCommand(new StatsCommand(db));
  }
}

Bootstrap.init();
