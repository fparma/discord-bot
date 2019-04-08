import { GuildMember } from 'discord.js';

export const isAdmin = (member: GuildMember) => member && member.hasPermission('ADMINISTRATOR')