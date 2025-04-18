use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ConfigData {
    pub id: String,
    pub roles: Vec<String>,
}
