use std::fmt::Display;

#[derive(Debug)]
pub struct BadPermissions(Vec<String>);

impl BadPermissions {
    pub fn new(permissions: Vec<String>) -> Self {
        BadPermissions(permissions)
    }
}

impl Display for BadPermissions {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0.join(", "))
    }
}
