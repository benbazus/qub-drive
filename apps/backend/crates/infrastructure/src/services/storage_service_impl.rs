use async_trait::async_trait;
use kingshare_core::{Error, Result};
use kingshare_domain::services::{FileUpload, StorageService, StoredFile};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use tokio::fs;
use tracing::{info, instrument, warn};

#[derive(Debug, Clone)]
pub struct LocalStorageService {
    storage_path: PathBuf,
    max_file_size: u64,
}

impl LocalStorageService {
    pub fn new(storage_path: impl AsRef<Path>, max_file_size: u64) -> Result<Self> {
        let storage_path = storage_path.as_ref().to_path_buf();
        
        // Create storage directory if it doesn't exist
        std::fs::create_dir_all(&storage_path)
            .map_err(|e| Error::Internal(format!("Failed to create storage directory: {}", e)))?;

        Ok(Self {
            storage_path,
            max_file_size,
        })
    }

    fn generate_file_path(&self, checksum: &str, extension: &str) -> PathBuf {
        // Create a directory structure based on checksum for better distribution
        let prefix = &checksum[..2];
        let subdir = &checksum[2..4];
        
        self.storage_path
            .join(prefix)
            .join(subdir)
            .join(format!("{}{}", checksum, extension))
    }

    fn extract_extension(filename: &str) -> String {
        Path::new(filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| format!(".{}", ext))
            .unwrap_or_default()
    }
}

#[async_trait]
impl StorageService for LocalStorageService {
    #[instrument(skip(self, upload))]
    async fn store_file(&self, upload: FileUpload) -> Result<StoredFile> {
        // Validate file size
        if upload.data.len() as u64 > self.max_file_size {
            return Err(Error::BadRequest(format!(
                "File size {} exceeds maximum allowed size {}",
                upload.data.len(),
                self.max_file_size
            )));
        }

        // Calculate checksum
        let checksum = self.calculate_checksum(&upload.data).await;
        
        // Generate file path
        let extension = Self::extract_extension(&upload.filename);
        let file_path = self.generate_file_path(&checksum, &extension);
        
        // Create directory structure
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await.map_err(|e| {
                Error::Internal(format!("Failed to create directory structure: {}", e))
            })?;
        }

        // Check if file already exists (deduplication)
        if file_path.exists() {
            info!(
                checksum = %checksum,
                path = %file_path.display(),
                "File already exists, using existing file"
            );
        } else {
            // Write file to storage
            fs::write(&file_path, &upload.data).await.map_err(|e| {
                Error::Internal(format!("Failed to write file to storage: {}", e))
            })?;

            info!(
                checksum = %checksum,
                path = %file_path.display(),
                size = upload.data.len(),
                "File stored successfully"
            );
        }

        Ok(StoredFile {
            path: file_path.to_string_lossy().to_string(),
            size: upload.data.len() as u64,
            checksum,
        })
    }

    #[instrument(skip(self))]
    async fn get_file(&self, path: &str) -> Result<Vec<u8>> {
        let file_path = Path::new(path);
        
        // Security check: ensure path is within storage directory
        let canonical_storage = self.storage_path.canonicalize().map_err(|e| {
            Error::Internal(format!("Failed to canonicalize storage path: {}", e))
        })?;
        
        let canonical_file = file_path.canonicalize().map_err(|_| {
            Error::NotFound("File not found".to_string())
        })?;

        if !canonical_file.starts_with(&canonical_storage) {
            return Err(Error::BadRequest("Invalid file path".to_string()));
        }

        // Read file
        fs::read(&file_path).await.map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => Error::NotFound("File not found".to_string()),
            _ => Error::Internal(format!("Failed to read file: {}", e)),
        })
    }

    #[instrument(skip(self))]
    async fn delete_file(&self, path: &str) -> Result<()> {
        let file_path = Path::new(path);
        
        // Security check: ensure path is within storage directory
        let canonical_storage = self.storage_path.canonicalize().map_err(|e| {
            Error::Internal(format!("Failed to canonicalize storage path: {}", e))
        })?;
        
        if let Ok(canonical_file) = file_path.canonicalize() {
            if !canonical_file.starts_with(&canonical_storage) {
                return Err(Error::BadRequest("Invalid file path".to_string()));
            }
        }

        // Delete file
        fs::remove_file(file_path).await.map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => {
                warn!(path = %path, "File not found during deletion");
                Error::NotFound("File not found".to_string())
            }
            _ => Error::Internal(format!("Failed to delete file: {}", e)),
        })?;

        info!(path = %path, "File deleted successfully");

        // Try to remove empty parent directories
        if let Some(parent) = file_path.parent() {
            let _ = fs::remove_dir(parent).await; // Ignore errors for non-empty directories
        }

        Ok(())
    }

    #[instrument(skip(self))]
    async fn file_exists(&self, path: &str) -> Result<bool> {
        let file_path = Path::new(path);
        Ok(file_path.exists())
    }

    #[instrument(skip(self))]
    async fn get_file_size(&self, path: &str) -> Result<u64> {
        let file_path = Path::new(path);
        
        let metadata = fs::metadata(file_path).await.map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => Error::NotFound("File not found".to_string()),
            _ => Error::Internal(format!("Failed to get file metadata: {}", e)),
        })?;

        Ok(metadata.len())
    }

    #[instrument(skip(self, data))]
    async fn calculate_checksum(&self, data: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data);
        format!("{:x}", hasher.finalize())
    }

    #[instrument(skip(self))]
    async fn cleanup_orphaned_files(&self, valid_paths: Vec<String>) -> Result<u64> {
        let valid_paths: std::collections::HashSet<String> = valid_paths.into_iter().collect();
        let mut removed_count = 0;

        // Walk through storage directory
        let mut stack = vec![self.storage_path.clone()];
        
        while let Some(current_dir) = stack.pop() {
            let mut entries = fs::read_dir(&current_dir).await.map_err(|e| {
                Error::Internal(format!("Failed to read directory: {}", e))
            })?;

            while let Some(entry) = entries.next_entry().await.map_err(|e| {
                Error::Internal(format!("Failed to read directory entry: {}", e))
            })? {
                let path = entry.path();
                
                if path.is_dir() {
                    stack.push(path);
                } else if path.is_file() {
                    let path_str = path.to_string_lossy().to_string();
                    
                    if !valid_paths.contains(&path_str) {
                        match fs::remove_file(&path).await {
                            Ok(_) => {
                                removed_count += 1;
                                info!(path = %path_str, "Orphaned file removed");
                            }
                            Err(e) => {
                                warn!(path = %path_str, error = %e, "Failed to remove orphaned file");
                            }
                        }
                    }
                }
            }
        }

        info!(removed_count = removed_count, "Orphaned files cleanup completed");
        Ok(removed_count)
    }
}