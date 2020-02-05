import { LoggerFactory } from './../logger'
import { Database } from './../database'
import { Message } from 'discord.js'
import * as Messages from '../messages'
import { Command } from './command'

export class StatsCommand implements Command {
  readonly type = '!stats'
  readonly usageInfo = 'Get event stats for user. Usage: !stats (website username OR steamID64)'
  readonly rateLimit = 4
  private static log = LoggerFactory.create(StatsCommand)

  constructor(private db: Database) {}

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    if (!arg) return sendReply(Messages.REPLY_PROVIDE_ARGUMENT)

    message.channel.startTyping()
    const reply = await StatsCommand.getUserStatsOrErrorMessage(this.db, arg)

    message.channel.stopTyping()
    sendReply(reply)
  }

  private static async getUserStatsOrErrorMessage(db: Database, userNameOrSteamId: string): Promise<string> {
    try {
      this.log.debug('Searching user', userNameOrSteamId)
      const user = await db.findOneUser(userNameOrSteamId)

      if (!user) {
        this.log.debug('No such user', userNameOrSteamId)
        return Messages.DB_USER_NOT_FOUND
      }

      this.log.debug('Found user', user.name, user.steam_id)
      const count = await db.countUserAttendance(user.steam_id)

      return Messages.REPLY_USER_STATS(user.name, user.created_at, count)
    } catch (err) {
      this.log.error('Error searching user or attendance:', err)
      return Messages.DB_ERROR
    }
  }
}
