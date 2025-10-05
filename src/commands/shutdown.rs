use crate::commands::common::components::text_reply::text_reply;
use crate::commands::common::components::yes_no_buttons::generate_yes_no_buttons;
use crate::Context;
use anyhow::{anyhow, Error};
use poise::CreateReply;
use std::process::exit;

/// Shut the bot down
#[poise::command(slash_command, rename = "shutdown", user_cooldown = 5)]
pub async fn shutdown(ctx: Context<'_>) -> Result<(), Error> {
    let reply = CreateReply::default()
        .content("Are you sure you want to shutdown the bot?")
        .components(generate_yes_no_buttons())
        .ephemeral(true);

    let handle = ctx.send(reply).await?;

    let interaction = handle
        .message()
        .await?
        .await_component_interaction(ctx)
        .await
        .ok_or(anyhow!("No interaction received"))?;

    if interaction.data.custom_id == "no" {
        handle.edit(ctx, text_reply("Cancelled deploy")).await?;
        return Ok(());
    }

    ctx.say("Shutting down...").await?;

    exit(0);
}
