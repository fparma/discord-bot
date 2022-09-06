import { Guild, Message } from 'discord.js'
import { Database } from './../database'
import { Command } from './command'
import { BotDatabase } from '../bot-database'
import { isMessageInGuildChannel } from '../util/discord'
import { LoggerFactory } from '../logger'
import * as Messages from '../messages'

export class RolesCommand implements Command {
  readonly type = '!roles'
  readonly usageInfo = 'Lists available user-assignable roles.'
  readonly rateLimit = 0
  readonly onlyMods = false
  private log = LoggerFactory.create(RolesCommand)

  constructor(private db: BotDatabase) {}

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    if (!isMessageInGuildChannel(message)) {
      return sendReply('This command can only be used in a guild channel')
    }

    try {
      const guild = message.guild as Guild
      message.channel.sendTyping()
      const allowedRoles = await this.db.getUserRoles()

      const roles = guild.roles.cache
        .filter((role) => allowedRoles.includes(role.id))
        .map((role) => role.name)
        .sort((a, b) => a.localeCompare(b))

      sendReply(`Available roles: ${roles.join(', ')}`)
    } catch (err) {
      this.log.error(err)
      sendReply(Messages.UNKNOWN_ERROR)
    }
  }
}
