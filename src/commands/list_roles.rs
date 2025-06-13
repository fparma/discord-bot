use crate::commands::common::error::command_error::CommandError;
use crate::commands::common::macros::ok_or_respond_with_error;
use crate::Context;
use anyhow::Error;

#[poise::command(slash_command, rename = "list_roles", user_cooldown = 5, guild_only)]
/// List all allowed roles
pub async fn list_roles(ctx: Context<'_>) -> Result<(), Error> {
    ok_or_respond_with_error!(ctx, do_list_role(ctx,).await);

    Ok(())
}

async fn do_list_role(ctx: Context<'_>) -> Result<(), CommandError> {
    let guild_roles = ctx.guild().unwrap().roles.clone();

    let allowed_roles_ids = ctx.data().bot_db_client.get_allowed_roles().await?;

    let allowed_roles: Vec<_> = guild_roles
        .iter()
        .filter(|(id, _)| allowed_roles_ids.contains(&id.to_string()))
        .map(|(_, r)| r.name.clone())
        .collect();

    ctx.say(format!(
        "The following roles are available: {}",
        allowed_roles.join(", ")
    ))
    .await?;

    Ok(())
}
