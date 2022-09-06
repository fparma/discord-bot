import { Guild, Message } from 'discord.js'
import { BotDatabase } from '../bot-database'
import { LoggerFactory } from '../logger'
import * as Messages from '../messages'
import { isMessageInGuildChannel, stringToRoles } from '../util/discord'
import { Command } from './command'

export class DisallowRoleCommand implements Command {
  readonly type = '!disallowrole'
  readonly usageInfo = 'Removes a user assignable role. Usage: !disallowrole arma-event'
  readonly onlyMods = true
  readonly rateLimit = 0

  private log = LoggerFactory.create(DisallowRoleCommand)
  constructor(private db: BotDatabase) {}

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    if (!isMessageInGuildChannel(message)) {
      return sendReply('This command can only be used in a guild channel')
    }

    const roles = await stringToRoles(message.guild as Guild, arg.split(' '))
    if (roles.size === 0) return sendReply('Found no matching roles')

    const ids = roles.map(role => role.id)

    try {
      this.log.info('Removing user roles', { author: message.author.username + '_' + message.author.id }, ids)
      await this.db.removeUserRoles(ids)
      await message.react(Messages.CHECK_MARK)
    } catch (err) {
      this.log.error('Failed to remove user roles', err)
      return sendReply(Messages.UNKNOWN_ERROR)
    }
  }
}
