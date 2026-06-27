use shared::State;
use sqlx::Row;

pub async fn get_allowed_eggs(state: &State) -> Result<Vec<uuid::Uuid>, anyhow::Error> {
    let row = sqlx::query("SELECT allowed_egg_uuids FROM ext_server_properties_settings WHERE id = 1")
        .fetch_optional(state.database.read())
        .await?;

    Ok(match row {
        Some(row) => row.try_get::<Vec<uuid::Uuid>, _>("allowed_egg_uuids").unwrap_or_default(),
        None => Vec::new(),
    })
}

pub async fn set_allowed_eggs(state: &State, egg_uuids: &[uuid::Uuid]) -> Result<(), anyhow::Error> {
    sqlx::query(
        r#"
        INSERT INTO ext_server_properties_settings (id, allowed_egg_uuids, updated)
        VALUES (1, $1, NOW())
        ON CONFLICT (id)
        DO UPDATE SET allowed_egg_uuids = EXCLUDED.allowed_egg_uuids, updated = NOW()
        "#,
    )
    .bind(egg_uuids)
    .execute(state.database.write())
    .await?;

    Ok(())
}
