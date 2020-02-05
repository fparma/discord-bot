import { Message } from 'discord.js'
import { Database } from './../database'
import { Command } from './command'

export class PingCommand implements Command {
  readonly type = '!ping'
  readonly usageInfo = 'replying with the pong'
  readonly rateLimit = 0
  private static readonly reply = 'pong!'

  handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    sendReply(PingCommand.reply)
  }
}
