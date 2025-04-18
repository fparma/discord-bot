use crate::commands::models::pbo_name::PboName;
use crate::commands::models::repo::Repo;
use crate::commands::upload::errors::PboUploadError;
use crate::helpers::pbo_downlaoder::download_pbo_file;
use crate::helpers::pbo_linter::lint_pbo;
use crate::Context;
use anyhow::{anyhow, Error};
use poise::serenity_prelude::{ButtonStyle, CreateActionRow, CreateButton, Message};
use poise::CreateReply;
use reqwest::Url;
use std::env::temp_dir;
use std::str::FromStr;
use uuid::Uuid;

/// Upload a PBO to the server
#[poise::command(
    context_menu_command = "Upload Mission",
    user_cooldown = 5,
    reuse_response
)]
pub async fn do_upload(
    ctx: Context<'_>,
    #[description = "Message to react to (enter a link or ID)"] msg: Message,
) -> Result<(), Error> {
    let folder = Uuid::new_v4().to_string();

    let res = do_upload_body(ctx, msg, &folder).await;

    if let Err(e) = res {
        ctx.say(format!("{}", e)).await?;
    }

    //ok_or_respond_with_error!(&ctx, cleanup_pbo_folder(&folder).await);

    Ok(())
}

async fn do_upload_body(
    ctx: Context<'_>,
    msg: Message,
    folder_name: &str,
) -> Result<(), PboUploadError> {
    let file = msg
        .attachments.first()
        .ok_or_else(|| PboUploadError::NoAttachment)?;

    let url = Url::parse(&file.url).map_err(|_| PboUploadError::BadAttachment)?;
    let name = extract_name_from_url(&url)?;

    ctx.defer().await?;

    let dl_path = download_pbo_file(&url, &name, folder_name).await?;

    lint_pbo(&dl_path).await?;

    let handle = ctx.send(create_repo_reply()).await?;

    let interaction = handle
        .message()
        .await?
        .await_component_interaction(ctx)
        .await
        .ok_or(anyhow!("No interaction received"))?;

    handle
        .edit(
            ctx,
            CreateReply::default()
                .components(vec![])
                .content("Working on it..."),
        )
        .await?;

    let name = ctx
        .data()
        .ssh_client
        .upload_pbo(
            &dl_path,
            &name,
            Repo::from_str(&interaction.data.custom_id)?,
        )
        .await?;

    handle
        .edit(
            ctx,
            CreateReply::default()
                .components(vec![])
                .content(format!("Done! Uploaded as: `{}`", name)),
        )
        .await?;

    Ok(())
}

pub async fn cleanup_pbo_folder(folder: &str) -> Result<(), PboUploadError> {
    let path = temp_dir().join(folder);
    if path.exists() {
        tokio::fs::remove_dir_all(path).await?;
    }
    Ok(())
}

pub fn extract_name_from_url(url: &Url) -> Result<PboName, PboUploadError> {
    let filename = url
        .path_segments()
        .ok_or(PboUploadError::BadAttachment)?
        .next_back()
        .ok_or(PboUploadError::BadAttachment)?;

    PboName::parse(filename).map_err(|e| e.into())
}

fn create_repo_reply() -> CreateReply {
    let components = vec![CreateActionRow::Buttons(vec![
        CreateButton::new("core")
            .label("Core")
            .style(ButtonStyle::Primary),
        CreateButton::new("main")
            .label("Main")
            .style(ButtonStyle::Primary),
        CreateButton::new("blended")
            .label("Blended")
            .style(ButtonStyle::Primary),
    ])];

    CreateReply::default()
        .content("Select a repo")
        .components(components)
}
