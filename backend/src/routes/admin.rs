use crate::{
    models::{AdminConfigResponse, AdminUpdateConfigRequest},
    services::settings,
};
use serde::Serialize;
use shared::{
    ApiError, GetState, Payload,
    models::user::GetPermissionManager,
    response::{ApiResponse, ApiResponseResult},
};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use super::State;

mod get_config {
    use super::*;

    #[derive(ToSchema, Serialize)]
    struct Response {
        config: AdminConfigResponse,
    }

    #[utoipa::path(get, path = "/config", responses(
        (status = OK, body = inline(Response)),
        (status = FORBIDDEN, body = ApiError),
    ))]
    pub async fn route(state: GetState, permissions: GetPermissionManager) -> ApiResponseResult {
        permissions.has_admin_permission("settings.read")?;
        let allowed_egg_uuids = settings::get_allowed_eggs(&state).await?;
        ApiResponse::new_serialized(Response {
            config: AdminConfigResponse { allowed_egg_uuids },
        })
        .ok()
    }
}

mod update_config {
    use super::*;

    #[derive(ToSchema, Serialize)]
    struct Response {
        config: AdminConfigResponse,
    }

    #[utoipa::path(put, path = "/config", request_body = AdminUpdateConfigRequest, responses(
        (status = OK, body = inline(Response)),
        (status = FORBIDDEN, body = ApiError),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        Payload(request): Payload<AdminUpdateConfigRequest>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("settings.update")?;

        if let Some(eggs) = &request.allowed_egg_uuids {
            settings::set_allowed_eggs(&state, eggs).await?;
        }

        let allowed_egg_uuids = settings::get_allowed_eggs(&state).await?;
        ApiResponse::new_serialized(Response {
            config: AdminConfigResponse { allowed_egg_uuids },
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get_config::route))
        .routes(routes!(update_config::route))
        .with_state(state.clone())
}
