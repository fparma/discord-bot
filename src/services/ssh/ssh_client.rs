use crate::commands::models::pbo_name::PboName;
use crate::commands::models::repo::Repo;
use crate::commands::upload::errors::PboUploadError;
use crate::config::{FtpPathConfig, SshConfig};
use log::info;
use openssh::{Session, SessionBuilder};
use openssh_sftp_client::{Sftp, SftpOptions};
use poise::futures_util::{StreamExt, TryFutureExt};
use std::path::{Path, PathBuf};
use tokio::sync::Semaphore;

#[derive(Debug)]
pub struct SshClient {
    builder: SessionBuilder,
    semaphore: Semaphore,
    connections_string: String,
    ftp_path_config: FtpPathConfig,
}

impl SshClient {
    pub fn new(config: &SshConfig) -> Self {
        let mut builder = SessionBuilder::default();
        builder
            .port(config.port)
            .keyfile(config.private_key_path.clone());

        let connections_string = format!("{}@{}", config.username, config.host);

        SshClient {
            builder,
            connections_string,
            semaphore: Semaphore::new(1),
            ftp_path_config: config.ftp_path_config.clone(),
        }
    }

    pub async fn get_last_deploy(&self) -> Result<String, anyhow::Error> {
        let sftp = get_sftp_session(self).await?;

        let content = sftp
            .fs()
            .read(&self.ftp_path_config.deployed_repo_info)
            .await?;

        sftp.close().await?;

        Ok(String::from_utf8_lossy(&content).to_string())
    }

    pub async fn upload_pbo(
        &self,
        path: &Path,
        pbo_name: &PboName,
        repo: Repo,
    ) -> Result<String, PboUploadError> {
        let permit = self
            .semaphore
            .try_acquire()
            .map_err(|e| PboUploadError::UnknownError(e.into()))?;

        let target_path = PathBuf::new()
            .join(self.ftp_path_config.repo_missions_path.clone())
            .join(repo.to_string())
            .join("mpmissions");

        let sftp = get_sftp_session(self).await?;
        let pbos = get_pbo_files(&sftp, &target_path).await?;

        let name = find_available_name(pbos, pbo_name);

        let target_path = target_path.join(name.clone());

        let data = tokio::fs::read(path).await?;

        info!("Uploading PBO to path: {}", target_path.display());

        sftp.fs().write(&target_path, &data).await?;

        if self.get_last_deploy().await? == repo.to_string() {
            // Also copy the mission to the deployed repo
            let deployed_path = PathBuf::new()
                .join(self.ftp_path_config.server_missions.clone())
                .join(name.clone());

            info!("Uploading PBO to path: {}", deployed_path.display());

            sftp.fs().write(&deployed_path, &data).await?;
        }

        sftp.close().await?;

        info!("Finished uploading PBO");

        drop(permit);

        Ok(name)
    }
}

async fn get_ssh_session(client: &SshClient) -> Result<Session, anyhow::Error> {
    client
        .builder
        .connect(client.connections_string.as_str())
        .map_err(|e| anyhow::anyhow!("Failed to connect: {}", e))
        .await
}

async fn get_sftp_session(client: &SshClient) -> Result<Sftp, anyhow::Error> {
    let session = get_ssh_session(client).await?;

    Sftp::from_session(session, SftpOptions::default())
        .map_err(|e| anyhow::anyhow!("Failed to create SFTP session: {}", e))
        .await
}

async fn get_pbo_files(sftp: &Sftp, path: &Path) -> Result<Vec<String>, anyhow::Error> {
    let dir = sftp.fs().open_dir(path).await?;
    let entries: Vec<_> = dir.read_dir().collect().await;

    let entries = entries
        .into_iter()
        .filter_map(|x| x.ok())
        .filter(|e| {
            e.filename()
                .extension()
                .map_or_else(|| false, |e| e == "pbo")
        })
        .map(|e| e.filename().to_string_lossy().to_string())
        .collect();

    Ok(entries)
}

fn find_available_name(used: Vec<String>, desired: &PboName) -> String {
    let mut name = desired.to_string();
    let mut counter = 1;

    while used.contains(&name) {
        name = desired.with_postfix(&format!("v{}", counter));
        counter += 1;
    }

    name
}
