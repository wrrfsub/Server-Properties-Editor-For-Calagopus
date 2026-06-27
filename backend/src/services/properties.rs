use crate::models::Property;
use anyhow::anyhow;
use axum::http::StatusCode;
use compact_str::CompactString;
use std::collections::HashMap;
use tokio::io::AsyncReadExt;
use uuid::Uuid;
use wings_api::client::{ApiHttpError, WingsClient};

const MAX_READ_BYTES: u64 = 1024 * 1024;
const FILE: &str = "server.properties";

async fn read_text(client: &WingsClient, server: Uuid) -> Result<Option<String>, anyhow::Error> {
    match client
        .get_servers_server_files_contents(server, FILE, false, MAX_READ_BYTES)
        .await
    {
        Ok(mut reader) => {
            let mut buf = Vec::new();
            reader.read_to_end(&mut buf).await?;
            Ok(Some(String::from_utf8_lossy(&buf).into_owned()))
        }
        Err(ApiHttpError::Http(StatusCode::NOT_FOUND, _)) => Ok(None),
        Err(err) => Err(err.into()),
    }
}

pub async fn read_properties(client: &WingsClient, server: Uuid) -> Result<Option<Vec<Property>>, anyhow::Error> {
    let text = match read_text(client, server).await? {
        Some(text) => text,
        None => return Ok(None),
    };

    let mut props = Vec::new();
    for line in text.lines() {
        let trimmed = line.trim_start();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        if let Some((key, value)) = line.split_once('=') {
            props.push(Property {
                key: key.trim().to_string(),
                value: value.to_string(),
            });
        }
    }

    Ok(Some(props))
}

pub async fn save_properties(
    client: &WingsClient,
    server: Uuid,
    user: Uuid,
    values: &HashMap<String, String>,
) -> Result<(), anyhow::Error> {
    let existing = read_text(client, server)
        .await?
        .ok_or_else(|| anyhow!("server.properties was not found. Start the server once so it generates the file."))?;

    let mut out = String::with_capacity(existing.len() + 64);
    for line in existing.lines() {
        let trimmed = line.trim_start();
        if !trimmed.is_empty() && !trimmed.starts_with('#') {
            if let Some((key, _)) = line.split_once('=') {
                if let Some(value) = values.get(key.trim()) {
                    out.push_str(key.trim());
                    out.push('=');
                    out.push_str(value);
                    out.push('\n');
                    continue;
                }
            }
        }
        out.push_str(line);
        out.push('\n');
    }

    client
        .post_servers_server_files_write(server, FILE, user, CompactString::from(out))
        .await?;
    Ok(())
}
