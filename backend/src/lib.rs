use indexmap::IndexMap;
use shared::{
    State,
    extensions::{Extension, ExtensionPermissionsBuilder, ExtensionRouteBuilder},
    permissions::PermissionGroup,
};

mod models;
mod routes;
mod services;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::info!("server properties extension initialized");
    }

    async fn initialize_router(
        &mut self,
        state: State,
        builder: ExtensionRouteBuilder,
    ) -> ExtensionRouteBuilder {
        builder
            .add_admin_api_router(|router| router.merge(routes::admin_router(&state)))
            .add_client_api_router(|router| router.merge(routes::client_router(&state)))
            .add_client_server_api_router(|router| {
                router.merge(routes::client_server_router(&state))
            })
    }

    async fn initialize_permissions(
        &mut self,
        _state: State,
        builder: ExtensionPermissionsBuilder,
    ) -> ExtensionPermissionsBuilder {
        builder.add_server_permission_group(
            "server-properties",
            PermissionGroup {
                description: "Permissions for viewing and editing the server.properties file.",
                permissions: IndexMap::from([
                    ("view", "Allows viewing the server's properties."),
                    ("edit", "Allows changing and saving the server's properties."),
                ]),
            },
        )
    }
}
