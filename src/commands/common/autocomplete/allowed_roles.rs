use crate::Context;
use poise::serenity_prelude::{AutocompleteChoice, RoleId};
use std::sync::{Arc, LazyLock};
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

static ALLOWED_ROLE_NAME_CACHE: LazyLock<RoleNameCache> = LazyLock::new(RoleNameCache::new);

pub async fn autocomplete_allowed_roles(
    ctx: Context<'_>,
    partial: &str,
) -> impl Iterator<Item = AutocompleteChoice> {
    let allowed_roles = ALLOWED_ROLE_NAME_CACHE.get(&ctx).await;
    
    let result: Vec<_> = allowed_roles
        .into_iter()
        .filter(|role| role.starts_with(partial))
        .map(|role| AutocompleteChoice::new(role.clone(), role))
        .collect();
    
    result.into_iter()
}

#[derive(Debug)]
struct RoleNameCache {
    cache: Arc<Mutex<(Vec<String>, Instant)>>,
}

impl RoleNameCache {
    fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new((
                Vec::new(),
                Instant::now() - Duration::from_secs(120),
            ))),
        }
    }

    async fn get(&self, ctx: &Context<'_>) -> Vec<String> {
        let mut cache = self.cache.lock().await;
        if cache.1.elapsed() > Duration::from_secs(60) {
            let allowed_roles_ids = ctx
                .data()
                .bot_db_client
                .get_allowed_roles()
                .await
                .unwrap_or_default();
            
            let guild_roles = ctx.guild().unwrap().roles.clone();
            
            let role_names = allowed_roles_ids
                .iter()
                .filter_map(|role_id| {
                    guild_roles
                        .get(&RoleId::new(role_id.parse().unwrap()))
                        .map(|role| role.name.clone())
                })
                .collect::<Vec<_>>();
            
            cache.0 = role_names;
            cache.1 = Instant::now();
        }

        cache.0.clone()
    }
}
