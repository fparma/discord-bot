import { Message } from 'discord.js'
import { BotDatabase } from '../bot-database'
import { Command } from './command'
import { isMessageInGuildChannel, getMemberFromMessage, stringToRoles } from '../util/discord'
import { LoggerFactory } from '../logger'
import * as Messages from '../messages'

export class RoleCommand implements Command {
  readonly type = '!role'
  readonly usageInfo = 'Adds whitelist roles. Usage: !role arma-event more'
  readonly rateLimit = 0
  readonly onlyMods = false
  private log = LoggerFactory.create(RoleCommand)

  constructor(private db: BotDatabase) {}

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    if (!isMessageInGuildChannel(message)) {
      return sendReply('This command has to be used in a public channel')
    }

    const roles = stringToRoles(message.guild, arg.split(' '))
    if (roles.size === 0) return sendReply('Found no matching roles')

    const roleIds = roles.map(role => role.id)

    try {
      const allowedRoles = await this.db.getUserRoles()
      const allOk = roleIds.every(role => allowedRoles.includes(role))

      if (!allOk) {
        this.log.warn(
          'Not allowed assign',
          message.author.username,
          roles.map(role => role.name),
          roleIds,
          allowedRoles
        )
        return sendReply('One or more of the provided roles are not whitelisted')
      }

      const member = getMemberFromMessage(message)
      const assignable = roleIds.filter(role => !member.roles.has(role))
      this.log.info('assigning roles to user', message.author.username, assignable)

      if (assignable.length === 0) return

      await member.addRoles(assignable)
      await message.react('✅')
    } catch (err) {
      this.log.error(err)
      return sendReply(Messages.UNKNOWN_ERROR)
    }
  }
}