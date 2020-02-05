import { DiscordBot } from './../lib/bot'
import * as Discord from 'discord.js'
import { Database } from '../lib/database'
import * as mongodb from 'mongodb'
import { Command } from '../lib/commands/command'
import { Helpers } from './helpers'

describe(DiscordBot.name, () => {
  let db: Database
  let mongo: mongodb.MongoClient

  beforeEach(() => {
    Helpers.disableLogging()
    mongo = new mongodb.MongoClient()
    db = new Database(mongo)
  })

  it('connects', async done => {
    const url = 'test://'
    spyOn(mongo, 'connect').and.callFake((providedUrl: string, opts: object, callback: Function) => {
      expect(url).toEqual(providedUrl)
      callback()
    })

    const val = await db.connect(url)
    expect(val).toEqual(true)
    done()
  })

  it('rejects with an error if connecting failed', async () => {
    const url = 'test://'
    const expectedError = new Error('test')
    spyOn(mongo, 'connect').and.callFake((providedUrl: string, opts: object, callback: Function) => {
      expect(url).toEqual(providedUrl)
      callback(expectedError)
    })

    try {
      await db.connect(url)
      fail('should not be reached')
    } catch (e) {
      expect(expectedError).toEqual(e)
    }
  })
})
