import { GuildMember } from 'discord.js';

export const banMember = async (member: GuildMember, reason: string): Promise<boolean> => {
    if (!member.bannable) return false

    const deleteMessagesDays = 30
    await member.ban({ days: deleteMessagesDays, reason: reason || 'No reason provided' })

    return true
}