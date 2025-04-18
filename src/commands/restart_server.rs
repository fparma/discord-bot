use crate::commands::common::error::command_error::CommandError;
use crate::commands::common::macros::ok_or_respond_with_error;
use crate::Context;
use anyhow::{anyhow, Error};
use poise::serenity_prelude::{ButtonStyle, CreateActionRow, CreateButton};
use poise::CreateReply;

#[poise::command(
    slash_command,
    rename = "restart_server",
    user_cooldown = 5,
    guild_only,
    reuse_response
)]
/// Restarts the arma server
pub async fn restart_server(ctx: Context<'_>) -> Result<(), Error> {
    ok_or_respond_with_error!(ctx, do_restart_server(ctx).await);

    Ok(())
}

async fn do_restart_server(ctx: Context<'_>) -> Result<(), CommandError> {
    let handle = if ctx.data().server_info.get_server_info()?.current_players != 0 {
        let components = vec![CreateActionRow::Buttons(vec![
            CreateButton::new("yes")
                .label("Yes")
                .style(ButtonStyle::Danger),
            CreateButton::new("no")
                .label("No")
                .style(ButtonStyle::Primary),
        ])];

        let reply = CreateReply::default()
            .content("The server is currently not empty. Are you sure you want to restart?")
            .components(components.clone());

        let handle = ctx.send(reply).await?;

        let interaction = handle
            .message()
            .await?
            .await_component_interaction(ctx)
            .await
            .ok_or(anyhow!("No interaction received"))?;

        if interaction.data.custom_id == "no" {
            handle
                .edit(
                    ctx,
                    CreateReply::default()
                        .components(vec![])
                        .content("Cancelled restart"),
                )
                .await?;
            return Ok(());
        }

        handle
            .edit(
                ctx,
                CreateReply::default()
                    .components(vec![])
                    .content("As you wish. Restarting server..."),
            )
            .await?;

        handle
    } else {
        ctx.send(CreateReply::default().content("Server is empty. Restarting..."))
            .await?
    };

    match ctx.data().ssh_client.restart_server().await {
        Ok(_) => {
            handle
                .edit(
                    ctx,
                    CreateReply::default()
                        .components(vec![])
                        .content("Server restarted successfully"),
                )
                .await?;
        }
        Err(e) => {
            handle
                .edit(
                    ctx,
                    CreateReply::default()
                        .components(vec![])
                        .content("Failed to restart server"),
                )
                .await?;
            return Err(anyhow!("Failed to restart server: {}", e).into());
        }
    }

    Ok(())
}
