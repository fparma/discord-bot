use std::net::IpAddr;
use anyhow::Error;
use gamedig::protocols::valve::game::Response;
use crate::config::ArmaConfig;
use crate::services::server_info::server_details::ServerDetails;

#[derive(Debug)]
pub struct ServerInfoService {
    server_ip: IpAddr
}

impl ServerInfoService {
    pub fn new(arma_config: &ArmaConfig) -> Self {
        Self {
            server_ip: arma_config.server_ip
        }
    }
    
    pub fn get_server_info(&self) -> Result<ServerDetails, Error> {
        let game_inf: Response = gamedig::arma3::query(&self.server_ip, None)?;
        
        Ok(game_inf.into())
    }
    
    pub fn get_active_player_count(&self) -> Result<u8, Error> {
        let game_inf: Response = gamedig::arma3::query(&self.server_ip, None)?;
        
        Ok(game_inf.players_online)
    }
}