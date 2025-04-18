use regex::Regex;
use std::fmt::Display;
use std::str::FromStr;
use std::sync::LazyLock;
use thiserror::Error;

pub struct PboName {
    name: String,
    map: String,
}

static PBO_NAME_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^([a-zA-Z0-9%_-]+)\.([a-zA-Z0-9%_-]+)\.pbo$").unwrap());

impl PboName {
    pub fn parse(name: &str) -> Result<PboName, PboNameError> {
        if name.len() > 64 {
            return Err(PboNameError::NameTooLong);
        }

        let matches = PBO_NAME_REGEX
            .captures(name)
            .ok_or(PboNameError::InvalidFormat)?;

        let name = matches
            .get(1)
            .ok_or(PboNameError::InvalidMapName)?
            .as_str()
            .to_string()
            .to_lowercase();

        let map = matches
            .get(2)
            .ok_or(PboNameError::InvalidPboName)?
            .as_str()
            .to_string()
            .to_lowercase();

        Ok(Self { name, map })
    }

    pub fn with_postfix(&self, postfix: &str) -> String {
        format!("{}_{}.{}.pbo", self.name, postfix, self.map)
    }
}

impl Display for PboName {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", format!("{}.{}.pbo", self.name, self.map))
    }
}

#[derive(Debug, Error)]
pub enum PboNameError {
    #[error("Invalid PBO name format")]
    InvalidFormat,
    #[error("Invalid map name")]
    InvalidMapName,
    #[error("Invalid PBO name")]
    InvalidPboName,
    #[error("Name too long")]
    NameTooLong,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_pbo_name() {
        let pbo_name = PboName::parse("my_map.my_pbo.pbo").unwrap();
        assert_eq!(pbo_name.name, "my_map");
        assert_eq!(pbo_name.map, "my_pbo");
    }

    #[test]
    fn test_invalid_pbo_name() {
        assert!(PboName::parse("invalid_pbo_name").is_err());
        assert!(PboName::parse("invalid.pbo.name.pbo").is_err());
        assert!(PboName::parse("invalid.pbo.name").is_err());
    }

    #[test]
    fn test_too_long_pbo_name() {
        let long_name = "a".repeat(65);
        assert!(PboName::parse(&format!("{}.pbo", long_name)).is_err());
    }

    #[test]
    fn test_valid_pbo_name_with_special_chars() {
        let pbo_name = PboName::parse("my_map_123.my_pbo_456.pbo").unwrap();
        assert_eq!(pbo_name.name, "my_map_123");
        assert_eq!(pbo_name.map, "my_pbo_456");
    }
}
