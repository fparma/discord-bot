import { Message } from 'discord.js';
import { Database } from './../database';
import { AbstractCommand } from './command';

export class PingCommand extends AbstractCommand {
  readonly type = '!ping';
  readonly usageInfo = 'replying with the pong';
  private static reply = 'pong!';

  handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message, db: Database) {
    sendReply(PingCommand.reply);
  }
}
