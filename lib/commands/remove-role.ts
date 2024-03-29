import { Guild, Message } from 'discord.js'
import { BotDatabase } from '../bot-database'
import { Command } from './command'
import { isMessageInGuildChannel, getMemberFromMessage, stringToRoles } from '../util/discord'
import { LoggerFactory } from '../logger'
import * as Messages from '../messages'

export class RemoveRoleCommand implements Command {
  readonly type = '!removerole'
  readonly usageInfo = 'Removes assigned role(s). Usage: !removerole role-to-add role-to-add-2'
  readonly onlyMods = false
  readonly rateLimit = 0
  private log = LoggerFactory.create(RemoveRoleCommand)

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
      if (!member) return

      const assignable = roleIds.filter((role) => member.roles.cache.has(role))
      this.log.info('removing roles to user', message.author.username, assignable)

      if (assignable.length === 0) return

      await member.roles.remove(assignable)
      await message.react(Messages.CHECK_MARK)
    } catch (err) {
      this.log.error(err)
      return sendReply(Messages.UNKNOWN_ERROR)
    }
  }
}
