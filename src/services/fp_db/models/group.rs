use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Group {
    units: Unit,
}

#[derive(Serialize, Deserialize)]
pub struct Unit {
    user_id: String,
}
