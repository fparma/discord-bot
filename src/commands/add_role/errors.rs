use crate::commands::models::bad_roles::BadRoles;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AddRoleError {
    #[error("No roles provided")]
    NoRolesProvided,
    #[error("Roles not found: {0}")]
    RolesNotFound(BadRoles),
    #[error("Roles not Found: {0}")]
    RoleNotAllowed(BadRoles),
}
