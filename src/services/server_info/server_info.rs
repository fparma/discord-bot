use std::net::IpAddr;
use anyhow::Error;
use gamedig::protocols::valve::game::Response;
use crate::config::ArmaConfig;
use crate::services::server_info::server_details::ServerDetails;

#[derive(Debug)]
pub struct ServerInfo {
    server_ip: IpAddr
}

impl ServerInfo {
    pub fn new(arma_config: &ArmaConfig) -> Self {
        Self {
            server_ip: arma_config.server_ip.clone()
        }
    }
    
    pub fn get_server_info(&self) -> Result<ServerDetails, Error> {
        let game_inf: Response = gamedig::arma3::query(&self.server_ip, None)?;
        
        Ok(game_inf.into())
    }
}