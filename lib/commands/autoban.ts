import { Message } from "discord.js";
import { AppCache } from '../cache';
import * as Messages from '../messages';
import { banMember } from '../util/banMember';
import { LoggerFactory } from "./../logger";
import { Command } from "./command";

export class AutobanCommand implements Command {
  private log = LoggerFactory.create(AutobanCommand);
  readonly type = "!test";
  readonly usageInfo = "Automatically permaban bans user if connected or on joining";
  readonly requireAdmin = true
  readonly rateLimit = 10;

  async handleMessage(
    arg: string,
    sendReply: (message: string | string[]) => void,
    message: Message
  ) {
    const [id, ...rest] = arg.split(' ')
    if (!id.trim()) return sendReply(Messages.REPLY_PROVIDE_ARGUMENT)
    message.channel.startTyping();

    try {
      const reason = rest.join(' ').trim()
      const member = message.mentions.members.first() || message.guild.members.get(id)

      if (member) {
        const banned = await banMember(member, reason)
        if (banned) {
          sendReply(Messages.MEMBER_BANNED)
        } else {
          this.log.error('Unable to ban user', member.nickname, member.id)
          sendReply(Messages.MEMBER_CANNOT_BAN)
        }
      } else {
        const strippedId = id.replace(/\D/g, '')
        this.banOnJoin(strippedId, reason)
        sendReply(Messages.MEMBER_WILL_BE_BANNED)
      }
    } catch (e) {
      this.log.error(e)
      sendReply(Messages.UNKNOWN_ERROR)
    } finally {
      message.channel.stopTyping();
    }
  }

  async banOnJoin(id: string, reason: string = '') {
    const cache = AppCache.read()
    AppCache.write({ ...cache, autoBan: { ...cache.autoBan, [id]: reason } })
    this.log.info('Stored ID to autoban', id, reason)
  }
}