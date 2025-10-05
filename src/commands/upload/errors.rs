use crate::commands::models::pbo_name::PboNameError;
use poise::serenity_prelude;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PboUploadError {
    #[error("No attachment found")]
    NoAttachment,
    #[error("Bad attachment")]
    BadAttachment,
    #[error("PBO file is too large")]
    ToLargeError,
    #[error("Error decoding PBO")]
    DecodeError,
    #[error("File does not seem to be a PBO")]
    FileTypeError,
    #[error("PBO linting failed")]
    LintError,
    #[error("PBO linting produced the following errors:\n{0}")]
    LintErrors(String),
    #[error("Error uploading PBO")]
    UploadError,
    #[error("Error connecting to the arma server: {0}")]
    SftpError(#[from] openssh_sftp_client::Error),
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
    #[error("Discord error: {0}")]
    SerenityError(#[from] serenity_prelude::Error),
    #[error("PBO name is not valid: {0}")]
    InvalidPboName(#[from] PboNameError),
    #[error("Network error: {0}")]
    DownloadError(#[from] reqwest::Error),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}
