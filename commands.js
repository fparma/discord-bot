'use strict';

const query = require('./db')
const commands = new Map();

/**
 *  Registers a bot with db
 * @param bot - A connected discord bot
 * @param db - Mongoose Connection
 */
exports.register = (bot, db) => {
  const botName = bot.user.username;
  bot.on('message', message => {
    if (botName === message.author.username) return;

    const trimmed = message.content.trim();
    const [match] = /(![^\s]+)/.exec(trimmed) || [];
    if (commands.has(match)) {
      console.info('FROM %s, COMMAND: %s', message.author.username, message.content);
      const args = trimmed.slice(trimmed.indexOf(' ')).trim();
      if (args === botName) return sendReply(message, 'Don\'t be silly');
      commands.get(match).resolve(message, args, db);
    }
  });
};

/**
 * Sends a reply to a specific message
 * @param message - discord message
 * @param reply - string or stringarray
 */
function sendReply (message, reply) {
  console.info('TO %s, REPLY: %s', message.author.username, reply);
  if (Array.isArray(reply)) {
    reply = reply.join('\n');
  }
  message.channel.sendMessage(reply);
}

/**
 * Replies with pong
 */
const commandPing = {
  info: 'Check if I am alive',
  resolve: (message) => {
    sendReply(message, 'pong!');
  }
};

/**
 * Replies with all commands
 */
const commandHelp = {
  info: 'This command',
  resolve: (message) => {
    const replies = [];
    commands.forEach((value, key) => replies.push(`${key} - ${value.info}`));
    replies.sort((a, b) => a.localeCompare(b));
    sendReply(message, replies);
  }
};

/**
 * Get stats for a user
 */
const commandStats = {
  info: 'Get event stats for user. Usage: !stats (website username|steamID64)',
  resolve: (message, args, db) => {
    if (args.length < 2) {
      return sendReply(message, 'Please provide a user or steam ID64');
    }

    query.stats(db, args)
      .then(info => {
        const evt = `${info.events} ${info.events === 1 ? 'event' : 'events'}`;
        const reply = `${info.name} joined on ${info.joined.toISOString().substr(0, 10)} and has registered for ${evt}`;
        sendReply(message, reply);
      })
      .catch(err => {
        err & console.error(err);
        sendReply(message, 'Sorry, could not find that user')
      });
  }
};

/**
 * Show max 3 upcoming events
 */
const commandUpcoming = {
  info: 'Show upcoming events',
  resolve: (message, args, db) => {
    query.upcoming(db)
      .then(info => {
        const replies = info.map((v, idx) => `${idx + 1}: ${v.name} by ${v.authors}. ${v.url}`);
        sendReply(message, replies);
      })
      .catch(err => {
        err && console.error(err);
        sendReply(message, 'No upcoming events! :(');
      })
  }
};

commands.set('!ping', commandPing);
commands.set('!help', commandHelp);
commands.set('!stats', commandStats);
commands.set('!upcoming', commandUpcoming);
