use crate::config::BotDbConfig;
use crate::services::bot_db::models::config_data::ConfigData;
use mongodb::bson::doc;

#[derive(Debug, Clone)]
pub struct BotDbClient {
    mongo_client: mongodb::Client,
}

impl BotDbClient {
    pub async fn new(fp_db_config: &BotDbConfig) -> Result<Self, anyhow::Error> {
        let mongo_client = mongodb::Client::with_uri_str(&fp_db_config.url)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to connect to MongoDB: {}", e))?;

        Ok(Self { mongo_client })
    }

    pub async fn get_allowed_roles(&self) -> Result<Vec<String>, anyhow::Error> {
        let db = self.mongo_client.database("fparma-bot");
        let collection = db.collection::<ConfigData>("config");

        let cursor = collection
            .find_one(doc! { "id": "user_assignable_roles" })
            .await?;

        if let Some(config_data) = cursor {
            Ok(config_data.roles)
        } else {
            Err(anyhow::anyhow!("No allowed roles found"))
        }
    }

    pub async fn save_user_role(&self, role: String) -> Result<(), anyhow::Error> {
        let db = self.mongo_client.database("fparma-bot");
        let collection = db.collection::<ConfigData>("config");

        collection
            .update_one(
                doc! { "id": "user_assignable_roles" },
                doc! { "$addToSet": { "roles": role } },
            )
            .await?;

        Ok(())
    }

    pub async fn remove_user_role(&self, role: String) -> Result<(), anyhow::Error> {
        let db = self.mongo_client.database("fparma-bot");
        let collection = db.collection::<ConfigData>("config");

        collection
            .update_one(
                doc! { "id": "user_assignable_roles" },
                doc! { "$pull": { "roles": role } },
            )
            .await?;

        Ok(())
    }
}
