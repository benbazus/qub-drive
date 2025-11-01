use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub logging: LoggingConfig,
    pub cors: CorsConfig,
    pub websocket: WebSocketConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout: u64,
    pub idle_timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub jwt_expiration: i64,
    pub refresh_token_expiration: i64,
    pub password_hash_cost: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
    pub allowed_methods: Vec<String>,
    pub allowed_headers: Vec<String>,
    pub max_age: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketConfig {
    pub enabled: bool,
    pub max_connections: usize,
    pub heartbeat_interval: u64,
    pub connection_timeout: u64,
    pub max_message_size: usize,
}

impl Config {
    pub fn load() -> Result<Self> {
        let mut settings = config::Config::builder()
            .add_source(config::File::with_name("config/default").required(false))
            .add_source(config::File::with_name("config/local").required(false))
            .add_source(config::Environment::with_prefix("KINGSHARE").separator("__"));

        // Add environment-specific config
        if let Ok(env) = env::var("RUST_ENV") {
            settings = settings.add_source(
                config::File::with_name(&format!("config/{}", env)).required(false),
            );
        }

        let config = settings.build()?.try_deserialize()?;
        Ok(config)
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".to_string(),
                port: 8080,
                workers: None,
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgresql://localhost/kingshare".to_string()),
                max_connections: 10,
                min_connections: 1,
                connect_timeout: 30,
                idle_timeout: 600,
            },
            auth: AuthConfig {
                jwt_secret: env::var("JWT_SECRET")
                    .unwrap_or_else(|_| "your-secret-key".to_string()),
                jwt_expiration: 3600, // 1 hour
                refresh_token_expiration: 604800, // 1 week
                password_hash_cost: 12,
            },
            logging: LoggingConfig {
                level: "info".to_string(),
                format: "json".to_string(),
            },
            cors: CorsConfig {
                allowed_origins: vec!["*".to_string()],
                allowed_methods: vec![
                    "GET".to_string(),
                    "POST".to_string(),
                    "PUT".to_string(),
                    "DELETE".to_string(),
                    "PATCH".to_string(),
                ],
                allowed_headers: vec![
                    "Content-Type".to_string(),
                    "Authorization".to_string(),
                    "Accept".to_string(),
                ],
                max_age: 3600,
            },
            websocket: WebSocketConfig {
                enabled: true,
                max_connections: 1000,
                heartbeat_interval: 30,
                connection_timeout: 300,
                max_message_size: 1024 * 1024, // 1MB
            },
        }
    }
}