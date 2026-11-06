//! Runtime configuration loaded from environment variables.

use std::net::SocketAddr;

/// Errors raised while loading [`Config`].
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    /// A required variable is unset.
    #[error("missing environment variable `{0}`")]
    Missing(&'static str),
    /// A variable is set but cannot be parsed.
    #[error("invalid value for `{name}`: {reason}")]
    Invalid { name: &'static str, reason: String },
}

/// Backend configuration.
#[derive(Debug, Clone)]
pub struct Config {
    /// PostgreSQL connection string (never logged).
    pub database_url: String,
    /// Address the HTTP server binds to.
    pub bind_addr: SocketAddr,
    /// Frontend origin allowed by CORS (Cloudflare Pages URL).
    pub cors_origin: String,
}

impl Config {
    /// Load configuration from the process environment.
    ///
    /// # Errors
    /// Returns [`ConfigError`] when a required variable is missing or malformed.
    pub fn from_env() -> Result<Self, ConfigError> {
        Self::from_lookup(|key| std::env::var(key).ok())
    }

    /// Load configuration via an arbitrary lookup, so tests need not mutate global env.
    ///
    /// # Errors
    /// Returns [`ConfigError`] when a required variable is missing or malformed.
    pub fn from_lookup(get: impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let database_url = get("DATABASE_URL").ok_or(ConfigError::Missing("DATABASE_URL"))?;
        let bind_addr = get("BIND_ADDR")
            .unwrap_or_else(|| "127.0.0.1:8080".into())
            .parse()
            .map_err(|e: std::net::AddrParseError| ConfigError::Invalid {
                name: "BIND_ADDR",
                reason: e.to_string(),
            })?;
        let cors_origin = get("CORS_ORIGIN").ok_or(ConfigError::Missing("CORS_ORIGIN"))?;
        Ok(Self {
            database_url,
            bind_addr,
            cors_origin,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn lookup(pairs: &[(&str, &str)]) -> impl Fn(&str) -> Option<String> {
        let map: HashMap<String, String> = pairs
            .iter()
            .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
            .collect();
        move |k| map.get(k).cloned()
    }

    #[test]
    fn loads_with_default_bind_addr() {
        let cfg = Config::from_lookup(lookup(&[
            ("DATABASE_URL", "postgres://u:p@localhost/db"),
            ("CORS_ORIGIN", "http://localhost:3000"),
        ]))
        .expect("valid config");
        assert_eq!(cfg.bind_addr.to_string(), "127.0.0.1:8080");
    }

    #[test]
    fn missing_database_url_fails() {
        let err = Config::from_lookup(lookup(&[("CORS_ORIGIN", "x")])).unwrap_err();
        assert!(matches!(err, ConfigError::Missing("DATABASE_URL")));
    }

    #[test]
    fn invalid_bind_addr_fails() {
        let err = Config::from_lookup(lookup(&[
            ("DATABASE_URL", "postgres://localhost/db"),
            ("CORS_ORIGIN", "x"),
            ("BIND_ADDR", "not-an-addr"),
        ]))
        .unwrap_err();
        assert!(matches!(
            err,
            ConfigError::Invalid {
                name: "BIND_ADDR",
                ..
            }
        ));
    }
}
