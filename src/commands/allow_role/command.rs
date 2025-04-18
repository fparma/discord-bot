use crate::commands::allow_role::errors::{AllowRoleError};
use crate::commands::allow_role::forbidden_permission::FORBIDDEN_PERMISSIONS;
use crate::commands::common::autocomplete::existing_roles::autocomplete_existing_roles;
use crate::commands::common::macros::ok_or_respond_with_error;
use crate::Context;
use anyhow::{anyhow, Error};
use crate::commands::common::error::command_error::CommandError;
use crate::commands::common::error::models::bad_permissions::BadPermissions;

#[poise::command(slash_command, rename = "allow", user_cooldown = 5, guild_only)]
pub async fn allow_role(
    ctx: Context<'_>,
    #[autocomplete = "autocomplete_existing_roles"]
    #[description = "Role to allow"]
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
            return Err(AllowRoleError::RoleNotFound.into());
        }
    };

    let forbidden_permissions: Vec<String> = FORBIDDEN_PERMISSIONS
        .iter()
        .filter(|p| role.has_permission(**p))
        .map(|p| p.to_string())
        .collect();

    if !forbidden_permissions.is_empty() {
        return Err(AllowRoleError::PermissionNotAllowed(BadPermissions::new(
            forbidden_permissions,
        )).into());
    }

    ctx.data()
        .bot_db_client
        .save_user_role(role.id.to_string())
        .await?;

    ctx.say(format!("Allowed role: {}", role.name))
        .await
        .map_err(|e| anyhow!(e))?;

    Ok(())
}
