//! HTTP routes.

use axum::{routing::get, Json, Router};
use shared::HealthResponse;

use crate::AppState;

/// Build the `/api` router.
pub fn api_router() -> Router<AppState> {
    Router::new().route("/health", get(health))
}

/// Liveness probe; intentionally does not touch the DB so Tunnel health checks stay cheap.
async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".into(),
        version: env!("CARGO_PKG_VERSION").into(),
    })
}
