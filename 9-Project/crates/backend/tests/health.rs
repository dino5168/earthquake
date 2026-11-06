use axum::{body::Body, http::Request};
use backend::{app, AppState};
use http_body_util::BodyExt;
use shared::HealthResponse;
use sqlx::postgres::PgPoolOptions;
use tower::ServiceExt;

#[tokio::test]
async fn health_returns_ok() {
    // Lazy pool never connects; /api/health must not depend on the DB.
    let db = PgPoolOptions::new()
        .connect_lazy("postgres://test:test@localhost/test")
        .expect("lazy pool");
    let router = app(AppState { db }, "http://localhost:3000").expect("router");

    let res = router
        .oneshot(
            Request::get("/api/health")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), 200);

    let bytes = res.into_body().collect().await.expect("body").to_bytes();
    let body: HealthResponse = serde_json::from_slice(&bytes).expect("json");
    assert_eq!(body.status, "ok");
}
