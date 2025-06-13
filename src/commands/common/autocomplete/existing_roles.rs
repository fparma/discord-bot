use crate::Context;
use poise::serenity_prelude::AutocompleteChoice;
use std::sync::{Arc, LazyLock};
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

pub static EXISTING_ROLE_NAME_CACHE: LazyLock<ExistingRoleNameCache> =
    LazyLock::new(ExistingRoleNameCache::new);

pub async fn autocomplete_existing_roles(
    ctx: Context<'_>,
    partial: &str,
) -> impl Iterator<Item = AutocompleteChoice> {
    let allowed_roles = EXISTING_ROLE_NAME_CACHE.get(&ctx).await;

    let result: Vec<_> = allowed_roles
        .into_iter()
        .filter(|role| role.starts_with(partial))
        .map(|role| AutocompleteChoice::new(role.clone(), role))
        .collect();

    result.into_iter()
}

#[derive(Debug)]
pub struct ExistingRoleNameCache {
    cache: Arc<Mutex<(Vec<String>, Instant)>>,
}

impl ExistingRoleNameCache {
    fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new((
                Vec::new(),
                Instant::now() - Duration::from_secs(120),
            ))),
        }
    }

    pub async fn get(&self, ctx: &Context<'_>) -> Vec<String> {
        let mut cache = self.cache.lock().await;
        if cache.1.elapsed() > Duration::from_secs(60) {
            let existing_roles: Vec<_> = ctx
                .guild()
                .unwrap()
                .roles
                .clone()
                .values()
                .cloned()
                .map(|r| r.name)
                .collect();

            cache.0 = existing_roles;
            cache.1 = Instant::now();
        }

        cache.0.clone()
    }

    pub async fn clear(&self) {
        let mut cache = self.cache.lock().await;
        cache.0.clear();
        cache.1 = Instant::now() - Duration::from_secs(120);
    }
}
