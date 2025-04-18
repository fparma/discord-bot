use crate::commands::add_role::errors::AddRoleError;
use crate::commands::common::autocomplete::existing_roles::autocomplete_existing_roles;
use crate::commands::common::macros::ok_or_respond_with_error;
use crate::commands::models::bad_roles::BadRoles;
use crate::Context;
use anyhow::{anyhow, Error};
use poise::serenity_prelude::{Role, RoleId};
use tracing::info;
use crate::commands::common::error::command_error::CommandError;

#[poise::command(
    slash_command,
    rename = "add",
    user_cooldown = 5,
    guild_only,
    required_bot_permissions = "MANAGE_ROLES"
)]
pub async fn add_role(
    ctx: Context<'_>,
    #[autocomplete = "autocomplete_existing_roles"]
    #[description = "Roles to add"]
    roles: Vec<String>,
) -> Result<(), Error> {
    ok_or_respond_with_error!(ctx, do_add_role(ctx, roles).await);

    Ok(())
}

async fn do_add_role(ctx: Context<'_>, roles: Vec<String>) -> Result<(), CommandError> {
    if roles.is_empty() {
        return Err(AddRoleError::NoRolesProvided.into());
    }

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

    info!("Matched roles: {:?}", matched_roles);

    let not_found_roles: Vec<String> = matched_roles
        .iter()
        .filter_map(|role| match role {
            Ok(_) => None,
            Err(role) => Some(role.clone()),
        })
        .collect();

    if !not_found_roles.is_empty() {
        return Err(AddRoleError::RolesNotFound(BadRoles::new(not_found_roles)).into());
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
        return Err(AddRoleError::RoleNotAllowed(BadRoles::new(
            not_allowed_roles,
        )).into());
    }

    let member = ctx
        .author_member()
        .await
        .ok_or(anyhow!("Member not found"))?;

    info!("Member: {:?}", member);

    let desired_roles_ids: Vec<_> = desired_roles
        .into_iter()
        .map(|(id, _)| *id)
        .collect();

    member
        .add_roles(&ctx, &desired_roles_ids)
        .await
        .map_err(|e| anyhow!("Error adding role: {:?}", e))?;

    ctx.say("Roles added successfully").await?;

    Ok(())
}
