use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct EventAnnouncementState {
    pub initial_announcement: bool,
    pub thirty_minute_announcement: bool,
}

impl Default for EventAnnouncementState {
    fn default() -> Self {
        EventAnnouncementState {
            initial_announcement: false,
            thirty_minute_announcement: false,
        }
    }
}
