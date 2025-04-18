use gamedig::protocols::valve::game::Response;

pub struct ServerDetails {
    pub map_name: String,
    pub mission_name: String,
    pub current_players: u8,
    pub max_players: u8,
}

impl From<Response> for ServerDetails {
    fn from(res: Response) -> Self {
        Self {
            map_name: res.map,
            mission_name: res.game,
            current_players: res.players_online,
            max_players: res.players_maximum,
        }
    }
}
