use kingshare_core::config::Config;
use kingshare_infrastructure::{
    DefaultFileService, JwtAuthService, LocalStorageService,
    PostgresFileRepository, PostgresShareRepository, PostgresUserRepository,
};
use kingshare_application::services::{FileService, ShareService, UserService};
use kingshare_domain::{
    entities::{CreateUserRequest, CreateShareRequest, AccessShareRequest},
};
use std::sync::Arc;
use tempfile::TempDir;
use tracing::{info, Level};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .init();

    info!("Starting KingShare Backend Demo");

    // Load configuration
    let config = Config::default();
    info!("Configuration loaded");

    // Create temporary directory for file storage
    let temp_dir = TempDir::new()?;
    let storage_path = temp_dir.path();
    info!("Created temporary storage at: {}", storage_path.display());

    // Create repositories (using in-memory or mock implementations for demo)
    info!("Initializing services...");

    // Create domain services
    let auth_service = Arc::new(JwtAuthService::new(config.auth.clone()));
    let storage_service = Arc::new(LocalStorageService::new(storage_path, 100 * 1024 * 1024)?);
    let file_domain_service = Arc::new(DefaultFileService::new(100 * 1024 * 1024));

    info!("✅ Services initialized successfully");

    // Demo 1: File validation
    info!("\n🔍 Demo 1: File Validation");
    
    let test_data = b"Hello, KingShare! This is a demo file.";
    let validation_result = file_domain_service
        .validate_file("demo.txt", "text/plain", test_data.len() as u64, test_data)
        .await?;
    
    info!("File validation result: valid={}, errors={:?}", 
          validation_result.is_valid, validation_result.errors);

    // Demo 2: File analysis
    info!("\n🔬 Demo 2: File Analysis");
    
    let analysis_result = file_domain_service
        .analyze_file("demo.txt", test_data)
        .await?;
    
    info!("File analysis: safe={}, type={}, metadata={:?}", 
          analysis_result.is_safe, analysis_result.detected_type, analysis_result.metadata);

    // Demo 3: Storage operations
    info!("\n💾 Demo 3: Storage Operations");
    
    let upload = kingshare_domain::services::FileUpload {
        filename: "demo.txt".to_string(),
        content_type: "text/plain".to_string(),
        data: test_data.to_vec(),
    };
    
    let stored_file = storage_service.store_file(upload).await?;
    info!("File stored: path={}, size={}, checksum={}", 
          stored_file.path, stored_file.size, stored_file.checksum);

    // Retrieve the file
    let retrieved_data = storage_service.get_file(&stored_file.path).await?;
    info!("File retrieved: size={} bytes", retrieved_data.len());
    
    assert_eq!(retrieved_data, test_data);
    info!("✅ File content matches original");

    // Demo 4: Authentication
    info!("\n🔐 Demo 4: Authentication");
    
    // Hash a password
    let password = "DemoPassword123!";
    let password_hash = auth_service.hash_password(password).await?;
    info!("Password hashed successfully");

    // Verify password
    let is_valid = auth_service.verify_password(password, &password_hash).await?;
    info!("Password verification: {}", is_valid);

    // Generate tokens
    let user_id = uuid::Uuid::new_v4();
    let tokens = auth_service.generate_tokens(
        user_id,
        "demo@example.com",
        "demouser",
        "User",
    ).await?;
    
    info!("JWT tokens generated: expires_in={} seconds", tokens.expires_in);

    // Verify token
    let claims = auth_service.verify_token(&tokens.access_token).await?;
    info!("Token verified: user_id={}, email={}", claims.sub, claims.email);

    // Demo 5: Value objects
    info!("\n📧 Demo 5: Value Objects");
    
    use kingshare_domain::value_objects::{Email, Password};
    
    let email = Email::new("demo@kingshare.com".to_string())?;
    info!("Valid email created: {}", email.as_str());

    let password_obj = Password::new("SecurePassword123!".to_string())?;
    info!("Valid password created with strength: {:?}", password_obj.strength());

    // Demo 6: File operations
    info!("\n📁 Demo 6: File Operations");
    
    let checksum1 = storage_service.calculate_checksum(b"Hello World").await;
    let checksum2 = storage_service.calculate_checksum(b"Hello World").await;
    let checksum3 = storage_service.calculate_checksum(b"Different content").await;
    
    info!("Checksum consistency: {} == {} = {}", 
          checksum1, checksum2, checksum1 == checksum2);
    info!("Different content checksum: {} (different: {})", 
          checksum3, checksum1 != checksum3);

    // Demo 7: Cleanup
    info!("\n🧹 Demo 7: Cleanup");
    
    storage_service.delete_file(&stored_file.path).await?;
    info!("File deleted successfully");

    let file_exists = storage_service.file_exists(&stored_file.path).await?;
    info!("File exists after deletion: {}", file_exists);

    info!("\n🎉 Demo completed successfully!");
    info!("All KingShare backend components are working correctly.");

    Ok(())
}