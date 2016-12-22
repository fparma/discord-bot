'use strict';
const query = require('./db');

exports.startEventPolling = ((bot, db) => {
  query.pollEvents(db, evts => {
    const msg = evts.map(v => `:joystick: New event! ${v.name} by ${v.authors}. ${v.url} :rocket:`).join('\n');
    bot.channels.find('name', 'announcements').sendMessage(msg);
  });
});
