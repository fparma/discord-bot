use mongodb::bson::DateTime;

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct User {
    pub name: String,
    pub created_at: DateTime,
    pub steam_id: String,
}
