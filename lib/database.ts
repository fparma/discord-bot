import * as mongodb from 'mongodb'
import { LoggerFactory } from './logger'

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

  async connect(uri = '') {
    const client = await new mongodb.MongoClient(uri).connect()
    this.db = client.db()
  }

  findOneUser(userNameOrSteamId: string): Promise<User | null> {
    const userQuery = { $or: [{ name: userNameOrSteamId }, { steam_id: userNameOrSteamId }] }
    return this.db!.collection<User>('users').findOne(userQuery)
  }

  async countUserAttendance(userSteamid: string): Promise<number | 0> {
    const groupQuery = { 'units.user_id': { $in: [userSteamid] } }
    if (!this.db) return 0
    return this.db.collection('groups').countDocuments(groupQuery)
  }

  async findFutureEvents(): Promise<Event[]> {
    const collection = this.db!.collection<Event>('events')
    const query = { date: { $gte: new Date() } }

    try {
      const res = await collection.find(query).sort({ date: 1 }).toArray()
      const events = res.map((evt) => {
        return {
          id: evt._id.toHexString(),
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
