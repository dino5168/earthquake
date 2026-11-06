//! DTOs shared between backend and frontend so both sides serialize the same shapes.

use serde::{Deserialize, Serialize};

/// Response body of `GET /api/health`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HealthResponse {
    /// Service status, `"ok"` when healthy.
    pub status: String,
    /// Backend crate version.
    pub version: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn health_response_roundtrip() {
        let original = HealthResponse {
            status: "ok".into(),
            version: "0.1.0".into(),
        };
        let json = serde_json::to_string(&original).expect("serialize");
        let parsed: HealthResponse = serde_json::from_str(&json).expect("deserialize");
        assert_eq!(parsed, original);
    }
}
