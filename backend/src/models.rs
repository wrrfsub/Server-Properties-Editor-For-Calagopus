use garde::Validate;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminConfigResponse {
    pub allowed_egg_uuids: Vec<uuid::Uuid>,
}

#[derive(ToSchema, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct AdminUpdateConfigRequest {
    #[garde(skip)]
    #[serde(default)]
    pub allowed_egg_uuids: Option<Vec<uuid::Uuid>>,
}

#[derive(ToSchema, Serialize)]
pub struct Property {
    pub key: String,
    pub value: String,
}

#[derive(ToSchema, Serialize)]
pub struct PropertiesResponse {
    pub found: bool,
    pub properties: Vec<Property>,
}

#[derive(ToSchema, Deserialize, Validate)]
pub struct SaveRequest {
    #[garde(skip)]
    pub values: HashMap<String, String>,
}
