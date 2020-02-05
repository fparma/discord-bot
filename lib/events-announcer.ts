import * as Discord from 'discord.js'
import { Event, Database } from './database'
import { Cache, EventsCache } from './cache'
import * as Messages from './messages'
import { Message } from 'discord.js'
import { LoggerFactory } from './logger'

export class EventsAnnouncer {
  private cache: Cache
  private interval: NodeJS.Timer | null = null
  private log = LoggerFactory.create(EventsAnnouncer)
  private static POLL_DELAY = 30 * 1000

  constructor(private db: Database, private channel: Discord.PartialTextBasedChannelFields) {
    this.cache = EventsCache.read()
  }

  pollNewEvents(): boolean {
    if (this.interval != null) return false

    this.poll()
    this.interval = setInterval(() => this.poll(), EventsAnnouncer.POLL_DELAY)
    return true
  }

  private async poll() {
    const events = await this.db.findFutureEvents()
    const newEvents = events.filter(evt => !this.cache.hasOwnProperty(evt.id))
    if (!newEvents.length) return

    this.saveToCache(newEvents.map(evt => evt.id))
    this.publishEventMessage(newEvents)
  }

  private saveToCache(ids: string[]) {
    ids.forEach(id => (this.cache[id] = null))
    EventsCache.write(Object.assign({}, this.cache))
  }

  private publishEventMessage(events: Event[]) {
    this.log.info(`Publishing ${events.length} new event(s)`)
    const formatted = events.map(evt => Messages.NEW_EVENT(evt.name, evt.authors, evt.permalink)).join('\n')
    this.channel.send(formatted)
  }
}
