use crate::config::FpDbConfig;
use crate::services::fp_db::models::group::Group;
use crate::services::fp_db::models::user::User;
use mongodb::bson::doc;

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
                { "name": username_or_steam_id },
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
}
