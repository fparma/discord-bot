import { GuildMember, Message, Guild, Role, Collection, User, ChannelType } from 'discord.js'

export const isModerator = (member: GuildMember | null) => (member ? member.permissions.has('ManageGuild') : false)

export const isMessageInGuildChannel = (message: Message) => {
  return message.guild && message.channel.type === ChannelType.GuildText
}

export const getMemberFromMessage = async (message: Message) => {
  return message.guild?.members.fetch(message.author.id)
}

export const stringToRoles = async (guild: Guild, roles: string[]): Promise<Collection<string, Role>> => {
  if (!guild) return new Collection()
  const rolesLower = roles.map((role) => role.toLowerCase())

  return (await guild.roles.fetch()).filter((role) => rolesLower.includes(role.name.toLowerCase()))
}
