use crate::services::settings;
use serde::Serialize;
use shared::{
    ApiError, GetState,
    models::user::GetUser,
    response::{ApiResponse, ApiResponseResult},
};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use super::State;

mod allowed_eggs {
    use super::*;

    #[derive(ToSchema, Serialize)]
    struct Response {
        eggs: Vec<uuid::Uuid>,
    }

    #[utoipa::path(get, path = "/allowed-eggs", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
    ))]
    pub async fn route(state: GetState, _user: GetUser) -> ApiResponseResult {
        let eggs = settings::get_allowed_eggs(&state).await?;
        ApiResponse::new_serialized(Response { eggs }).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(allowed_eggs::route))
        .with_state(state.clone())
}
