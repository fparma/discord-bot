use crate::commands::common::macros::ok_or_respond_with_error;
use crate::commands::models::bad_roles::BadRoles;
use crate::commands::remove_role::errors::RemoveRoleError;
use crate::commands::common::autocomplete::allowed_roles::autocomplete_allowed_roles;
use crate::Context;
use anyhow::{anyhow, Error};
use poise::serenity_prelude::{Role, RoleId};
use crate::commands::common::error::command_error::CommandError;

#[poise::command(slash_command, rename = "remove", user_cooldown = 5, guild_only)]
pub async fn remove_role(
    ctx: Context<'_>,
    #[autocomplete = "autocomplete_allowed_roles"]
    #[description = "Roles to remove"]
    roles: Vec<String>,
) -> Result<(), Error> {
    ok_or_respond_with_error!(ctx, do_remove_role(ctx, roles).await);

    Ok(())
}

async fn do_remove_role(ctx: Context<'_>, roles: Vec<String>) -> Result<(), CommandError> {
    let guild_roles = ctx.guild().unwrap().roles.clone();

    let matched_roles = roles
        .into_iter()
        .map(|role| {
            match guild_roles
                .iter()
                .find(|(_, guild_role)| guild_role.name == role)
            {
                Some(r) => Ok(r),
                None => Err(role),
            }
        })
        .collect::<Vec<_>>();

    let not_found_roles: Vec<String> = matched_roles
        .iter()
        .filter_map(|role| match role {
            Ok(_) => None,
            Err(role) => Some(role.clone()),
        })
        .collect();

    if !not_found_roles.is_empty() {
        return Err(RemoveRoleError::RolesNotFound(BadRoles::new(
            not_found_roles,
        )).into());
    }

    let desired_roles: Vec<(&RoleId, &Role)> = matched_roles
        .into_iter()
        .filter_map(|role| role.ok())
        .collect();

    let allowed_roles_ids = ctx.data().bot_db_client.get_allowed_roles().await?;

    let not_allowed_roles: Vec<String> = desired_roles
        .iter()
        .filter(|(id, _)| !allowed_roles_ids.contains(&id.to_string()))
        .map(|(_, role)| role.name.clone())
        .collect();

    if !not_allowed_roles.is_empty() {
        return Err(RemoveRoleError::RoleNotAllowed(BadRoles::new(
            not_allowed_roles,
        )).into());
    }

    let member = ctx
        .author_member()
        .await
        .ok_or(anyhow!("Member not found"))?;

    let desired_roles_ids: Vec<_> = desired_roles
        .into_iter()
        .map(|(id, _)| *id)
        .collect();

    member
        .remove_roles(&ctx, &desired_roles_ids)
        .await
        .map_err(|e| anyhow!(e))?;

    ctx.say("Success!").await?;

    Ok(())
}
