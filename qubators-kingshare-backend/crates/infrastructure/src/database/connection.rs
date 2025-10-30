use kingshare_core::{config::DatabaseConfig, Error, Result};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;
use tracing::{info, instrument};

#[derive(Debug, Clone)]
pub struct Database {
    pool: PgPool,
}

impl Database {
    #[instrument(skip(config))]
    pub async fn new(config: &DatabaseConfig) -> Result<Self> {
        info!("Connecting to database");
        
        let pool = PgPoolOptions::new()
            .max_connections(config.max_connections)
            .min_connections(config.min_connections)
            .acquire_timeout(Duration::from_secs(config.connect_timeout))
            .idle_timeout(Duration::from_secs(config.idle_timeout))
            .connect(&config.url)
            .await
            .map_err(Error::Database)?;

        info!("Database connection established");
        
        Ok(Self { pool })
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    #[instrument(skip(self))]
    pub async fn migrate(&self) -> Result<()> {
        info!("Running database migrations");
        
        sqlx::migrate!("../../migrations")
            .run(&self.pool)
            .await
            .map_err(Error::Database)?;

        info!("Database migrations completed");
        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1")
            .execute(&self.pool)
            .await
            .map_err(Error::Database)?;
        
        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn close(&self) {
        info!("Closing database connection");
        self.pool.close().await;
    }
}