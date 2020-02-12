import * as Discord from 'discord.js'
import * as fs from 'fs'
import * as mongodb from 'mongodb'
import * as path from 'path'
import { DiscordBot } from './lib/bot'
import { BotDatabase } from './lib/bot-database'
import { RoleCommand } from './lib/commands/add-role'
import { AllowRoleCommand } from './lib/commands/allow-role'
import { DeployedCommand } from './lib/commands/deployed'
import { DisallowRoleCommand } from './lib/commands/disallow-role'
import { PingCommand } from './lib/commands/ping'
import { RemoveRoleCommand } from './lib/commands/remove-role'
import { StatsCommand } from './lib/commands/stats'
import { UploadCommand } from './lib/commands/upload'
import { Database } from './lib/database'
import { EventsAnnouncer } from './lib/events-announcer'
import { LoggerFactory } from './lib/logger'

abstract class Bootstrap {
  private static log = LoggerFactory.create(Bootstrap)

  static async init() {
    const isProd = process.env.NODE_ENV === 'production'
    this.log.info('Using environment', isProd ? 'production' : 'development', { isProd })

    const db = new Database(new mongodb.MongoClient())
    const botDb = new BotDatabase(new mongodb.MongoClient())
    const bot = new DiscordBot(new Discord.Client())
    this.registerCommands(bot, db, botDb)

    try {
      await Promise.all([
        db.connect(process.env.DB_FPARMA_URI),
        botDb.connect(process.env.DB_BOT_URI),
        bot.connect(process.env.BOT_TOKEN, isProd),
      ])
    } catch (err) {
      this.log.fatal('An error occured during launch', err)
      process.exit(1)
    }

    if (isProd) {
      this.setupAnnouncer(db, bot)
    }
    this.log.info('Started')
  }

  private static setupAnnouncer(db: Database, bot: DiscordBot) {
    const channel = bot.client.channels.get('258530805138194442') as Discord.TextChannel

    if (channel && channel.guild) {
      const role = channel.guild.roles.get('457225971406340097') as Discord.Role
      // channels has an incorrect typescript definition
      const announcer = new EventsAnnouncer(db, channel, role)
      announcer.pollNewEvents()
    }
  }

  private static registerCommands(bot: DiscordBot, db: Database, botDb: BotDatabase) {
    bot.registerCommand(new PingCommand())
    bot.registerCommand(new StatsCommand(db))
    bot.registerCommand(new DeployedCommand())
    bot.registerCommand(new RoleCommand(botDb))
    bot.registerCommand(new RemoveRoleCommand(botDb))

    bot.registerCommand(new AllowRoleCommand(botDb))
    bot.registerCommand(new DisallowRoleCommand(botDb))

    const tempFolder = path.join(__dirname, 'temp')
    fs.mkdir(tempFolder, err => {
      if (err && err.code !== 'EEXIST') {
        this.log.fatal('Failed to create temp folder')
        throw err
      }

      bot.registerCommand(new UploadCommand(tempFolder))
    })
  }
}

Bootstrap.init()

// Exit on unhandled rejections
process.on('unhandledRejection', error => {
  console.error('Exiting due to unhandled promise rejection', error)
  process.exit(1)
})
