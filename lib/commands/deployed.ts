import { LoggerFactory } from './../logger';
import { Message } from 'discord.js';
import { Database } from './../database';
import { Command } from './command';
import { SftpHandler } from '../util/sftp';
import * as Messages from '../messages';

export class DeployedCommand implements Command {
  private log = LoggerFactory.create(DeployedCommand);
  readonly type = '!deployed';
  readonly usageInfo = 'replies with currently deployed repo';
  readonly rateLimit = 10;

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    message.channel.startTyping();
    
    try {
      const sftp = await SftpHandler.getConnection();
      const deployed = await SftpHandler.getLastDeploy(sftp) as string;
      sftp.end();

      sendReply(Messages.CURRENTLY_DEPLOYED(deployed));
    } catch (err) {
      this.log.error('Failed to get last deploy', err);
      sendReply(Messages.UNKNOWN_ERROR);
    } finally {
      message.channel.stopTyping();
    }
  }
}
