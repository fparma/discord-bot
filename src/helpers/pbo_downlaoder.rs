use crate::commands::models::pbo_name::PboName;
use crate::commands::upload::errors::PboUploadError;
use log::debug;
use poise::futures_util::StreamExt;
use reqwest::header::CONTENT_TYPE;
use reqwest::Url;
use std::env::temp_dir;
use std::path::PathBuf;
use tokio::io::AsyncWriteExt;

const MAX_FILE_SIZE: usize = 20 * 1024 * 1024; // 20 MB

pub async fn download_pbo_file(
    pbo_url: &Url,
    pbo_name: &PboName,
    folder: &str,
) -> Result<PathBuf, PboUploadError> {
    let folder_path = temp_dir().join(folder);
    let file_path = folder_path.join(pbo_name.to_string());

    debug!("Downloading PBO to path: {}", file_path.display());

    tokio::fs::create_dir_all(&folder_path).await?;

    let client = reqwest::Client::new();
    check_pbo_header(pbo_url, &client).await?;

    let response = client.get(pbo_url.as_str()).send().await?;
    debug!("Got response: {:?}", response);
    if response.status().is_success() {
        let mut file = tokio::fs::File::create(file_path.clone()).await?;
        let mut byte_stream = response.bytes_stream();

        while let Some(item) = byte_stream.next().await {
            tokio::io::copy(&mut item?.as_ref(), &mut file).await?;
        }

        file.flush().await?;
        debug!("File flushed to disk");
        debug!("File created: {}", file_path.display());
        debug!("File size: {:?}", file.metadata().await?.len());

        Ok(file_path)
    } else {
        Err(anyhow::anyhow!("Failed to download PBO file").into())
    }
}

async fn check_pbo_header(pbo_url: &Url, client: &reqwest::Client) -> Result<(), PboUploadError> {
    let response = client.head(pbo_url.as_str()).send().await?;

    debug!("Checking PBO header for URL: {}", pbo_url);
    debug!("Status: {:?}", response);

    if response.status().is_success() {
        if let Some(content_length) = response.content_length() {
            if content_length > MAX_FILE_SIZE as u64 {
                return Err(PboUploadError::ToLargeError);
            }
        } else {
            return Err(anyhow::anyhow!("Failed to get content length").into());
        }

        if let Some(content_type) = response.headers().get(CONTENT_TYPE) {
            if content_type
                .to_str()
                .map_err(|e| PboUploadError::UnknownError(e.into()))?
                .contains("text/html")
            {
                return Err(PboUploadError::FileTypeError);
            }
            return Ok(());
        }

        Err(anyhow::anyhow!("PBO header does not contain content-type header").into())
    } else {
        Err(anyhow::anyhow!("Failed to fetch PBO header").into())
    }
}
