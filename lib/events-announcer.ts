import * as Discord from 'discord.js';
import { Event, Database } from './database';
import { Cache, EventsCache } from './cache'

export class EventsAnnouncer {
  private cache: Cache;
  private interval: NodeJS.Timer;
  private static POLL_DELAY = 30 * 1000;

  constructor(
    private db: Database,
    private channel: Discord.Channel
  ) {
    this.cache = EventsCache.read();
  }

  monitor(): boolean {
    if (this.interval != null) return false;

    this.poll();
    this.interval = setInterval(() => this.poll(), EventsAnnouncer.POLL_DELAY);
    return true;
  }

  private async poll() {
    const events = await this.db.findFutureEvents();
    const newEvents = events.filter(evt => !this.cache.hasOwnProperty(evt.id));
    if (!newEvents.length) return;

    this.saveToCache(newEvents.map(evt => evt.id));
    this.publishEventMessage(newEvents);
  }

  private saveToCache(ids: string[]) {
    ids.forEach(id => this.cache[id] = null);
    EventsCache.write(Object.assign({}, this.cache));
  }

  private publishEventMessage(events: Event[]) {

  }
}
