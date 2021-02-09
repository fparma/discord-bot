import { query } from 'gamedig'
import { LoggerFactory } from './logger'

const SEPARATOR = '·'

export class ServerStatus {
  private log = LoggerFactory.create(ServerStatus)

  public async getStatus() {
    const [server, ts3] = await Promise.all([this.getServerStatus(), this.getTs3Status()])
    this.log.info({ server: server.text, ts3: ts3.text })
    
    return {
      active: server.active,
      text: `${server.text} ${SEPARATOR} ${ts3.text}`,
    }
  }

  private async getServerStatus() {
    try {
      const { raw = {} as any, map = '', maxplayers, players } = await query({
        type: 'arma3',
        host: 'fparma.com',
      })
      if (players.length > 0) {
        return { active: true, text: `[${players.length}/${maxplayers}] ${raw.game} (${map})` }
      } else {
        return { active: false, text: 'Server: waiting' }
      }
    } catch (err) {
      this.log.error(err)
      return { active: false, text: 'Server: N/A' }
    }
  }

  private async getTs3Status() {
    try {
      const state = await query({
        type: 'teamspeak3',
        host: 'thor.prfn.se',
      })

      const ret = this.parseTs3State(state)
      return ret ? { active: true, text: ret } : { active: false, text: 'TS3: N/A' }
    } catch (err) {
      this.log.error(err)
      return { active: false, text: 'TS3: N/A' }
    }
  }

  private parseTs3State(state: any): string | null {
    const rawChannels = state.raw.channels
    const root = rawChannels.find((channel: any) => channel.channel_name === 'FPARMA 3' || channel.cid === '979')
    if (!root || !root.cid) {
      this.log.warn('Could not find root TS3 channel')
      return null
    }

    const channelIds = [root.cid]
    const subChannelsIds = rawChannels.reduce(
      (acc: string[], ele: any) => (ele.pid === root.cid ? [...acc, ele.cid] : acc),
      []
    )

    const recurseSubChannelChildren = (id: string) => {
      channelIds.push(id)
      rawChannels
        .filter((channel: any) => channel.pid === id)
        .forEach((channel: any) => recurseSubChannelChildren(channel.cid))
    }
    subChannelsIds.forEach(recurseSubChannelChildren)

    const userNamesInSubChannels = state.players.reduce(
      (acc: string[], ele: any) => (channelIds.includes(ele.cid) ? [...acc, ele.name] : acc),
      []
    )

    return `TS3: ${userNamesInSubChannels.length}`
  }
}
