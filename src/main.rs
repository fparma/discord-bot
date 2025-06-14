use crate::services::event_announcer::event_announcer_service::run_event_announcer;
use crate::services::status_updater::status_updater_service::run_status_updater;
use crate::state::AppState;
use envconfig::Envconfig;
use poise::serenity_prelude as serenity;
use poise::serenity_prelude::ClientBuilder;
use std::sync::Arc;
use tracing::info;

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
        config.bot_config.token.clone(),
        serenity::GatewayIntents::non_privileged(),
    )
    .framework(framework)
    .await
    .expect("Failed to create client");

    let shard_client = client.shard_manager.clone();
    let s = state.clone();
    let c = config.clone();

    tokio::spawn(async move {
        run_status_updater(shard_client, s, c.bot_config).await;
    });

    let http_client = client.http.clone();
    let s = state.clone();
    let c = config.clone();

    tokio::spawn(async move {
        run_event_announcer(http_client, s, c.bot_config).await;
    });

    client.start().await.expect("Failed to start bot");
}
