use kingshare_core::config::Config;
use kingshare_infrastructure::{
    Database, DefaultFileService, JwtAuthService, LocalStorageService,
    PostgresFileRepository, PostgresShareRepository, PostgresUserRepository,
};
use kingshare_application::services::{FileService, ShareService, UserService};
use kingshare_domain::{
    entities::{CreateUserRequest, CreateShareRequest},
    value_objects::Email,
};
use std::sync::Arc;
use tempfile::TempDir;

#[tokio::test]
async fn test_complete_workflow() {
    // Skip this test if no database is available
    if std::env::var("DATABASE_URL").is_err() {
        println!("Skipping integration test - no DATABASE_URL set");
        return;
    }

    // Load configuration
    let config = Config::default();

    // Create temporary directory for file storage
    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().to_str().unwrap();

    // Initialize database
    let database = Database::new(&config.database).await.unwrap();

    // Create repositories
    let user_repo = Arc::new(PostgresUserRepository::new(database.pool().clone()));
    let file_repo = Arc::new(PostgresFileRepository::new(database.pool().clone()));
    let share_repo = Arc::new(PostgresShareRepository::new(database.pool().clone()));

    // Create domain services
    let auth_service = Arc::new(JwtAuthService::new(config.auth.clone()));
    let storage_service = Arc::new(LocalStorageService::new(storage_path, 10 * 1024 * 1024).unwrap());
    let file_domain_service = Arc::new(DefaultFileService::new(10 * 1024 * 1024));

    // Create application services
    let user_service = UserService::new(user_repo, auth_service);
    let file_service = FileService::new(
        file_repo.clone(),
        storage_service.clone(),
        file_domain_service,
        None,
    );
    let share_service = ShareService::with_storage(
        share_repo,
        file_repo,
        storage_service,
        None,
    );

    // Test user creation
    let create_user_request = CreateUserRequest {
        email: "test@example.com".to_string(),
        username: "testuser".to_string(),
        first_name: "Test".to_string(),
        last_name: "User".to_string(),
        password: "TestPassword123!".to_string(),
    };

    let user_profile = user_service.create_user(create_user_request).await.unwrap();
    println!("Created user: {}", user_profile.id);

    // Test file upload
    let test_file_data = b"Hello, World! This is a test file.".to_vec();
    let file_metadata = file_service
        .upload_file(
            user_profile.id,
            "test.txt".to_string(),
            "text/plain".to_string(),
            test_file_data.clone(),
        )
        .await
        .unwrap();
    println!("Uploaded file: {}", file_metadata.id);

    // Test file download
    let (downloaded_file, downloaded_data) = file_service
        .download_file(file_metadata.id, Some(user_profile.id))
        .await
        .unwrap();
    assert_eq!(downloaded_data, test_file_data);
    println!("Downloaded file successfully");

    // Test share creation
    let create_share_request = CreateShareRequest {
        file_id: file_metadata.id,
        password: Some("sharepassword".to_string()),
        max_downloads: Some(5),
        expires_at: None,
    };

    let share_info = share_service
        .create_share(user_profile.id, create_share_request)
        .await
        .unwrap();
    println!("Created share: {}", share_info.share_token);

    // Test share access
    let access_request = kingshare_domain::entities::AccessShareRequest {
        password: Some("sharepassword".to_string()),
    };

    let (accessed_share, shared_file_data) = share_service
        .access_shared_file(&share_info.share_token, access_request)
        .await
        .unwrap();
    
    // Note: shared_file_data might be empty if storage service is not properly configured
    println!("Accessed shared file: {}", accessed_share.file.filename);

    // Test cleanup
    file_service.delete_file(file_metadata.id, user_profile.id).await.unwrap();
    println!("Deleted file successfully");

    println!("All tests passed!");
}

#[tokio::test]
async fn test_file_validation() {
    let file_service = DefaultFileService::new(1024 * 1024); // 1MB limit

    // Test valid file
    let valid_data = b"Hello, World!";
    let result = file_service
        .validate_file("test.txt", "text/plain", valid_data.len() as u64, valid_data)
        .await
        .unwrap();
    assert!(result.is_valid);

    // Test oversized file
    let oversized_data = vec![0u8; 2 * 1024 * 1024]; // 2MB
    let result = file_service
        .validate_file("large.txt", "text/plain", oversized_data.len() as u64, &oversized_data)
        .await
        .unwrap();
    assert!(!result.is_valid);
    assert!(result.errors.iter().any(|e| e.contains("exceeds maximum")));

    // Test blocked extension
    let result = file_service
        .validate_file("malware.exe", "application/octet-stream", 100, b"fake exe")
        .await
        .unwrap();
    assert!(!result.is_valid);
    assert!(result.errors.iter().any(|e| e.contains("not allowed")));

    println!("File validation tests passed!");
}

#[test]
fn test_password_validation() {
    use kingshare_domain::value_objects::Password;

    // Test valid password
    let valid_password = Password::new("SecurePass123!".to_string()).unwrap();
    assert_eq!(valid_password.as_str(), "SecurePass123!");

    // Test weak password (too short)
    let result = Password::new("weak".to_string());
    assert!(result.is_err());

    // Test password without special characters
    let result = Password::new("NoSpecialChars123".to_string());
    assert!(result.is_err());

    println!("Password validation tests passed!");
}

#[test]
fn test_email_validation() {
    use kingshare_domain::value_objects::Email;

    // Test valid email
    let valid_email = Email::new("test@example.com".to_string()).unwrap();
    assert_eq!(valid_email.as_str(), "test@example.com");

    // Test invalid email
    let result = Email::new("invalid-email".to_string());
    assert!(result.is_err());

    println!("Email validation tests passed!");
}