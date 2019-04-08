import * as Discord from 'discord.js';
import * as fs from 'fs';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { DiscordBot } from './lib/bot';
import { AppCache } from './lib/cache';
import { AutobanCommand } from './lib/commands/autoban';
import { DeployedCommand } from './lib/commands/deployed';
import { PingCommand } from './lib/commands/ping';
import { StatsCommand } from './lib/commands/stats';
import { UploadCommand } from './lib/commands/upload';
import { Database } from './lib/database';
import { EventsAnnouncer } from './lib/events-announcer';
import { LoggerFactory } from './lib/logger';
import { banMember } from './lib/util/banMember';

abstract class Bootstrap {
  private static log = LoggerFactory.create(Bootstrap);

  static async init() {
    this.log.info('Using environment', process.env.NODE_ENV || 'development');

    const db = new Database(new mongodb.MongoClient());
    const bot = new DiscordBot(new Discord.Client());
    this.registerCommands(bot, db);

    try {
      await Promise.all([
        db.connect(process.env.DB_URI),
        bot.connect(process.env.BOT_TOKEN)
      ]);
    } catch (err) {
      this.log.fatal('An error occured during launch', err);
      process.exit(1);
    }

    this.setupAnnouncer(db, bot);
    this.setupAutoban(bot)
    this.log.info('Started');
  }

  private static setupAnnouncer(db: Database, bot: DiscordBot) {
    const channel = bot.client.channels.get('258530805138194442');
    // channels has an incorrect typescript definition
    const announcer = new EventsAnnouncer(db, channel as any);
    announcer.pollNewEvents();
  }

  private static setupAutoban(bot: DiscordBot) {
    bot.client.on('guildMemberAdd', async member => {
      if (!member) return
      const { id, nickname } = member

      try {
        const { autoBan } = AppCache.read()

        if (autoBan.hasOwnProperty(id)) {
          this.log.info('Autobanning user', { id, nickname })
          await banMember(member, autoBan[id])
        }
      } catch (err) {
        this.log.error('Unable to autoban user', { id, nickname }, err)
      }
    })
  }

  private static registerCommands(bot: DiscordBot, db: Database) {
    bot.registerCommand(new PingCommand());
    bot.registerCommand(new StatsCommand(db));
    bot.registerCommand(new DeployedCommand());
    bot.registerCommand(new AutobanCommand());

    const tempFolder = path.join(__dirname, 'temp');
    fs.mkdir(tempFolder, (err) => {
      if (err && err.code !== 'EEXIST') {
        this.log.fatal('Failed to create temp folder');
        throw err;
      };

      bot.registerCommand(new UploadCommand(tempFolder));
    });
  }
}

Bootstrap.init();

// Exit on unhandled rejections
process.on('unhandledRejection', error => {
  console.error('Exiting due to unhandled promise rejection', error);
  process.exit(1);
});
