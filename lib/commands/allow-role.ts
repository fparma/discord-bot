import { Guild, Message, PermissionResolvable } from 'discord.js'
import { BotDatabase } from '../bot-database'
import { LoggerFactory } from '../logger'
import * as Messages from '../messages'
import { isMessageInGuildChannel, stringToRoles } from '../util/discord'
import { Command } from './command'

const INVALID_PERMISSION_ROLE: PermissionResolvable[] = [
  'Administrator',
  'KickMembers',
  'BanMembers',
  'ManageChannels',
  'ManageGuild',
  'ViewAuditLog',
  'ManageMessages',
  'MentionEveryone',
  'ChangeNickname',
  'ManageNicknames',
  'ManageRoles',
  'ManageWebhooks',
  'ManageMessages',
]

export class AllowRoleCommand implements Command {
  readonly type = '!allowrole'
  readonly usageInfo = 'Whitelists a role. Usage: !allowrole arma-event'
  readonly onlyMods = true
  readonly rateLimit = 0

  private log = LoggerFactory.create(AllowRoleCommand)
  constructor(private db: BotDatabase) {}

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    if (!isMessageInGuildChannel(message)) {
      return sendReply('This command can only be used in a guild channel')
    }

    const roles = await stringToRoles(message.guild as Guild, arg.split(' '))
    if (roles.size === 0) return sendReply('Found no matching roles')

    const notOkRoles: string[] = []
    const ids = roles.map(role => {
      if (INVALID_PERMISSION_ROLE.some(permission => role.permissions.has(permission))) {
        notOkRoles.push(role.name)
      }
      return role.id
    })

    if (notOkRoles.length > 0) {
      return sendReply([
        'One or more roles has permissions that makes them not user assignable:',
        notOkRoles.join(', '),
      ])
    }

    try {
      this.log.info('Saving user roles', { author: message.author.username + '_' + message.author.id }, ids)
      await this.db.saveUserRoles(ids)
      await message.react(Messages.CHECK_MARK)
    } catch (err) {
      this.log.error('Failed to save user roles', err)
      return sendReply(Messages.UNKNOWN_ERROR)
    }
  }
}
