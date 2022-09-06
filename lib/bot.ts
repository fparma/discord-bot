import * as Discord from 'discord.js'
import { Command } from './commands/command'
import { BOT_LOG_CHANNEL, BOT_TEST_CHANNEL } from './constants'
import { LoggerFactory } from './logger'
import { formatAuthor, isMessageInGuildChannel, isModerator } from './util/discord'

export class DiscordBot {
  private log = LoggerFactory.create(DiscordBot)
  private commands = new Map<string, Command>()
  private static HELP_COMMAND = '!help'

  constructor(public readonly client: Discord.Client) {}

  /**
   * Connect the bot using provided token
   * @param token
   */
  async connect(token: string = '', isProd: boolean = false) {
    if (!token) throw new Error('Invalid token')

    this.client.once('ready', () => {
      this.log.info(`Connected to discord as "${this.user?.username}"`)
      this.client.on('messageCreate', (msg) => (isProd ? this.onMessage(msg) : this.handleDevelopmentMessage(msg)))
      this.client.on('messageDelete', (msg) => this.onMessageEditOrDelete(msg as Discord.Message))
      this.client.on('messageUpdate', (prev, next) =>
        this.onMessageEditOrDelete(prev as Discord.Message, next as Discord.Message)
      )
    })

    this.client.on('disconnect', (err) => {
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
    if (message.channel.type === Discord.ChannelType.DM) return

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
    this.log.info(`Running command from ${formatAuthor(author)}: ${message.content}`)
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
    const { author } = message

    if (Array.isArray(reply)) {
      reply = reply.join('\n')
    }

    if (!reply) {
      this.log.warn(
        `A command tried to send an empty reply to ${formatAuthor(author)}), stopping. Message: ${message.content}`
      )
      return
    }

    this.log.debug(`Reply to ${formatAuthor(author)}. Reply: ${reply}`)
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

  private async onMessageEditOrDelete(prev: Discord.Message, next?: Discord.Message) {
    if (!prev.guild) return

    const wasEdited = !!next
    // can something else edit the message?
    if ((wasEdited && prev.author?.id !== next.author?.id) || prev.content === next?.content) {
      this.log.info('something wrong', formatAuthor(prev.author), prev.content)
      return
    }

    const color: Discord.ColorResolvable = wasEdited ? 'Yellow' : 'DarkRed'
    const embed = new Discord.EmbedBuilder()
      .setColor(color)
      .addFields({ name: 'Original message', value: prev.content as string })

    if (wasEdited) {
      embed.setTitle(`${prev.author.tag} edited a message in #${(prev.channel as Discord.GuildChannel).name}`)
      embed.addFields({ name: 'Updated message', value: next.content as string })
      embed.setURL(prev.url)
    } else {
      const fetchedLogs = await prev.guild.fetchAuditLogs({
        limit: 1,
        type: Discord.AuditLogEvent.MessageDelete,
      })

      const logEntry = fetchedLogs.entries.first()
      if (!logEntry) {
        embed.setTitle('NO AUDIT LOGS, unclear what happened')
      } else {
        const { executor, target } = logEntry
        if (target.id === prev.author.id) {
          embed.setTitle(
            `${executor ? executor.tag : '<UNKNOWN>'} deleted ${prev.author.tag}'s message in #${
              (prev.channel as Discord.GuildChannel).name
            }`
          )
        } else {
          // There can be a delay between message delete and audit log entry, so we can only assume
          embed.setTitle(
            `Assumption: ${prev.author.tag} deleted their own message in #${
              (prev.channel as Discord.GuildChannel).name
            }`
          )
        }
      }
    }

    try {
      const channel = (await this.client.channels.fetch(BOT_LOG_CHANNEL)) as Discord.TextChannel

      if (isModerator(prev.member)) {
        await channel.send({ embeds: [embed] })
      } else {
        await channel.send({ content: `<@${prev.author.id}>`, embeds: [embed] })
      }
    } catch (err) {
      this.log.error('failed to send embed', err)
    }
  }

  get user() {
    return this.client.user
  }
}
