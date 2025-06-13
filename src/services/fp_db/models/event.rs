use mongodb::bson::DateTime;
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Event {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub name: String,
    pub permalink: String,
    pub authors: String,
    pub image_url: String,
    pub date: DateTime
}