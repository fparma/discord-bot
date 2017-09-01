import * as mongodb from 'mongodb';
import { LoggerFactory } from "./logger";
import * as Messages from './messages';

interface User {
  name: string
  created_at: Date
  steam_id: string
}

export class Database {
  private log = LoggerFactory.create(Database);
  db: mongodb.Db;
  constructor(private readonly mongo: mongodb.MongoClient) {
  }

  connect(url: string) {
    return new Promise((resolve, reject) => {
      this.mongo.connect(url, { autoReconnect: true }, (err, db) => {
        if (err) {
          this.log.fatal('Failed to connect to database', err);
          return reject(err);
        }

        this.db = db;
        this.log.info('Connected');
        resolve(true);
      })
    });
  }

  findOneUser(userNameOrSteamId: string): Promise<User> {
    return new Promise((resolve, reject) => {
      const userQuery = { $or: [{ name: userNameOrSteamId }, { steam_id: userNameOrSteamId }] };
      this.db.collection('users').findOne(userQuery, ((err, res: User) => {
        if (err) return reject(err);
        resolve(res);
      }));
    });
  }

  countUserAttendance(userSteamid: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const groupQuery = { 'units.user_id': { $in: [userSteamid] } };
      this.db.collection('groups').count(groupQuery, ((err, amount) => {
        if (err) return reject(err);
        return resolve(amount);
      }));
    });
  }
}
