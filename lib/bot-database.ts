import * as mongodb from 'mongodb'
import { LoggerFactory } from './logger'

export class BotDatabase {
  static ROLE_KEY = 'user_assignable_roles'
  private log = LoggerFactory.create(BotDatabase)
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

  getUserRoles(): Promise<string[]> {
    return this.db!.collection('config')
      .findOne({ id: BotDatabase.ROLE_KEY })
      .then(data => (Array.isArray(data.roles) ? data.roles : []))
  }

  saveUserRoles(roles: string[]) {
    return this.db!.collection('config').updateOne(
      { id: BotDatabase.ROLE_KEY },
      {
        $addToSet: { roles: { $each: roles } },
      },
      { upsert: true }
    )
  }

  removeUserRoles(roles: string[]) {
    return this.db!.collection('config').updateOne(
      { id: BotDatabase.ROLE_KEY },
      {
        $pull: { roles: { $in: roles } },
      },
      { upsert: true }
    )
  }
}
