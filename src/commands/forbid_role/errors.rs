use std::fmt::Display;
use thiserror::Error;
use crate::commands::common::error::models::bad_permissions::BadPermissions;

#[derive(Debug, Error)]
pub enum ForbidRoleError {
    #[error("Role not found")]
    RoleNotFound,
    #[error("Role was not allowed")]
    RoleWasNotAllowed,
}
