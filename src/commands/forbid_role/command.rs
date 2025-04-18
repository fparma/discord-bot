use crate::commands::common::autocomplete::existing_roles::autocomplete_existing_roles;
use crate::commands::common::macros::ok_or_respond_with_error;
use crate::Context;
use anyhow::Error;
use crate::commands::common::error::command_error::CommandError;
use crate::commands::forbid_role::errors::ForbidRoleError;

#[poise::command(slash_command, rename = "forbid", user_cooldown = 5, guild_only)]
pub async fn forbid_role(
    ctx: Context<'_>,
    #[autocomplete = "autocomplete_existing_roles"]
    #[description = "Role to forbid"]
    role: String,
) -> Result<(), Error> {
    ok_or_respond_with_error!(ctx, do_allow_role(ctx, role).await);

    Ok(())
}

async fn do_allow_role(ctx: Context<'_>, role: String) -> Result<(), CommandError> {
    let guild_roles = ctx.guild().unwrap().roles.clone();

    let matched_role = guild_roles
        .into_iter()
        .find(|(_, r)| r.name == role)
        .map(|(_, role)| role);

    let role = match matched_role {
        Some(role) => role,
        None => {
            return Err(ForbidRoleError::RoleNotFound.into());
        }
    };

    let allowed_roles = ctx.data().bot_db_client.get_allowed_roles().await?;

    let role_id = role.id.to_string();

    if !allowed_roles.contains(&role_id) {
        return Err(ForbidRoleError::RoleWasNotAllowed.into());
    }

    ctx.data().bot_db_client.remove_user_role(role_id).await?;

    ctx.say("Role forbidden\nThis does not remove it from users").await?;

    Ok(())
}
