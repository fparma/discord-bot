use std::net::IpAddr;
use envconfig::Envconfig;

#[derive(Envconfig, Debug, Clone)]
pub struct Config {
    #[envconfig(nested)]
    pub db_config: DbConfig,
    #[envconfig(nested)]
    pub ftp_config: SshConfig,
    #[envconfig(nested)]
    pub arma_config: ArmaConfig,
    #[envconfig(nested)]
    pub bot_config: BotConfig,
}

#[derive(Envconfig, Debug, Clone)]
pub struct BotConfig {
    #[envconfig(from = "BOT_TOKEN")]
    pub token: String,
    #[envconfig(from = "ANNOUNCEMENT_CHANNEL_ID")]
    pub announcement_channel_id: u64,
    #[envconfig(from = "POLLING_INTERVAL")]
    pub polling_interval: u64,
}

#[derive(Envconfig, Debug, Clone)]
pub struct DbConfig {
    #[envconfig(nested)]
    pub fparma: FpDbConfig,
    #[envconfig(nested)]
    pub bot: BotDbConfig,
}

#[derive(Envconfig, Debug, Clone)]
pub struct FpDbConfig {
    #[envconfig(from = "DB_FPARMA_URI")]
    pub url: String,
}

#[derive(Envconfig, Debug, Clone)]
pub struct BotDbConfig {
    #[envconfig(from = "DB_BOT_URI")]
    pub url: String,
}

#[derive(Envconfig, Debug, Clone)]
pub struct SshConfig {
    #[envconfig(from = "FTP_HOST")]
    pub host: String,
    #[envconfig(from = "FTP_PORT")]
    pub port: u16,
    #[envconfig(from = "FTP_USER")]
    pub username: String,
    #[envconfig(from = "FTP_PASSWORD")]
    pub password: String,
    #[envconfig(from = "FTP_PRIVATE_KEY_PATH")]
    pub private_key_path: String,
    #[envconfig(nested)]
    pub ftp_path_config: FtpPathConfig,
}

#[derive(Envconfig, Debug, Clone)]
pub struct ArmaConfig {
    #[envconfig(from = "A3_SERVER_IP")]
    pub server_ip: IpAddr,
}

#[derive(Envconfig, Debug, Clone)]
pub struct FtpPathConfig {
    #[envconfig(from = "FTP_CWD_REPOS")]
    pub repos_folder_path: String,
    #[envconfig(from = "FTP_DEPLOYED_REPO_INFO")]
    pub deployed_repo_info: String,
    #[envconfig(from = "FTP_CWD_SERVER_MISSIONS")]
    pub server_missions: String,
    #[envconfig(from = "FTP_REPOS")]
    pub repos: String,
}
