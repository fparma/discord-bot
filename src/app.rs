use std::sync::Arc;
use crate::commands::add_role::command::add_role;
use crate::commands::allow_role::command::allow_role;
use crate::commands::deployed::get_deployed;
use crate::commands::remove_role::command::remove_role;
use crate::commands::stats::get_stats;
use crate::commands::upload::command::do_upload;
use crate::state::AppState;
use poise::builtins;
use poise::serenity_prelude::Command;
use tracing::{debug, error};
use crate::commands::forbid_role::command::forbid_role;

pub fn get_options() -> poise::FrameworkOptions<Arc<AppState>, anyhow::Error> {
    poise::FrameworkOptions {
        commands: vec![
            get_stats(),
            get_deployed(),
            do_upload(),
            allow_role(),
            add_role(),
            remove_role(),
            forbid_role()
        ],
        on_error: |error| Box::pin(on_error(error)),
        pre_command: |ctx| {
            Box::pin(async move {
                debug!("Executing command {}", ctx.command().qualified_name);
            })
        },

        post_command: |ctx| {
            Box::pin(async move {
                debug!("Executed command {}!", ctx.command().qualified_name);
            })
        },

        event_handler: |_context, _, _framework, _state| {
            Box::pin(async move {
                Ok(())
            })
        },
        ..Default::default()
    }
}

async fn on_error(e: poise::FrameworkError<'_, Arc<AppState>, anyhow::Error>) {
    match e {
        poise::FrameworkError::Setup { error, .. } => panic!("Failed to start bot: {:?}", error),
        poise::FrameworkError::Command { error, ctx, .. } => {
            error!("Error in command `{}`: {error:?}", ctx.command().name,);
        }
        error => {
            if let Err(e) = poise::builtins::on_error(error).await {
                error!("Error while handling error: {}", e);
            }
        }
    }
}

pub async fn get_framework(
    options: poise::FrameworkOptions<Arc<AppState>, anyhow::Error>,
    app_state: Arc<AppState>,
) -> poise::Framework<Arc<AppState>, anyhow::Error> {
    poise::Framework::builder()
        .setup(move |ctx, _ready, framework| {
            Box::pin(async move {
                let commands = builtins::create_application_commands(&framework.options().commands);
                Command::set_global_commands(ctx, commands)
                    .await
                    .expect("Failed to set global application commands");
                Ok(app_state)
            })
        })
        .options(options)
        .build()
}
