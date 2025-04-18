use crate::commands::models::bad_roles::BadRoles;
use std::fmt::Display;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RemoveRoleError {
    #[error("Roles not found: {0}")]
    RolesNotFound(BadRoles),
    #[error("Roles not Found: {0}")]
    RoleNotAllowed(BadRoles),
}


