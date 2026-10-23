use crate::commands::add_role::errors::AddRoleError;
use crate::commands::allow_role::errors::AllowRoleError;
use crate::commands::forbid_role::errors::ForbidRoleError;
use crate::commands::remove_role::errors::RemoveRoleError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CommandError {
    #[error("{0}")]
    AddRoleError(#[from] AddRoleError),
    #[error("{0}")]
    AllowRoleError(#[from] AllowRoleError),
    #[error("{0}")]
    RemoveRoleError(#[from] RemoveRoleError),
    #[error("{0}")]
    ForbidRoleError(#[from] ForbidRoleError),
    #[error("An unexpected error occurred: {0:?}")]
    UnknownError(#[from] anyhow::Error),
    #[error("Discord error: {0}")]
    DiscordError(#[from] poise::serenity_prelude::Error),
}
