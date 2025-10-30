use async_trait::async_trait;
use kingshare_core::{Error, Id, PaginatedResponse, PaginationInfo, PaginationParams, Result};
use kingshare_domain::{
    entities::{File, FileMetadata, FileOwner},
    repositories::FileRepository,
};
use sqlx::PgPool;
use tracing::{info, instrument};

#[derive(Debug, Clone)]
pub struct PostgresFileRepository {
    pool: PgPool,
}

impl PostgresFileRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl FileRepository for PostgresFileRepository {
    #[instrument(skip(self, file))]
    async fn create(&self, file: File) -> Result<File> {
        sqlx::query!(
            r#"
            INSERT INTO files (id, owner_id, filename, original_filename, content_type, size, 
                             storage_path, checksum, is_public, download_count, created_at, 
                             updated_at, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            "#,
            file.id,
            file.owner_id,
            file.filename,
            file.original_filename,
            file.content_type,
            file.size,
            file.storage_path,
            file.checksum,
            file.is_public,
            file.download_count,
            file.created_at,
            file.updated_at,
            file.expires_at
        )
        .execute(&self.pool)
        .await
        .map_err(Error::Database)?;

        info!(file_id = %file.id, "File created successfully");
        Ok(file)
    }

    #[instrument(skip(self))]
    async fn find_by_id(&self, id: Id) -> Result<Option<File>> {
        let row = sqlx::query!(
            r#"
            SELECT id, owner_id, filename, original_filename, content_type, size,
                   storage_path, checksum, is_public, download_count, created_at,
                   updated_at, expires_at
            FROM files WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(Error::Database)?;

        match row {
            Some(row) => Ok(Some(File {
                id: row.id,
                owner_id: row.owner_id,
                filename: row.filename,
                original_filename: row.original_filename,
                content_type: row.content_type,
                size: row.size,
                storage_path: row.storage_path,
                checksum: row.checksum,
                is_public: row.is_public,
                download_count: row.download_count,
                created_at: row.created_at,
                updated_at: row.updated_at,
                expires_at: row.expires_at,
            })),
            None => Ok(None),
        }
    }

    #[instrument(skip(self))]
    async fn find_by_owner(
        &self,
        owner_id: Id,
        params: PaginationParams,
    ) -> Result<PaginatedResponse<FileMetadata>> {
        let limit = params.limit() as i64;
        let offset = params.offset() as i64;

        let rows = sqlx::query!(
            r#"
            SELECT f.id, f.filename, f.original_filename, f.content_type, f.size,
                   f.is_public, f.download_count, f.created_at, f.expires_at,
                   u.id as owner_id, u.username, u.first_name, u.last_name
            FROM files f
            JOIN users u ON f.owner_id = u.id
            WHERE f.owner_id = $1
            ORDER BY f.created_at DESC
            LIMIT $2 OFFSET $3
            "#,
            owner_id,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map_err(Error::Database)?;

        let total = self.count_by_owner(owner_id).await?;

        let files: Vec<FileMetadata> = rows
            .into_iter()
            .map(|row| FileMetadata {
                id: row.id,
                filename: row.filename,
                original_filename: row.original_filename,
                content_type: row.content_type,
                size: row.size,
                is_public: row.is_public,
                download_count: row.download_count,
                created_at: row.created_at,
                expires_at: row.expires_at,
                owner: FileOwner {
                    id: row.owner_id,
                    username: row.username,
                    full_name: format!("{} {}", row.first_name, row.last_name),
                },
            })
            .collect();

        let pagination = PaginationInfo::new(params.page.unwrap_or(1), params.limit(), total);

        Ok(PaginatedResponse {
            data: files,
            pagination,
        })
    }

    #[instrument(skip(self))]
    async fn find_public_files(
        &self,
        params: PaginationParams,
    ) -> Result<PaginatedResponse<FileMetadata>> {
        let limit = params.limit() as i64;
        let offset = params.offset() as i64;

        let rows = sqlx::query!(
            r#"
            SELECT f.id, f.filename, f.original_filename, f.content_type, f.size,
                   f.is_public, f.download_count, f.created_at, f.expires_at,
                   u.id as owner_id, u.username, u.first_name, u.last_name
            FROM files f
            JOIN users u ON f.owner_id = u.id
            WHERE f.is_public = true AND (f.expires_at IS NULL OR f.expires_at > NOW())
            ORDER BY f.created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map_err(Error::Database)?;

        let total = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM files WHERE is_public = true AND (expires_at IS NULL OR expires_at > NOW())"
        )
        .fetch_one(&self.pool)
        .await
        .map_err(Error::Database)?
        .unwrap_or(0) as u64;

        let files: Vec<FileMetadata> = rows
            .into_iter()
            .map(|row| FileMetadata {
                id: row.id,
                filename: row.filename,
                original_filename: row.original_filename,
                content_type: row.content_type,
                size: row.size,
                is_public: row.is_public,
                download_count: row.download_count,
                created_at: row.created_at,
                expires_at: row.expires_at,
                owner: FileOwner {
                    id: row.owner_id,
                    username: row.username,
                    full_name: format!("{} {}", row.first_name, row.last_name),
                },
            })
            .collect();

        let pagination = PaginationInfo::new(params.page.unwrap_or(1), params.limit(), total);

        Ok(PaginatedResponse {
            data: files,
            pagination,
        })
    }

    #[instrument(skip(self, file))]
    async fn update(&self, file: File) -> Result<File> {
        sqlx::query!(
            r#"
            UPDATE files 
            SET filename = $2, original_filename = $3, content_type = $4, size = $5,
                storage_path = $6, checksum = $7, is_public = $8, download_count = $9,
                updated_at = $10, expires_at = $11
            WHERE id = $1
            "#,
            file.id,
            file.filename,
            file.original_filename,
            file.content_type,
            file.size,
            file.storage_path,
            file.checksum,
            file.is_public,
            file.download_count,
            file.updated_at,
            file.expires_at
        )
        .execute(&self.pool)
        .await
        .map_err(Error::Database)?;

        info!(file_id = %file.id, "File updated successfully");
        Ok(file)
    }

    #[instrument(skip(self))]
    async fn delete(&self, id: Id) -> Result<()> {
        sqlx::query!("DELETE FROM files WHERE id = $1::uuid", id)
            .execute(&self.pool)
            .await
            .map_err(Error::Database)?;

        info!(file_id = %id, "File deleted successfully");
        Ok(())
    }

    #[instrument(skip(self))]
    async fn exists_by_checksum(&self, checksum: &str) -> Result<bool> {
        let count = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM files WHERE checksum = $1",
            checksum
        )
        .fetch_one(&self.pool)
        .await
        .map_err(Error::Database)?;

        Ok(count.unwrap_or(0) > 0)
    }

    #[instrument(skip(self))]
    async fn find_by_checksum(&self, checksum: &str) -> Result<Option<File>> {
        let row = sqlx::query!(
            r#"
            SELECT id, owner_id, filename, original_filename, content_type, size,
                   storage_path, checksum, is_public, download_count, created_at,
                   updated_at, expires_at
            FROM files WHERE checksum = $1
            "#,
            checksum
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(Error::Database)?;

        match row {
            Some(row) => Ok(Some(File {
                id: row.id,
                owner_id: row.owner_id,
                filename: row.filename,
                original_filename: row.original_filename,
                content_type: row.content_type,
                size: row.size,
                storage_path: row.storage_path,
                checksum: row.checksum,
                is_public: row.is_public,
                download_count: row.download_count,
                created_at: row.created_at,
                updated_at: row.updated_at,
                expires_at: row.expires_at,
            })),
            None => Ok(None),
        }
    }

    #[instrument(skip(self))]
    async fn count_by_owner(&self, owner_id: Id) -> Result<u64> {
        let count = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM files WHERE owner_id = $1",
            owner_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(Error::Database)?;

        Ok(count.unwrap_or(0) as u64)
    }

    #[instrument(skip(self))]
    async fn get_total_size_by_owner(&self, owner_id: Id) -> Result<i64> {
        let total_size = sqlx::query_scalar!(
            "SELECT COALESCE(SUM(size), 0) FROM files WHERE owner_id = $1",
            owner_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(Error::Database)?;

        Ok(total_size.unwrap_or(0))
    }

    #[instrument(skip(self))]
    async fn find_expired_files(&self) -> Result<Vec<File>> {
        let rows = sqlx::query!(
            r#"
            SELECT id, owner_id, filename, original_filename, content_type, size,
                   storage_path, checksum, is_public, download_count, created_at,
                   updated_at, expires_at
            FROM files 
            WHERE expires_at IS NOT NULL AND expires_at <= NOW()
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(Error::Database)?;

        let files = rows
            .into_iter()
            .map(|row| File {
                id: row.id,
                owner_id: row.owner_id,
                filename: row.filename,
                original_filename: row.original_filename,
                content_type: row.content_type,
                size: row.size,
                storage_path: row.storage_path,
                checksum: row.checksum,
                is_public: row.is_public,
                download_count: row.download_count,
                created_at: row.created_at,
                updated_at: row.updated_at,
                expires_at: row.expires_at,
            })
            .collect();

        Ok(files)
    }

    #[instrument(skip(self))]
    async fn cleanup_expired_files(&self) -> Result<u64> {
        let result = sqlx::query!(
            "DELETE FROM files WHERE expires_at IS NOT NULL AND expires_at <= NOW()"
        )
        .execute(&self.pool)
        .await
        .map_err(Error::Database)?;

        let deleted_count = result.rows_affected();
        info!(deleted_count = deleted_count, "Expired files cleaned up");
        Ok(deleted_count)
    }
}