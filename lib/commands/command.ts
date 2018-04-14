import { Database } from './../database';
import { Message } from 'discord.js';

export interface Command {
  readonly type: string;
  readonly usageInfo: string;
  readonly rateLimit: number;

  handleMessage(
    arg: string,
    sendReply: (message: string | string[]) => void,
    message: Message
  ): void;
}
