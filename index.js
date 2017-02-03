'use strict';
const Discord = require('discord.js');
const bot = new Discord.Client({autoReconnect: true});

const db = require('./db');
const commands = require('./commands');
const announcements = require('./announcements');

Promise.all([
  db.connect(process.env.DB_URI),
  bot.login(process.env.BOT_TOKEN)
])
  .then(values => {
    const dbInstance = values[0];
    console.log('Connected');

    commands.register(bot, dbInstance);
    announcements.startEventPolling(bot, dbInstance);
  })
  .catch(err => {
    console.error(err);
    process.abort();
  });
