use async_trait::async_trait;
use kingshare_core::{Error, Result};
use kingshare_domain::services::{FileAnalysis, FileService, FileValidationResult};
use std::collections::HashMap;
use tracing::{info, instrument, warn};

#[derive(Debug, Clone)]
pub struct DefaultFileService {
    max_file_size: u64,
    allowed_types: Vec<String>,
    blocked_extensions: Vec<String>,
}

impl DefaultFileService {
    pub fn new(max_file_size: u64) -> Self {
        Self {
            max_file_size,
            allowed_types: vec![
                // Images
                "image/jpeg".to_string(),
                "image/png".to_string(),
                "image/gif".to_string(),
                "image/webp".to_string(),
                "image/svg+xml".to_string(),
                // Documents
                "application/pdf".to_string(),
                "application/msword".to_string(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document".to_string(),
                "application/vnd.ms-excel".to_string(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet".to_string(),
                "application/vnd.ms-powerpoint".to_string(),
                "application/vnd.openxmlformats-officedocument.presentationml.presentation".to_string(),
                // Text
                "text/plain".to_string(),
                "text/csv".to_string(),
                "text/html".to_string(),
                "text/css".to_string(),
                "text/javascript".to_string(),
                // Archives
                "application/zip".to_string(),
                "application/x-rar-compressed".to_string(),
                "application/x-7z-compressed".to_string(),
                "application/gzip".to_string(),
                // Media
                "audio/mpeg".to_string(),
                "audio/wav".to_string(),
                "video/mp4".to_string(),
                "video/avi".to_string(),
                "video/quicktime".to_string(),
            ],
            blocked_extensions: vec![
                "exe".to_string(),
                "bat".to_string(),
                "cmd".to_string(),
                "com".to_string(),
                "pif".to_string(),
                "scr".to_string(),
                "vbs".to_string(),
                "js".to_string(),
                "jar".to_string(),
                "msi".to_string(),
                "dll".to_string(),
                "sys".to_string(),
            ],
        }
    }

    fn get_file_extension(filename: &str) -> Option<String> {
        std::path::Path::new(filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.to_lowercase())
    }

    fn detect_content_type_from_bytes(data: &[u8]) -> Option<String> {
        // Simple magic number detection
        if data.len() < 4 {
            return None;
        }

        match &data[0..4] {
            [0xFF, 0xD8, 0xFF, _] => Some("image/jpeg".to_string()),
            [0x89, 0x50, 0x4E, 0x47] => Some("image/png".to_string()),
            [0x47, 0x49, 0x46, 0x38] => Some("image/gif".to_string()),
            [0x25, 0x50, 0x44, 0x46] => Some("application/pdf".to_string()),
            [0x50, 0x4B, 0x03, 0x04] | [0x50, 0x4B, 0x05, 0x06] | [0x50, 0x4B, 0x07, 0x08] => {
                Some("application/zip".to_string())
            }
            _ => None,
        }
    }

    fn is_text_file(data: &[u8]) -> bool {
        // Check if file appears to be text by looking for non-printable characters
        let sample_size = std::cmp::min(data.len(), 1024);
        let sample = &data[0..sample_size];
        
        let non_text_chars = sample.iter()
            .filter(|&&byte| byte < 32 && byte != 9 && byte != 10 && byte != 13)
            .count();
        
        // If less than 5% are non-text characters, consider it text
        (non_text_chars as f64 / sample_size as f64) < 0.05
    }
}

#[async_trait]
impl FileService for DefaultFileService {
    #[instrument(skip(self, data))]
    async fn validate_file(
        &self,
        filename: &str,
        content_type: &str,
        size: u64,
        data: &[u8],
    ) -> Result<FileValidationResult> {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        // Size validation
        if size > self.max_file_size {
            errors.push(format!(
                "File size {} exceeds maximum allowed size {}",
                size, self.max_file_size
            ));
        }

        if size == 0 {
            errors.push("File is empty".to_string());
        }

        // Extension validation
        if let Some(extension) = Self::get_file_extension(filename) {
            if self.blocked_extensions.contains(&extension) {
                errors.push(format!("File extension '{}' is not allowed", extension));
            }
        }

        // Content type validation
        if !self.is_allowed_file_type(content_type).await {
            errors.push(format!("Content type '{}' is not allowed", content_type));
        }

        // Content validation - check if declared content type matches actual content
        if let Some(detected_type) = Self::detect_content_type_from_bytes(data) {
            if detected_type != content_type {
                warnings.push(format!(
                    "Declared content type '{}' doesn't match detected type '{}'",
                    content_type, detected_type
                ));
            }
        }

        // Filename validation
        if filename.is_empty() {
            errors.push("Filename cannot be empty".to_string());
        }

        if filename.len() > 255 {
            errors.push("Filename is too long (maximum 255 characters)".to_string());
        }

        // Check for potentially dangerous filenames
        let dangerous_patterns = ["../", "..\\", "/", "\\", ":", "*", "?", "\"", "<", ">", "|"];
        for pattern in &dangerous_patterns {
            if filename.contains(pattern) {
                errors.push(format!("Filename contains invalid character sequence: {}", pattern));
            }
        }

        let is_valid = errors.is_empty();

        info!(
            filename = %filename,
            content_type = %content_type,
            size = size,
            is_valid = is_valid,
            errors_count = errors.len(),
            warnings_count = warnings.len(),
            "File validation completed"
        );

        Ok(FileValidationResult {
            is_valid,
            errors,
            warnings,
        })
    }

    #[instrument(skip(self, data))]
    async fn analyze_file(&self, filename: &str, data: &[u8]) -> Result<FileAnalysis> {
        let mut metadata = HashMap::new();
        
        // Basic metadata
        metadata.insert("size".to_string(), data.len().to_string());
        metadata.insert("filename".to_string(), filename.to_string());

        // Detect content type
        let detected_type = Self::detect_content_type_from_bytes(data)
            .unwrap_or_else(|| {
                if Self::is_text_file(data) {
                    "text/plain".to_string()
                } else {
                    "application/octet-stream".to_string()
                }
            });

        // Safety analysis
        let is_safe = self.is_file_safe(filename, &detected_type, data).await;

        // Additional metadata based on file type
        if detected_type.starts_with("image/") {
            // For images, we could add dimension detection here
            metadata.insert("category".to_string(), "image".to_string());
        } else if detected_type.starts_with("text/") {
            metadata.insert("category".to_string(), "text".to_string());
            metadata.insert("line_count".to_string(), 
                String::from_utf8_lossy(data).lines().count().to_string());
        } else if detected_type.starts_with("application/") {
            metadata.insert("category".to_string(), "application".to_string());
        }

        info!(
            filename = %filename,
            detected_type = %detected_type,
            is_safe = is_safe,
            "File analysis completed"
        );

        Ok(FileAnalysis {
            is_safe,
            detected_type,
            virus_scan_result: None, // Would integrate with antivirus service
            metadata,
        })
    }

    #[instrument(skip(self, data))]
    async fn generate_thumbnail(
        &self,
        _file_path: &str,
        _max_width: u32,
        _max_height: u32,
    ) -> Result<Option<Vec<u8>>> {
        // Thumbnail generation would be implemented here
        // This would typically use image processing libraries like image-rs
        warn!("Thumbnail generation not implemented");
        Ok(None)
    }

    #[instrument(skip(self, data))]
    async fn extract_metadata(
        &self,
        filename: &str,
        data: &[u8],
    ) -> Result<HashMap<String, String>> {
        let mut metadata = HashMap::new();
        
        metadata.insert("filename".to_string(), filename.to_string());
        metadata.insert("size".to_string(), data.len().to_string());
        
        if let Some(extension) = Self::get_file_extension(filename) {
            metadata.insert("extension".to_string(), extension);
        }

        if let Some(detected_type) = Self::detect_content_type_from_bytes(data) {
            metadata.insert("detected_content_type".to_string(), detected_type);
        }

        // Calculate hash
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(data);
        let hash = format!("{:x}", hasher.finalize());
        metadata.insert("sha256".to_string(), hash);

        Ok(metadata)
    }

    async fn is_allowed_file_type(&self, content_type: &str) -> bool {
        self.allowed_types.contains(&content_type.to_string())
    }

    async fn get_max_file_size(&self) -> u64 {
        self.max_file_size
    }
}

impl DefaultFileService {
    async fn is_file_safe(&self, filename: &str, content_type: &str, data: &[u8]) -> bool {
        // Check file extension
        if let Some(extension) = Self::get_file_extension(filename) {
            if self.blocked_extensions.contains(&extension) {
                return false;
            }
        }

        // Check content type
        if !self.is_allowed_file_type(content_type).await {
            return false;
        }

        // Check for executable signatures
        if data.len() >= 2 {
            match &data[0..2] {
                [0x4D, 0x5A] => return false, // PE executable
                [0x7F, 0x45] => return false, // ELF executable
                _ => {}
            }
        }

        // Additional safety checks could be added here
        // - Virus scanning integration
        // - Content analysis for malicious patterns
        // - File structure validation

        true
    }
}