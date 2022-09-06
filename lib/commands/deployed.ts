import { Message } from 'discord.js'
import * as Messages from '../messages'
import { SftpHandler } from '../util/sftp'
import { LoggerFactory } from './../logger'
import { Command } from './command'

export class DeployedCommand implements Command {
  private log = LoggerFactory.create(DeployedCommand)
  readonly type = '!deployed'
  readonly usageInfo = 'replies with currently deployed repo'
  readonly rateLimit = 10
  readonly onlyMods = false

  async handleMessage(arg: string, sendReply: (message: string | string[]) => void, message: Message) {
    message.channel.sendTyping()

    try {
      const sftp = await SftpHandler.getConnection()
      const deployed = (await SftpHandler.getLastDeploy(sftp)) as string
      sftp.end()

      sendReply(Messages.CURRENTLY_DEPLOYED(deployed))
    } catch (err) {
      this.log.error('Failed to get last deploy', err)
      sendReply(Messages.UNKNOWN_ERROR)
    }
  }
}
