import { GuildMember, Message, PermissionResolvable } from 'discord.js'
import { BotDatabase } from '../bot-database'
import * as Messages from '../messages'
import { Command } from './command'
import { LoggerFactory } from '../logger'
import { isModerator, isMessageInGuildChannel, getMemberFromMessage, stringToRoles } from '../util/discord'

const INVALID_PERMISSION_ROLE: PermissionResolvable[] = [
  'ADMINISTRATOR',
  'KICK_MEMBERS',
  'BAN_MEMBERS',
  'MANAGE_CHANNELS',
  'MANAGE_GUILD',
  'VIEW_AUDIT_LOG',
  'MANAGE_MESSAGES',
  'MENTION_EVERYONE',
  'CHANGE_NICKNAME',
  'MANAGE_NICKNAMES',
  'MANAGE_ROLES',
  'MANAGE_ROLES_OR_PERMISSIONS',
  'MANAGE_WEBHOOKS',
  'MANAGE_EMOJIS',
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

    const member = getMemberFromMessage(message)
    if (!isModerator(member)) return

    const roles = stringToRoles(message.guild, arg.split(' '))
    if (roles.size === 0) return sendReply('Please provide roles')

    const notOkRoles: string[] = []
    const ids = roles.map(role => {
      if (INVALID_PERMISSION_ROLE.some(permission => role.hasPermission(permission))) {
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
      await message.react('✅')
    } catch (err) {
      this.log.error('Failed to save user roles', err)
      return sendReply(Messages.UNKNOWN_ERROR)
    }
  }
}
