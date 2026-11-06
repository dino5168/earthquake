//! 十方地震監測網 backend library: router construction and shared state.

pub mod config;
pub mod routes;

use axum::{
    http::{header, header::InvalidHeaderValue, HeaderValue, Method},
    Router,
};
use sqlx::PgPool;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

/// State shared by all handlers.
#[derive(Clone)]
pub struct AppState {
    /// PostgreSQL connection pool.
    pub db: PgPool,
}

/// Build the full application router.
///
/// # Errors
/// Returns an error if `cors_origin` is not a valid header value.
pub fn app(state: AppState, cors_origin: &str) -> Result<Router, InvalidHeaderValue> {
    // Frontend (Cloudflare Pages) and API (Tunnel) live on different origins, so CORS is required.
    let cors = CorsLayer::new()
        .allow_origin(HeaderValue::from_str(cors_origin)?)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::CONTENT_TYPE]);

    Ok(Router::new()
        .nest("/api", routes::api_router())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state))
}
