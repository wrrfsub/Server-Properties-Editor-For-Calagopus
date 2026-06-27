use crate::{
    models::{PropertiesResponse, SaveRequest},
    services::properties,
};
use serde::Serialize;
use shared::{
    ApiError, GetState, Payload,
    models::{
        server::GetServer,
        user::{GetPermissionManager, GetUser},
    },
    response::{ApiResponse, ApiResponseResult},
};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use super::State;

mod get_properties {
    use super::*;

    #[utoipa::path(get, path = "/properties", responses(
        (status = OK, body = PropertiesResponse),
        (status = FORBIDDEN, body = ApiError),
    ), params(("server" = uuid::Uuid, description = "The server ID")))]
    pub async fn route(state: GetState, permissions: GetPermissionManager, server: GetServer) -> ApiResponseResult {
        permissions.has_server_permission("server-properties.view")?;

        let node = server.node.fetch_cached(&state.database).await?;
        let wings = node.api_client(&state.database).await?;

        let properties = properties::read_properties(&wings, server.uuid).await?;
        ApiResponse::new_serialized(PropertiesResponse {
            found: properties.is_some(),
            properties: properties.unwrap_or_default(),
        })
        .ok()
    }
}

mod save_properties {
    use super::*;

    #[derive(ToSchema, Serialize)]
    struct Response {
        ok: bool,
    }

    #[utoipa::path(put, path = "/properties", request_body = SaveRequest, responses(
        (status = OK, body = inline(Response)),
        (status = FORBIDDEN, body = ApiError),
    ), params(("server" = uuid::Uuid, description = "The server ID")))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        user: GetUser,
        Payload(request): Payload<SaveRequest>,
    ) -> ApiResponseResult {
        permissions.has_server_permission("server-properties.edit")?;

        let node = server.node.fetch_cached(&state.database).await?;
        let wings = node.api_client(&state.database).await?;

        properties::save_properties(&wings, server.uuid, user.uuid, &request.values).await?;
        ApiResponse::new_serialized(Response { ok: true }).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get_properties::route))
        .routes(routes!(save_properties::route))
        .with_state(state.clone())
}
