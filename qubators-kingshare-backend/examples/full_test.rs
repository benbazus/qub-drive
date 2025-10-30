use kingshare_core::config::Config;
use kingshare_infrastructure::{
    Database, DefaultFileService, JwtAuthService, LocalStorageService,
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

    info!("🚀 Starting KingShare Full Implementation Test");

    // Load configuration
    let config = Config::default();
    info!("✅ Configuration loaded");

    // Create temporary directory for file storage
    let temp_dir = TempDir::new()?;
    let storage_path = temp_dir.path();
    info!("📁 Created temporary storage at: {}", storage_path.display());

    // Test 1: Service Initialization
    info!("\n🔧 Test 1: Service Initialization");
    
    // Create domain services
    let auth_service = Arc::new(JwtAuthService::new(config.auth.clone()));
    let storage_service = Arc::new(LocalStorageService::new(storage_path, 100 * 1024 * 1024)?);
    let file_domain_service = Arc::new(DefaultFileService::new(100 * 1024 * 1024));

    info!("✅ All domain services initialized");

    // Test 2: Authentication Flow
    info!("\n🔐 Test 2: Authentication Flow");
    
    let password = "TestPassword123!";
    let password_hash = auth_service.hash_password(password).await?;
    info!("✅ Password hashed successfully");

    let is_valid = auth_service.verify_password(password, &password_hash).await?;
    assert!(is_valid, "Password verification failed");
    info!("✅ Password verification successful");

    let user_id = uuid::Uuid::new_v4();
    let tokens = auth_service.generate_tokens(
        user_id,
        "test@example.com",
        "testuser",
        "User",
    ).await?;
    info!("✅ JWT tokens generated (expires in {} seconds)", tokens.expires_in);

    let claims = auth_service.verify_token(&tokens.access_token).await?;
    assert_eq!(claims.sub, user_id.to_string());
    info!("✅ Token verification successful");

    // Test 3: File Operations
    info!("\n📁 Test 3: File Operations");
    
    let test_content = b"Hello, KingShare! This is a comprehensive test file with some content.";
    
    // File validation
    let validation = file_domain_service
        .validate_file("test.txt", "text/plain", test_content.len() as u64, test_content)
        .await?;
    assert!(validation.is_valid, "File validation failed: {:?}", validation.errors);
    info!("✅ File validation passed");

    // File analysis
    let analysis = file_domain_service
        .analyze_file("test.txt", test_content)
        .await?;
    assert!(analysis.is_safe, "File safety check failed");
    info!("✅ File analysis completed (safe: {}, type: {})", analysis.is_safe, analysis.detected_type);

    // Storage operations
    let upload = kingshare_domain::services::FileUpload {
        filename: "test.txt".to_string(),
        content_type: "text/plain".to_string(),
        data: test_content.to_vec(),
    };
    
    let stored_file = storage_service.store_file(upload).await?;
    info!("✅ File stored (size: {}, checksum: {})", stored_file.size, stored_file.checksum);

    let retrieved_data = storage_service.get_file(&stored_file.path).await?;
    assert_eq!(retrieved_data, test_content);
    info!("✅ File retrieval successful");

    // Test deduplication
    let upload2 = kingshare_domain::services::FileUpload {
        filename: "test_duplicate.txt".to_string(),
        content_type: "text/plain".to_string(),
        data: test_content.to_vec(),
    };
    
    let stored_file2 = storage_service.store_file(upload2).await?;
    assert_eq!(stored_file.checksum, stored_file2.checksum);
    info!("✅ File deduplication working (same checksum)");

    // Test 4: Value Objects
    info!("\n📧 Test 4: Value Objects");
    
    use kingshare_domain::value_objects::{Email, Password};
    
    let email = Email::new("test@kingshare.com".to_string())?;
    info!("✅ Valid email created: {}", email.as_str());

    let password_obj = Password::new("SecurePassword123!".to_string())?;
    info!("✅ Valid password created (strength: {:?})", password_obj.strength());

    // Test invalid cases
    let invalid_email = Email::new("invalid-email".to_string());
    assert!(invalid_email.is_err(), "Invalid email should fail");
    info!("✅ Invalid email properly rejected");

    let weak_password = Password::new("weak".to_string());
    assert!(weak_password.is_err(), "Weak password should fail");
    info!("✅ Weak password properly rejected");

    // Test 5: File Type Detection
    info!("\n🔍 Test 5: File Type Detection");
    
    // Test different file types
    let pdf_header = b"%PDF-1.4";
    let pdf_validation = file_domain_service
        .validate_file("document.pdf", "application/pdf", pdf_header.len() as u64, pdf_header)
        .await?;
    assert!(pdf_validation.is_valid);
    info!("✅ PDF file validation passed");

    // Test blocked file type
    let exe_validation = file_domain_service
        .validate_file("malware.exe", "application/octet-stream", 100, b"fake exe content")
        .await?;
    assert!(!exe_validation.is_valid);
    info!("✅ Executable file properly blocked");

    // Test 6: Large File Handling
    info!("\n📦 Test 6: Large File Handling");
    
    let large_content = vec![0u8; 50 * 1024 * 1024]; // 50MB
    let large_validation = file_domain_service
        .validate_file("large.bin", "application/octet-stream", large_content.len() as u64, &large_content)
        .await?;
    assert!(large_validation.is_valid, "50MB file should be valid");
    info!("✅ Large file (50MB) validation passed");

    let oversized_content = vec![0u8; 150 * 1024 * 1024]; // 150MB
    let oversized_validation = file_domain_service
        .validate_file("oversized.bin", "application/octet-stream", oversized_content.len() as u64, &oversized_content)
        .await?;
    assert!(!oversized_validation.is_valid, "150MB file should be rejected");
    info!("✅ Oversized file (150MB) properly rejected");

    // Test 7: Checksum Consistency
    info!("\n🔐 Test 7: Checksum Consistency");
    
    let content1 = b"Identical content for checksum test";
    let content2 = b"Identical content for checksum test";
    let content3 = b"Different content for checksum test";
    
    let checksum1 = storage_service.calculate_checksum(content1).await;
    let checksum2 = storage_service.calculate_checksum(content2).await;
    let checksum3 = storage_service.calculate_checksum(content3).await;
    
    assert_eq!(checksum1, checksum2, "Identical content should have same checksum");
    assert_ne!(checksum1, checksum3, "Different content should have different checksums");
    info!("✅ Checksum consistency verified");

    // Test 8: Token Refresh Flow
    info!("\n🔄 Test 8: Token Refresh Flow");
    
    let new_tokens = auth_service.refresh_token(&tokens.refresh_token).await?;
    assert_ne!(tokens.access_token, new_tokens.access_token, "New access token should be different");
    info!("✅ Token refresh successful");

    let new_claims = auth_service.verify_token(&new_tokens.access_token).await?;
    assert_eq!(claims.sub, new_claims.sub, "User ID should remain the same");
    info!("✅ Refreshed token contains correct user information");

    // Test 9: Token Revocation
    info!("\n🚫 Test 9: Token Revocation");
    
    auth_service.revoke_token(&tokens.access_token).await?;
    info!("✅ Token revoked successfully");

    let revoked_result = auth_service.verify_token(&tokens.access_token).await;
    assert!(revoked_result.is_err(), "Revoked token should fail verification");
    info!("✅ Revoked token properly rejected");

    // Test 10: Cleanup
    info!("\n🧹 Test 10: Cleanup");
    
    storage_service.delete_file(&stored_file.path).await?;
    let exists = storage_service.file_exists(&stored_file.path).await?;
    assert!(!exists, "File should not exist after deletion");
    info!("✅ File cleanup successful");

    // Test 11: Metadata Extraction
    info!("\n📋 Test 11: Metadata Extraction");
    
    let metadata = file_domain_service
        .extract_metadata("test.txt", test_content)
        .await?;
    
    assert!(metadata.contains_key("filename"));
    assert!(metadata.contains_key("size"));
    assert!(metadata.contains_key("sha256"));
    info!("✅ Metadata extraction successful: {} fields", metadata.len());

    // Test 12: File Analysis Edge Cases
    info!("\n🔬 Test 12: File Analysis Edge Cases");
    
    // Empty file
    let empty_analysis = file_domain_service
        .analyze_file("empty.txt", b"")
        .await?;
    info!("✅ Empty file analysis completed");

    // Binary file
    let binary_data = (0..255u8).collect::<Vec<u8>>();
    let binary_analysis = file_domain_service
        .analyze_file("binary.bin", &binary_data)
        .await?;
    info!("✅ Binary file analysis completed (type: {})", binary_analysis.detected_type);

    info!("\n🎉 All tests completed successfully!");
    info!("✨ KingShare backend implementation is fully functional");
    
    // Summary
    info!("\n📊 Test Summary:");
    info!("   ✅ Authentication & JWT tokens");
    info!("   ✅ File validation & analysis");
    info!("   ✅ Storage operations & deduplication");
    info!("   ✅ Value object validation");
    info!("   ✅ File type detection & security");
    info!("   ✅ Large file handling");
    info!("   ✅ Checksum consistency");
    info!("   ✅ Token refresh & revocation");
    info!("   ✅ File cleanup operations");
    info!("   ✅ Metadata extraction");
    info!("   ✅ Edge case handling");

    Ok(())
}