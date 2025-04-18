use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
pub struct EventAnnouncementState {
    pub initial_announcement: bool,
    pub thirty_minute_announcement: bool,
}
