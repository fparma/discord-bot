import { Logger } from './../logger';
import { Database } from './../database';
import { Message } from 'discord.js';
import { AbstractCommand } from './command';
import * as Messages from '../messages';

export class StatsCommand extends AbstractCommand {
  readonly type = '!stats';
  readonly usageInfo = 'Get event stats for user. Usage: !stats (website username OR steamID64)';
  private static log = new Logger(StatsCommand);

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message, db: Database, ) {
    message.channel.startTyping();
    const reply = await StatsCommand.getUserStatsOrErrorMessage(db, arg);

    message.channel.stopTyping();
    sendReply(reply);
  }

  private static async getUserStatsOrErrorMessage(db: Database, userNameOrSteamId: string): Promise<string> {
    try {
      this.log.debug('Searching user', userNameOrSteamId);
      const user = await db.findOneUser(userNameOrSteamId);

      if (!user)  {
        this.log.debug('No such user', userNameOrSteamId);
        return Messages.DB_USER_NOT_FOUND;
      }

      this.log.debug('Found user', user.name, user.steam_id);
      const count = await db.countUserAttendance(user.steam_id);

      return Messages.USER_STATS_REPLY(user.name, user.created_at, count);
    } catch (err) {
      this.log.error('Error searching user or attendance:', err);
      return Messages.DB_ERROR;
    }
  }
}
