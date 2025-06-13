use poise::serenity_prelude::Permissions;

pub static FORBIDDEN_PERMISSIONS: [Permissions; 13] = [
    Permissions::ADMINISTRATOR,
    Permissions::KICK_MEMBERS,
    Permissions::BAN_MEMBERS,
    Permissions::MANAGE_CHANNELS,
    Permissions::MANAGE_GUILD,
    Permissions::VIEW_AUDIT_LOG,
    Permissions::MANAGE_MESSAGES,
    Permissions::MENTION_EVERYONE,
    Permissions::CHANGE_NICKNAME,
    Permissions::MANAGE_NICKNAMES,
    Permissions::MANAGE_ROLES,
    Permissions::MANAGE_WEBHOOKS,
    Permissions::MANAGE_MESSAGES,
];
