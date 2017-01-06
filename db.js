'use strict';
const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const FPARMA_EVENT_URL = 'https://fparma.herokuapp.com/events/event/';

/**
 * Connects to database given an URL
 * @param url
 * @returns {Promise}<DB instance>
 */
exports.connect = (url) => {
  return new Promise((resolve, reject) => {
    const options = {auto_reconnect: true, bufferMaxEntries: 10};
    MongoClient.connect(url, options, (err, db) => {
      if (err) return reject(err);
      resolve(db);
    })
  });
};

/**
 * Stats for a single user
 * @param db
 * @param userNameOrSteamId
 * @returns {Promise}<{name, joined, events}>
 */
exports.stats = (db, userNameOrSteamId) => {
  return new Promise((resolve, reject) => {
    const userQuery = {$or: [{name: userNameOrSteamId}, {steam_id: userNameOrSteamId}]};
    db.collection('users').findOne(userQuery, ((err, res) => {
      if (err || !res) return reject(err);

      const groupQuery = {'units.user_id': {$in: [res.steam_id]}};
      db.collection('groups').count(groupQuery, ((err, amount) => {
        const info = {name: res.name, joined: res.created_at, events: amount};

        return resolve(info);
      }));
    }));
  });
};

/**
 * Poll events collections for new events.
 * // TODO: convert events to capped collection and use tail cursor instead of polling
 * this is pretty horrible because if more than 2 events is created within 30 sec, they won't be seen
 * @param db
 * @param callback
 */
exports.pollEvents = (db, callback) => {
  let cache;
  try {
    cache = require('./cache.json') || {};
  } catch (_) {
    cache = {};
  }

  const coll = db.collection('events');

  function poll () {
    const query = {date: {$gte: new Date()}};
    const options = {sort: {date: 1}};
    coll.find(query, options).toArray((e, res) => {
      if (e) return console.error(e);

      const notPosted = res
        .filter(e => !cache.hasOwnProperty(e._id))
        .map(evt => {
          return {
            _id: evt._id,
            name: evt.name,
            url: `${FPARMA_EVENT_URL}${evt.permalink}`,
            authors: evt.authors
          };
        });

      if (notPosted.length) {
        notPosted.forEach(v => cache[v._id] = null);
        writeCacheFile(cache);
        callback(notPosted);
      }
    });
  }

  poll();
  setInterval(poll, 30 * 1000);
};

function writeCacheFile(cache) {
  fs.writeFile(path.resolve(__dirname, 'cache.json'), JSON.stringify(cache), (e) => {
    if (e) console.error(e);
  });
}

/**
 * Get max 3 upcoming events
 * @param db
 * @returns {Promise}<[{name, authors, url}]>
 */
exports.upcoming = db => {
  const query = {date: {$gte: new Date()}};
  const options = {
    limit: 3,
    sort: {date: -1}
  };

  return new Promise((resolve, reject) => {
    db.collection('events').find(query, options).toArray((err, res) => {
      if (err || !res.length) return reject(err);

      const info = res.map(v => {
        return {
          name: v.name,
          authors: v.authors,
          url: `${FPARMA_EVENT_URL}${v.permalink}`
        };
      });

      resolve(info);
    });
  });
};


// need to convert events to a capped collection in order to use streaming
/**
 *  Tails the event document for new inserts
 * @param db
 * @param callback Function<{authors, url, name}>
 exports.tailEvents = (db, callback) => {
  const coll = db.collection('events');
  coll.find({}).sort({created_at: 1}).limit(1).next((e, res) => {
    console.log(res);
    const query = {created_at: {$gt: new Date()}};
    if (res) {
      query.created_at = {$gt: res.created_at};
    }

    const options = {
      tailable: true,
      awaitData: true,
      numberOfRetries: -1
    };

    const stream = coll.find(query, options).stream();
    stream.on('error', e => console.error(e));
    stream.on('data', doc => {
      console.log(doc);
      const url = `https://fparma.herokuapp.com/events/event/${doc.permalink}`;
      const info = {authors: doc.authors, url, name: doc.name};
      callback(info);
    });
  });
};
 */
