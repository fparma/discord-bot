use crate::services::fp_db::fp_db_client::FpDbClient;
use crate::state::AppState;
use envconfig::Envconfig;
use openssh::{Session, SessionBuilder};
use poise::serenity_prelude as serenity;
use poise::serenity_prelude::ClientBuilder;
use std::fs;
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::fmt::format;
use crate::services::status_updater::status_updater::run_status_updater;

pub mod commands;
pub mod helpers;
pub mod services;

mod app;
mod config;
mod state;

type Context<'a> = poise::Context<'a, Arc<AppState>, anyhow::Error>;

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    tracing_subscriber::fmt::init();

    let config = config::Config::init_from_env().expect("Failed to load configuration");

    info!("Loaded configuration");

    let state = AppState::new(&config)
        .await
        .expect("Failed to initialize app");
    
    let state = Arc::new(state);

    let options = app::get_options();

    let framework = app::get_framework(options, state.clone()).await;

    let mut client = ClientBuilder::new(
        config.bot_config.token,
        serenity::GatewayIntents::non_privileged(),
    )
    .framework(framework)
    .await
    .expect("Failed to create client");
    
    let shard_client = client.shard_manager.clone();
    
    tokio::spawn(async move {
        run_status_updater(shard_client,state).await;
    });
    
    client.start().await.expect("Failed to start bot");
}
