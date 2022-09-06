import { Guild, Message } from 'discord.js'
import { BotDatabase } from '../bot-database'
import { Command } from './command'
import { isMessageInGuildChannel, getMemberFromMessage, stringToRoles } from '../util/discord'
import { LoggerFactory } from '../logger'
import * as Messages from '../messages'

export class RoleCommand implements Command {
  readonly type = '!role'
  readonly usageInfo = 'Adds whitelisted role(s). Usage: !role role-to-add role-to-add-2'
  readonly rateLimit = 0
  readonly onlyMods = false
  private log = LoggerFactory.create(RoleCommand)

  constructor(private db: BotDatabase) {}

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    if (!isMessageInGuildChannel(message)) {
      return sendReply('This command has to be used in a public channel')
    }

    const roles = await stringToRoles(message.guild as Guild, arg.split(' '))
    if (roles.size === 0) return sendReply('Found no matching roles')

    const roleIds = roles.map((role) => role.id)

    try {
      const allowedRoles = await this.db.getUserRoles()
      const allOk = roleIds.every((role) => allowedRoles.includes(role))

      if (!allOk) {
        this.log.warn(
          'Not allowed assign',
          message.author.username,
          roles.map((role) => role.name),
          roleIds,
          allowedRoles
        )
        return sendReply('One or more of the provided roles are not whitelisted')
      }

      const member = await getMemberFromMessage(message)
      if (!member) {
        this.log.warn('could not fetch member', message.author.id)
        return
      }

      const assignable = roleIds.filter((role) => !member.roles.cache.has(role))
      // member already have all roles
      if (assignable.length === 0) {
        await message.react(Messages.CHECK_MARK)
        return
      }

      this.log.info('assigning roles to user', message.author.username, assignable)
      await member.roles.add(assignable)
      await message.react(Messages.CHECK_MARK)
    } catch (err) {
      this.log.error(err)
      return sendReply(Messages.UNKNOWN_ERROR)
    }
  }
}
