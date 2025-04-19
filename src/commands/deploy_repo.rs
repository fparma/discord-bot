use crate::commands::common::components::text_reply::text_reply;
use crate::commands::common::components::yes_no_buttons::generate_yes_no_buttons;
use crate::commands::common::error::command_error::CommandError;
use crate::commands::common::macros::ok_or_respond_with_error;
use crate::commands::models::cdlc::CDlc;
use crate::commands::models::repo::Repo;
use crate::Context;
use anyhow::{anyhow, Error};
use poise::CreateReply;

#[poise::command(
    slash_command,
    rename = "deploy_repo",
    global_cooldown = 240,
    guild_only,
    reuse_response
)]
/// Deploys the specified repo to the server
pub async fn deploy_repo(ctx: Context<'_>, repo: Repo, c_dlc: Option<CDlc>) -> Result<(), Error> {
    ok_or_respond_with_error!(
        ctx,
        do_deploy_repo(ctx, repo, c_dlc.unwrap_or_default()).await
    );

    Ok(())
}

async fn do_deploy_repo(ctx: Context<'_>, repo: Repo, c_dlc: CDlc) -> Result<(), CommandError> {
    let handle = if ctx.data().server_info.get_server_info()?.current_players != 0 {
        let reply = CreateReply::default()
            .content("The server is currently not empty. Are you sure you want to deploy?")
            .components(generate_yes_no_buttons());

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

        handle
            .edit(ctx, text_reply("As you wish. Deploying..."))
            .await?;

        handle
    } else {
        ctx.send(text_reply("Server is empty. Deploying..."))
            .await?
    };

    match ctx.data().ssh_client.deploy_repo(repo, c_dlc).await {
        Ok(_) => {
            handle
                .edit(ctx, text_reply("Deployed successfully"))
                .await?;
        }
        Err(e) => {
            handle.edit(ctx, text_reply("Failed to deploy")).await?;
            return Err(anyhow!("Failed to deploy: {}", e).into());
        }
    }

    Ok(())
}
