use crate::config::Config;
use crate::services::bot_db::bot_db_client::BotDbClient;
use crate::services::fp_db::fp_db_client::FpDbClient;
use crate::services::server_info::server_info_service::ServerInfoService;
use crate::services::ssh::ssh_client::SshClient;

#[derive(Debug)]
pub struct AppState {
    pub fp_db_client: FpDbClient,
    pub bot_db_client: BotDbClient,
    pub ssh_client: SshClient,
    pub server_info: ServerInfoService
}

impl AppState {
    pub async fn new(config: &Config) -> Result<Self, anyhow::Error> {
        let fp_db_client = FpDbClient::new(&config.db_config.fparma).await?;
        let bot_db_client = BotDbClient::new(&config.db_config.bot).await?;
        let ssh_client = SshClient::new(&config.ftp_config);
        let server_info = ServerInfoService::new(&config.arma_config);

        Ok(Self {
            fp_db_client,
            ssh_client,
            bot_db_client,
            server_info
        })
    }
}
