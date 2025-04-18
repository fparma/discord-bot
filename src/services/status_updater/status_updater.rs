use crate::commands::models::repo::Repo;
use crate::services::server_info::server_details::ServerDetails;
use crate::state::AppState;
use anyhow::Error;
use log::{error, info};
use poise::serenity_prelude::{ActivityData, ShardManager};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

pub async fn run_status_updater(shard_manager: Arc<ShardManager>, app_state: Arc<AppState>) {
    // Wait a bit for the bot to connect to Discord
    sleep(Duration::from_secs(5)).await;

    let mut interval = tokio::time::interval(Duration::from_secs(30));

    interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

    loop {
        interval.tick().await;

        let status = get_status(&app_state).await;

        let shards = shard_manager.runners.lock().await;

        for (_, shard) in shards.iter() {
            shard.runner_tx.set_activity(Some(status.clone()));
        }
    }
}

async fn get_status(app_state: &Arc<AppState>) -> ActivityData {
    match get_server_info(app_state).await {
        Ok((
            ServerDetails {
                current_players: 0, ..
            },
            repo,
        )) => {
            let text = format!("Server waiting | Repo: {}", repo);
            ActivityData::custom(text)
        }
        Ok((server_info, repo)) => {
            let text = format!(
                "[{}/{}] playing {} on {} | Repo: {}",
                server_info.current_players,
                server_info.max_players,
                server_info.mission_name,
                server_info.map_name,
                repo
            );
            ActivityData::custom(text)
        }
        Err(e) => {
            error!("Failed to get server info: {}", e);
            ActivityData::custom("Error fetching status")
        }
    }
}

async fn get_server_info(app_state: &Arc<AppState>) -> Result<(ServerDetails, String), Error> {
    let server_info = app_state.server_info.get_server_info()?;

    let repo = app_state
        .ssh_client
        .get_last_deploy()
        .await
        .map_err(|e| Error::msg(format!("Failed to get repo: {}", e)))?;

    Ok((server_info, repo))
}
