import * as Discord from 'discord.js'
import { Command } from './commands/command'
import { LoggerFactory } from './logger'
import { isMessageInGuildChannel, isModerator } from './util/discord'

export class DiscordBot {
  private log = LoggerFactory.create(DiscordBot)
  private commands = new Map<string, Command>()
  private static HELP_COMMAND = '!help'

  constructor(public readonly client: Discord.Client) {}

  /**
   * Connect the bot using provided token
   * @param token
   */
  async connect(token: string = '', isProd: boolean) {
    if (!token) throw new Error('Invalid token')

    this.client.once('ready', () => {
      this.log.info(`Connected to discord as "${this.user?.username}"`)
      this.client.on('message', msg => (isProd ? this.onMessage(msg) : this.handleDevelopmentMessage(msg)))
    })

    this.client.on('disconnect', err => {
      this.log.fatal('Websocket disconnected', err)
      throw err
    })

    try {
      this.log.debug('Logging in to discord')
      await this.client.login(token)
    } catch (e) {
      this.log.fatal('Failed to connect to discord')
      throw e
    }
  }

  handleDevelopmentMessage(message: Discord.Message) {
    if (message.channel.type === 'dm') return

    const BOT_TEST_CHANNEL = '563757919418712064'
    if (message.channel.id !== BOT_TEST_CHANNEL) return
    this.onMessage(message)
  }

  /**
   * Handle an incoming message from the server
   * @param message
   */
  private onMessage(message: Discord.Message): void {
    if (message.author.bot) return

    const content = message.content.trim()
    const commandType = ((/^(![^\s]+)/.exec(content) || [])[0] || '').toLowerCase()

    if (commandType === DiscordBot.HELP_COMMAND) {
      this.printHelp(message)
      return
    }

    if (!this.commands.has(commandType)) return
    this.handleExistingCommand(commandType, content, message)
  }

  /**
   * Calls a registered command
   * @param type
   * @param content
   * @param message
   */
  private async handleExistingCommand(type: string, content: string = '', message: Discord.Message): Promise<void> {
    const args = content.slice(content.indexOf(' ')).trim() // remove command type
    const command = this.commands.get(type)
 
    if (command!.onlyMods && !isModerator(message.member)) return

    const { author } = message
    this.log.info(`Running command from ${this.formatAuthor(author)}: ${message.content}`)
    const handleReply = (reply: string | string[]) => this.replyToMessage(reply, message)
    command!.handleMessage(args, handleReply, message)
  }

  /**
   * Registers a command
   * @param command
   */
  registerCommand(command: Command): boolean {
    const { type } = command

    if (!type.startsWith('!')) {
      this.log.warn('A command type must start with !')
      return false
    }

    if (this.commands.has(type)) {
      this.log.warn('Command already registered', type)
      return false
    }

    this.log.info('Registering command', type)
    this.commands.set(type, command)
    return true
  }

  /**
   * Send a reply back to the current message channel
   * @param reply
   * @param message
   */
  private replyToMessage(reply: string | string[], message: Discord.Message): void {
    if (Array.isArray(reply)) {
      reply = reply.join('\n')
    }

    const { author } = message
    if (!reply) {
      this.log.warn(
        `A command tried to send an empty reply to ${this.formatAuthor(author)}), stopping. Message: ${message.content}`
      )
      return
    }

    this.log.debug(`Reply to ${this.formatAuthor(author)}. Reply: ${reply}`)
    message.channel.send(reply)
  }

  /**
   * Prints all registered commands back to a user
   * @param message
   */
  private printHelp(message: Discord.Message): void {
    let isMod = false
    if (isMessageInGuildChannel(message)) { 
      isMod = isModerator(message.member)
    }

    const replies = ['!help - this command']
    this.commands.forEach((cmd, key) => {
      if (!cmd.onlyMods || (cmd.onlyMods && isMod)) {
        replies.push(`${key} - ${cmd.usageInfo}`)
      }
    })

    replies.sort((a, b) => a.localeCompare(b))
    this.replyToMessage(replies, message)
  }

  private formatAuthor(author: Discord.User) {
    return `${author.username}(${author.id})`
  }

  get user() {
    return this.client.user
  }
}
