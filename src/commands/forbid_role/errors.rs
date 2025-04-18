use thiserror::Error;

#[derive(Debug, Error)]
pub enum ForbidRoleError {
    #[error("Role not found")]
    RoleNotFound,
    #[error("Role was not allowed")]
    RoleWasNotAllowed,
}
