use std::fmt::Display;
use thiserror::Error;
pub(crate) use crate::commands::common::error::models::bad_permissions::BadPermissions;

#[derive(Debug, Error)]
pub enum AllowRoleError {
    #[error("Role not found")]
    RoleNotFound,
    #[error("Role has a forbidden permission: {0}")]
    PermissionNotAllowed(BadPermissions),
    #[error("Role has forbidden permissions")]
    RoleNotAllowed,
}
