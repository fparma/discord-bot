use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub struct BadRoles(Vec<String>);

impl BadRoles {
    pub fn new(roles: Vec<String>) -> Self {
        Self(roles)
    }
}

impl Display for BadRoles {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0.join(", "))
    }
}
