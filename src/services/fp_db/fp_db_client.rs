use crate::config::FpDbConfig;
use crate::services::fp_db::models::event::Event;
use crate::services::fp_db::models::group::Group;
use crate::services::fp_db::models::user::User;
use mongodb::bson;
use mongodb::bson::doc;
use poise::futures_util::{Stream, StreamExt, TryStreamExt};

#[derive(Debug, Clone)]
pub struct FpDbClient {
    mongo_client: mongodb::Client,
}

impl FpDbClient {
    pub async fn new(fp_db_config: &FpDbConfig) -> Result<Self, anyhow::Error> {
        let mongo_client = mongodb::Client::with_uri_str(&fp_db_config.url)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to connect to MongoDB: {}", e))?;

        Ok(Self { mongo_client })
    }

    pub async fn find_one_user(
        &self,
        username_or_steam_id: &str,
    ) -> Result<Option<User>, anyhow::Error> {
        let db = self.mongo_client.database("fparma");
        let collection = db.collection::<User>("users");
        let filter = doc! {
            "$or": [
                { "name": "/{username_or_steam_id}$/i" },
                { "steam_id": username_or_steam_id }
            ]
        };

        collection
            .find_one(filter)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to find user: {}", e))
    }

    pub async fn count_user_attendance(&self, user_id: &str) -> Result<u64, anyhow::Error> {
        let db = self.mongo_client.database("fparma");
        let collection = db.collection::<Group>("groups");
        let filter = doc! { "units.user_id": { "$in": [user_id] } };

        let count = collection.count_documents(filter).await?;

        Ok(count)
    }

    pub async fn get_user_event_number(&self, name: &str) -> Result<usize, anyhow::Error> {
        let db = self.mongo_client.database("fparma");
        let collection = db.collection::<Event>("events");
        let filter = doc! { "authors": name };
        let event = collection.find(filter).await?;
        Ok(event.count().await)
    }

    pub async fn find_future_events(&self) -> Result<Vec<Event>, anyhow::Error> {
        let db = self.mongo_client.database("fparma");
        let collection = db.collection::<Event>("events");
        let filter = doc! { "date": {"$gte": bson::DateTime::now() } };

        let mut cursor = collection.find(filter).sort(doc! {"date" : 1}).await?;

        let mut events = Vec::with_capacity(cursor.size_hint().0);

        while let Some(event) = cursor.try_next().await? {
            events.push(event)
        }

        Ok(events)
    }
}
