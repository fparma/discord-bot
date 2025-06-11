use crate::commands::upload::errors::PboUploadError;
use anyhow::anyhow;
use log::warn;
use std::path::PathBuf;
use tracing::info;
use uuid::Uuid;

pub async fn lint_pbo(pbo_path: &PathBuf) -> Result<(), PboUploadError> {
    let mut extract = tokio::process::Command::new("extractpbo");
    extract.arg("-PWS").arg(pbo_path);

    info!("Extracting PBO");

    let res = extract.spawn()?.wait_with_output().await?;

    if !res.status.success() {
        return Err(PboUploadError::DecodeError);
    }

    let folder = pbo_path.parent().ok_or_else(|| anyhow!("no folder"))?;

    // Lint
    let mut lint = tokio::process::Command::new("makepbo");
    lint.arg("-WP")
        .arg(folder)
        .arg(format!("{}.pbo", Uuid::new_v4()));

    info!("Linting PBO");

    let res = lint.spawn()?.wait_with_output().await?;

    if res.status.success() {
        return Ok(());
    }

    match res.status.code() {
        Some(13 | 17 | 87) => {
            let errors = String::from_utf8_lossy(&res.stdout);
            let errors = errors
                .lines()
                .filter(|str| str.contains(folder.to_str().unwrap()))
                .map(|str| str.to_string())
                .map(|str| str.replace(folder.to_str().unwrap(), "").trim().to_owned())
                .collect::<Vec<_>>()
                .join("\n");

            Err(PboUploadError::LintErrors(errors))
        }
        _ => {
            warn!(
                "PBO linting failed with unexpected status code: {:?}",
                res.status.code()
            );
            Err(PboUploadError::LintError)
        }
    }
}
