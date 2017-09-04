import { StatsCommand } from './lib/commands/stats';
import { Database } from './lib/database';
import * as Discord from 'discord.js';
import { DiscordBot } from './lib/bot';
import { PingCommand } from './lib/commands/ping';
import * as mongodb from 'mongodb';
import { LoggerFactory } from './lib/logger';
import { EventsAnnouncer } from './lib/events-announcer';
import { Message } from 'discord.js';

abstract class Bootstrap {
  private static log = LoggerFactory.create(Bootstrap);

  static async init() {
    this.log.info('Using environment', process.env.NODE_ENV || 'development');

    const db = new Database(new mongodb.MongoClient());
    const bot = new DiscordBot(new Discord.Client());
    this.registerCommands(bot, db);


    try {
      await Promise.all([
        db.connect(process.env.DB_URL),
        bot.connect(process.env.BOT_TOKEN)
      ]);
    } catch (err) {
      this.log.fatal('An error occured during launch', err);
      process.exit(1);
    }

    this.setupAnnouncer(db, bot);
    this.log.info('Started');
  }

  private static setupAnnouncer(db: Database, bot: DiscordBot) {
    // TODO: correct channel
    const channel = bot.client.users.find('id', '106088065050632192'); //bot.client.channels.find('id', '258530805138194442');
    const announcer = new EventsAnnouncer(db, channel);
    announcer.pollNewEvents();
  }

  private static registerCommands(bot: DiscordBot, db: Database) {
    bot.registerCommand(new PingCommand());
    bot.registerCommand(new StatsCommand(db));
  }
}

Bootstrap.init();
