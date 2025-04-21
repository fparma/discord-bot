use crate::commands::common::components::text_reply::text_reply;
use crate::commands::common::components::yes_no_buttons::generate_yes_no_buttons;
use crate::commands::common::error::command_error::CommandError;
use crate::commands::common::macros::ok_or_respond_with_error;
use crate::Context;
use anyhow::{anyhow, Error};
use poise::CreateReply;

#[poise::command(
    slash_command,
    rename = "restart_server",
    global_cooldown = 120,
    guild_only,
    reuse_response
)]
/// Restarts the arma server
pub async fn restart_server(ctx: Context<'_>) -> Result<(), Error> {
    ok_or_respond_with_error!(ctx, do_restart_server(ctx).await);

    Ok(())
}

async fn do_restart_server(ctx: Context<'_>) -> Result<(), CommandError> {
    ctx.defer().await?;

    let handle = if ctx
        .data()
        .server_info
        .get_active_player_count()
        .map(|c| c != 0)
        .unwrap_or_default()
    {
        let reply = CreateReply::default()
            .content("The server is currently not empty. Are you sure you want to restart?")
            .components(generate_yes_no_buttons());

        let handle = ctx.send(reply).await?;

        let interaction = handle
            .message()
            .await?
            .await_component_interaction(ctx)
            .await
            .ok_or(anyhow!("No interaction received"))?;

        if interaction.data.custom_id == "no" {
            handle.edit(ctx, text_reply("Cancelled restart")).await?;
            return Ok(());
        }

        handle
            .edit(ctx, text_reply("As you wish. Restarting server..."))
            .await?;

        handle
    } else {
        ctx.send(CreateReply::default().content("Server is empty. Restarting..."))
            .await?
    };

    match ctx.data().ssh_client.restart_server().await {
        Ok(_) => {
            handle
                .edit(ctx, text_reply("Server restarted successfully"))
                .await?;
        }
        Err(e) => {
            handle
                .edit(ctx, text_reply("Failed to restart server"))
                .await?;
            return Err(anyhow!("Failed to restart server: {}", e).into());
        }
    }

    Ok(())
}
