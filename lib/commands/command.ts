import { Database } from './../database';
import { Message } from 'discord.js';

export abstract class AbstractCommand {
  public abstract type: string;
  public abstract usageInfo: string;
  public readonly rateLimit: number = 0;

  public abstract handleMessage(
    arg: string,
    sendReply: (message: string | string[]) => void,
    message: Message,
    db: Database,
  ): void;
}
