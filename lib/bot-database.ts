import * as mongodb from 'mongodb'
import { LoggerFactory } from './logger'

interface ConfigData {
  roles: string[]
}

export class BotDatabase {
  static ROLE_KEY = 'user_assignable_roles'
  private log = LoggerFactory.create(BotDatabase)
  db: mongodb.Db | null = null

  constructor() {}

  async connect(uri = '') {
    const client = await new mongodb.MongoClient(uri).connect()
    this.db = client.db()
  }

  getUserRoles(): Promise<string[]> {
    return this.db!.collection<ConfigData>('config')
      .findOne({ id: BotDatabase.ROLE_KEY })
      .then((data) => (data && Array.isArray(data.roles) ? data.roles : []))
  }

  saveUserRoles(roles: string[]) {
    return this.db!.collection<ConfigData>('config').updateOne(
      { id: BotDatabase.ROLE_KEY },
      {
        $addToSet: { roles: { $each: roles } },
      },
      { upsert: true }
    )
  }

  removeUserRoles(roles: string[]) {
    return this.db!.collection<ConfigData>('config').updateOne(
      { id: BotDatabase.ROLE_KEY },
      {
        $pull: { roles: { $in: roles } },
      },
      { upsert: true }
    )
  }
}
