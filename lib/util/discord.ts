import { GuildMember, Message, Guild, Role, Collection } from 'discord.js'

export const isModerator = (member: GuildMember) => (member ? member.hasPermission('MANAGE_GUILD') : false)

export const isMessageInGuildChannel = (message: Message) => {
  return message.guild && message.channel.type === 'text'
}

export const getMemberFromMessage = (message: Message) => {
  return message.guild.members.get(message.author.id) as GuildMember
}

export const stringToRoles = (guild: Guild, roles: string[]): Collection<string, Role> => {
  if (!guild) return new Collection()
  const toLower = roles.map(role => role.toLowerCase())
  return guild.roles.filter(role => toLower.includes(role.name.toLowerCase()))
}
