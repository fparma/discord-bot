'use strict';
const Discord = require('discord.js');
const bot = new Discord.Client({autoReconnect: true});

const db = require('./db');
const commands = require('./commands');
const announcements = require('./announcements');
let credentials;
try {
  credentials = require('./credentials.json');
} catch (_) {
  console.warn('No credentials.json file! Exiting');
  process.abort();
}

Promise.all([
  db.connect(credentials.dbauth),
  bot.login(credentials.token)
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
