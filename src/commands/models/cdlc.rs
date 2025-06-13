use std::fmt::Display;
use std::str::FromStr;

#[derive(Debug, poise::ChoiceParameter, Default)]
pub enum CDlc {
    #[default]
    None,
    Gm,
    Vn,
    Ws,
    Csla,
    Spe,
}

impl Display for CDlc {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let str = match self {
            CDlc::None => "none".to_string(),
            CDlc::Gm => "gm".to_string(),
            CDlc::Vn => "vn".to_string(),
            CDlc::Ws => "ws".to_string(),
            CDlc::Csla => "csla".to_string(),
            CDlc::Spe => "spe".to_string(),
        };
        write!(f, "{}", str)
    }
}

impl FromStr for CDlc {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "none" => Ok(CDlc::None),
            "gm" => Ok(CDlc::Gm),
            "vn" => Ok(CDlc::Vn),
            "ws" => Ok(CDlc::Ws),
            "csla" => Ok(CDlc::Csla),
            "spe" => Ok(CDlc::Spe),
            _ => Err(anyhow::anyhow!("Invalid CDLC name")),
        }
    }
}
