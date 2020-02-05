import * as mongodb from 'mongodb'
import { LoggerFactory } from './logger'
import * as Messages from './messages'
import { EventEmitter } from 'events'

export interface User {
  name: string
  created_at: Date
  steam_id: string
}

export interface Event {
  id: string
  name: string
  permalink: string
  authors: string
}

export class Database {
  private log = LoggerFactory.create(Database)
  db: mongodb.Db | null = null

  constructor(private readonly mongo: mongodb.MongoClient) {}

  connect(url: string = ''): Promise<boolean> {
    if (!url) return Promise.reject(new Error('Empty url provided'))

    return new Promise((resolve, reject) => {
      this.mongo.connect(url, { autoReconnect: true }, (err, db) => {
        if (err) {
          this.log.fatal('Failed to connect to database')
          return reject(err)
        }

        this.db = db
        this.log.info('Connected')
        resolve(true)
      })
    })
  }

  findOneUser(userNameOrSteamId: string): Promise<User> {
    const userQuery = { $or: [{ name: userNameOrSteamId }, { steam_id: userNameOrSteamId }] }
    return this.db!.collection('users').findOne(userQuery)
  }

  countUserAttendance(userSteamid: string): Promise<number> {
    const groupQuery = { 'units.user_id': { $in: [userSteamid] } }
    return this.db!.collection('groups').count(groupQuery)
  }

  async findFutureEvents(): Promise<Event[]> {
    const collection = this.db!.collection('events')
    const query = { date: { $gte: new Date() } }
    const options = { sort: { date: 1 } }

    try {
      const res = await collection.find(query, options).toArray()
      const events = res.map(evt => {
        return {
          id: evt._id,
          name: evt.name,
          permalink: evt.permalink,
          authors: evt.authors,
        }
      })
      return events
    } catch (err) {
      this.log.error('Error finding events', err)
      return []
    }
  }
}
