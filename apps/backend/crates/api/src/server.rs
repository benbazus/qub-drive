use crate::routes::create_routes;
use axum::Router;
use kingshare_core::{config::Config, Error, Result};
use kingshare_infrastructure::{
    Database, DefaultFileService, InMemoryWebSocketService, JwtAuthService, LocalStorageService,
    PostgresFileRepository, PostgresShareRepository, PostgresUserRepository,
};
use kingshare_application::services::{FileService, ShareService, UserService};
use kingshare_domain::{
    DriveRepository, DriveService, CollaborationRepository, CollaborationService,
    SpreadsheetRepository, SpreadsheetService, FormsRepository, FormsService,
    DocumentRepository,
};
use std::{net::SocketAddr, sync::Arc};
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{info, instrument};

#[derive(Clone)]
pub struct AppState {
    pub database: Database,
    pub config: Config,
    pub user_service: UserService,
    pub file_service: FileService,
    pub share_service: ShareService,
    pub websocket_service: Arc<InMemoryWebSocketService>,
    
    // New Google Drive-like services
    pub drive_repository: Arc<dyn DriveRepository>,
    pub drive_service: Arc<dyn DriveService>,
    pub document_repository: Arc<dyn DocumentRepository>,
    pub collaboration_repository: Arc<dyn CollaborationRepository>,
    pub collaboration_service: Arc<dyn CollaborationService>,
    pub spreadsheet_repository: Arc<dyn SpreadsheetRepository>,
    pub spreadsheet_service: Arc<dyn SpreadsheetService>,
    pub forms_repository: Arc<dyn FormsRepository>,
    pub forms_service: Arc<dyn FormsService>,
}

pub struct Server {
    app: Router,
    addr: SocketAddr,
}

impl Server {
    #[instrument(skip(config))]
    pub async fn new(config: Config) -> Result<Self> {
        info!("Initializing server");

        // Initialize database
        let database = Database::new(&config.database).await?;
        database.migrate().await?;

        // Create repositories
        let user_repo = Arc::new(PostgresUserRepository::new(database.pool().clone()));
        let file_repo = Arc::new(PostgresFileRepository::new(database.pool().clone()));
        let share_repo = Arc::new(PostgresShareRepository::new(database.pool().clone()));

        // Create domain services
        let auth_service = Arc::new(JwtAuthService::new(config.auth.clone()));
        let storage_service = Arc::new(LocalStorageService::new(
            "./uploads",
            100 * 1024 * 1024, // 100MB max file size
        )?);
        let file_domain_service = Arc::new(DefaultFileService::new(100 * 1024 * 1024));
        let websocket_service = Arc::new(InMemoryWebSocketService::new());

        // Create application services
        let user_service = UserService::new(user_repo.clone(), auth_service.clone());
        let file_service = FileService::new(
            file_repo.clone(),
            storage_service,
            file_domain_service,
            Some(websocket_service.clone()),
        );
        let share_service = ShareService::with_storage(
            share_repo,
            file_repo.clone(),
            storage_service.clone(),
            Some(websocket_service.clone()),
        );

        // Create application state
        let state = AppState {
            database,
            config: config.clone(),
            user_service,
            file_service,
            share_service,
            websocket_service,
        };

        // Build the application with routes and middleware
        let app = create_routes(state)
            .layer(
                ServiceBuilder::new()
                    .layer(TraceLayer::new_for_http())
                    .layer(
                        CorsLayer::new()
                            .allow_origin(Any)
                            .allow_methods(Any)
                            .allow_headers(Any),
                    ),
            );

        let addr = SocketAddr::from(([0, 0, 0, 0], config.server.port));

        info!("Server initialized on {}", addr);

        Ok(Self { app, addr })
    }

    #[instrument(skip(self))]
    pub async fn run(self) -> Result<()> {
        info!("Starting server on {}", self.addr);

        let listener = tokio::net::TcpListener::bind(self.addr)
            .await
            .map_err(Error::Io)?;

        axum::serve(listener, self.app)
            .await
            .map_err(Error::Io)?;

        Ok(())
    }
}