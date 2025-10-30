use anyhow::Result;
use kingshare_api::server::Server;
use kingshare_core::config::Config;
use tracing::{info, instrument};

#[tokio::main]
#[instrument]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Load configuration
    let config = Config::load()?;
    info!("Configuration loaded successfully");

    // Start the server
    let server = Server::new(config).await?;
    info!("Starting KingShare backend server");
    
    server.run().await?;

    Ok(())
}