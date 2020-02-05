import { GuildMember, Message } from 'discord.js'

export const isModerator = (member: GuildMember) => (member ? member.hasPermission('MANAGE_GUILD') : false)

export const isMessageInGuildChannel = (message: Message) => {
  return message.guild && message.channel.type === 'text'
}

export const getMemberFromMessage = (message: Message) => {
  return message.guild.members.get(message.author.id) as GuildMember
}
