use crate::commands::common::macros::ok_or_respond;

use crate::Context;
use anyhow::Error;

/// Get currently deployed repo
#[poise::command(slash_command, rename = "deployed", user_cooldown = 5)]
pub async fn get_deployed(ctx: Context<'_>) -> Result<(), Error> {
    let deployed = ok_or_respond!(
        ctx,
        ctx.data().ssh_client.get_last_deploy().await,
        "An error occurred while fetching the deployed repo."
    );

    let text = format!("The currently deployed repo seems to be: {}", deployed);

    ctx.say(text).await?;

    Ok(())
}
