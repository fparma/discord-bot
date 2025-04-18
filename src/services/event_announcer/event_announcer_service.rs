use crate::services::event_announcer::event_announcement_state::EventAnnouncementState;
use crate::services::fp_db::models::event::Event;
use crate::services::kv_cache::KVCache;
use crate::state::AppState;
use log::error;
use mongodb::bson::DateTime;
use poise::serenity_prelude::{ChannelId, CreateAllowedMentions, CreateEmbed, CreateMessage, Http, Mention, RoleId};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

pub async fn run_event_announcer(client: Arc<Http>, state: Arc<AppState>) -> ! {
    // Wait a bit for the bot to connect to Discord
    sleep(Duration::from_secs(5)).await;

    let mut interval = tokio::time::interval(Duration::from_secs(30));

    let channel = ChannelId::new(563757919418712064);

    interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

    loop {
        interval.tick().await;

        let events = match state.fp_db_client.find_future_events().await {
            Ok(events) => events,
            Err(e) => {
                error!("Failed to get future events: {}", e);
                continue;
            }
        };

        let messages: Vec<_> = events
            .iter()
            .filter_map(|e| event_to_message(e, &state.kv_cache))
            .flatten()
            .collect();

        for message in messages {
            channel
                .send_message(&client, message)
                .await
                .expect("Failed to send message");
        }
    }
}

fn event_to_message(event: &Event, cache: &KVCache) -> Option<Vec<CreateMessage>> {
    let mut state = match cache.get(event.id.bytes()) {
        Ok(Some(state)) => state,
        _ => EventAnnouncementState::default(),
    };

    let mut messages = Vec::new();

    let event_ulr = format!(
        "https://fparma.herokuapp.com/events/event/{}",
        event.permalink
    );

    let time_in_seconds = event.date.timestamp_millis() / 1000;
    let hammer_time = format!("<t:{}:f>", time_in_seconds);
    let arma_event_mention = Mention::Role(RoleId::new(457225971406340097));

    let embed = CreateEmbed::new()
        .title(&event.name)
        .field("Author/s", &event.authors, true)
        .field("Happening", hammer_time, true)
        .image(&event.image_url)
        .url(event_ulr);

    if !state.initial_announcement {
        let message = CreateMessage::default()
            .allowed_mentions(CreateAllowedMentions::new().all_roles(true))
            .content(format!(":joystick: New event! {}", arma_event_mention))
            .embed(embed.clone());

        messages.push(message);
        state.initial_announcement = true;
    }

    if !state.thirty_minute_announcement
        && event.date < DateTime::now().saturating_add_duration(Duration::from_secs(30 * 60))
    {
        let message = CreateMessage::default()
            .allowed_mentions(CreateAllowedMentions::new().all_roles(true))
            .content(format!(":joystick: Event is go in 30 minutes! {}", arma_event_mention))
            .embed(embed.clone());

        messages.push(message);
        state.thirty_minute_announcement = true;
    }

    let _ = cache.set(event.id.bytes(), state);

    Some(messages)
}
