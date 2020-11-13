import { GuildMember, Message, Guild, Role, Collection, User } from 'discord.js'

export const isModerator = (member: GuildMember | null) => (member ? member.hasPermission('MANAGE_GUILD') : false)

export const isMessageInGuildChannel = (message: Message) => {
  return message.guild && message.channel.type === 'text'
}

export const getMemberFromMessage = async (message: Message) => {
  return message.guild?.members.fetch(message.author.id)  
}

export const stringToRoles = async (guild: Guild, roles: string[]): Promise<Collection<string, Role>> => {
  if (!guild) return new Collection()
  const toLower = roles.map(role => role.toLowerCase()) 
 
  return (await guild.roles.fetch()).cache.filter(role => toLower.includes(role.name.toLowerCase()))
}
