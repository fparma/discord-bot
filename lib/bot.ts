import { Database } from './database';
import * as Discord from 'discord.js';
import { Logger } from './logger';
import { AbstractCommand } from './commands/command';

export class DiscordBot {
  private log = new Logger(DiscordBot);
  private commands = new Map<string, AbstractCommand>();
  private static HELP_COMMAND = '!help';

  constructor(
    public readonly client: Discord.Client,
    private readonly db: Database
  ) {
  }

  /**
   * Connect the bot using provided token
   * @param token
   */
  async connect(token: string) {
    if (token == null) {
      this.log.fatal('Invalid token');
      process.exit(1);
    }

    this.client.once('ready', () => {
      this.log.info(`Connected to discord as "${this.user.username}"`);
    });

    try {
      this.log.debug('Logging in to discord');
      await this.client.login(token);
      this.client.on('message', msg => this.onMessage(msg));
    } catch (e) {
      this.log.fatal('Failed to connect to discord', e);
      process.exit(1);
    }
  }

  /**
   * Handle an incoming message from the server
   * @param message
   */
  private onMessage(message: Discord.Message): void {
    if (this.user.id === message.author.id) return;
    if (message.author.id !== '106088065050632192' && process.env.NODE_ENV !== 'test') return; // only listen to cuel;
    
    const content = message.content.trim();
    const commandType = ((/^(![^\s]+)/.exec(content) || [])[0] || '').toLowerCase();

    if (commandType === DiscordBot.HELP_COMMAND) {
      this.printHelp(message);
      return;
    }

    if (!this.commands.has(commandType)) return;
    this.handleExistingCommand(commandType, content, message);
  }

  /**
   * Calls a registered command
   * @param type
   * @param content 
   * @param message 
   */
  private handleExistingCommand(type: string, content: string = '', message: Discord.Message): void {
    const args = content.slice(content.indexOf(' ')).trim(); // remove command type
    const command = this.commands.get(type);

    const {author} = message;
    this.log.info(`Running command from ${this.formatAuthor(author)}: ${message.content}`);
    const handleReply = (reply: string | string[]) => this.replyToMessage(reply, message);
    command!.handleMessage(args, handleReply, message, this.db);
  }

  /**
   * Registers a command
   * @param command
   */
  registerCommand(command: AbstractCommand): boolean {
    const { type } = command;

    if (!type.startsWith('!')) {
      this.log.warn('A command type must start with !');
      return false;
    }

    if (this.commands.has(type)) {
      this.log.warn('Command already registered', type);
      return false;
    }

    this.log.info('Registering command', type);
    this.commands.set(type, command);
    return true;
  }

  /**
   * Send a reply back to the current message channel
   * @param reply
   * @param message 
   */
  private replyToMessage(reply: string | string[], message: Discord.Message): void {
    if (Array.isArray(reply)) {
      reply = reply.join('\n');
    }

    const { author } = message;
    if (reply == null) {
      this.log.warn(`A command tried to send an empty reply to ${this.formatAuthor(author)}), stopping. Message: ${message.content}`);
      return;
    }

    this.log.debug(`Sending reply to ${this.formatAuthor(author)}. Reply: ${reply}`);
    message.channel.send(reply);
  }

  /**
   * Prints all registered commands back to a user
   * @param message
   */
  private printHelp(message: Discord.Message): void {
    const replies = ['!help - this command'];
    this.commands.forEach((value, key) => replies.push(`${key} - ${value.usageInfo}`));
    replies.sort((a, b) => a.localeCompare(b));
    this.replyToMessage(replies, message);
  }

  private formatAuthor(author: Discord.User) {
    return `${author.username}(${author.id})`
  }

  get user() {
    return this.client.user;
  }
}
