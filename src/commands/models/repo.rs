use std::fmt::Display;
use std::str::FromStr;

#[derive(Debug, poise::ChoiceParameter, Default)]
pub enum Repo {
    Core,
    #[default]
    Main,
    Blended,
}

impl Display for Repo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let str = match self {
            Repo::Core => "core".to_string(),
            Repo::Main => "main".to_string(),
            Repo::Blended => "blended".to_string(),
        };
        write!(f, "{}", str)
    }
}

impl FromStr for Repo {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "core" => Ok(Repo::Core),
            "main" => Ok(Repo::Main),
            "blended" => Ok(Repo::Blended),
            _ => Err(anyhow::anyhow!("Invalid repo name")),
        }
    }
}
