use async_trait::async_trait;
use kingshare_core::{Error, Id, PaginatedResponse, PaginationInfo, PaginationParams, Result};
use kingshare_domain::{
    entities::{Share, ShareFileInfo, ShareInfo},
    repositories::ShareRepository,
};
use sqlx::PgPool;
use tracing::{info, instrument};

#[derive(Debug, Clone)]
pub struct PostgresShareRepository {
    pool: PgPool,
}

impl PostgresShareRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ShareRepository for PostgresShareRepository {
    #[instrument(skip(self, share))]
    async fn create(&self, share: Share) -> Result<Share> {
        sqlx::query!(
            r#"
            INSERT INTO shares (id, file_id, owner_id, share_token, password, max_downloads,
                              download_count, is_active, created_at, updated_at, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
            share.id,
            share.file_id,
            share.owner_id,
            share.share_token,
            share.password,
            share.max_downloads,
            share.download_count,
            share.is_active,
            share.created_at,
            share.updated_at,
            share.expires_at
        )
        .execute(&self.pool)
        .await
        .map_err(Error::Database)?;

        info!(share_id = %share.id, "Share created successfully");
        Ok(share)
    }

    #[instrument(skip(self))]
    async fn find_by_id(&self, id: Id) -> Result<Option<Share>> {
        let row = sqlx::query!(
            r#"
            SELECT id, file_id, owner_id, share_token, password, max_downloads,
                   download_count, is_active, created_at, updated_at, expires_at
            FROM shares WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(Error::Database)?;

        match row {
            Some(row) => Ok(Some(Share {
                id: row.id,
                file_id: row.file_id,
                owner_id: row.owner_id,
                share_token: row.share_token,
                password: row.password,
                max_downloads: row.max_downloads,
                download_count: row.download_count,
                is_active: row.is_active,
                created_at: row.created_at,
                updated_at: row.updated_at,
                expires_at: row.expires_at,
            })),
            None => Ok(None),
        }
    }

    #[instrument(skip(self))]
    async fn find_by_token(&self, token: &str) -> Result<Option<ShareInfo>> {
        let row = sqlx::query!(
            r#"
            SELECT s.id, s.share_token, s.password, s.max_downloads, s.download_count,
                   s.is_active, s.created_at, s.expires_at,
                   f.id as file_id, f.filename, f.content_type, f.size
            FROM shares s
            JOIN files f ON s.file_id = f.id
            WHERE s.share_token = $1
            "#,
            token
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(Error::Database)?;

        match row {
            Some(row) => {
                let file = kingshare_domain::entities::File {
                    id: row.file_id,
                    owner_id: uuid::Uuid::new_v4(), // Placeholder
                    filename: row.filename.clone(),
                    original_filename: row.filename.clone(),
                    content_type: row.content_type.clone(),
                    size: row.size,
                    storage_path: String::new(),
                    checksum: String::new(),
                    is_public: false,
                    download_count: 0,
                    created_at: chrono::Utc::now(),
                    updated_at: chrono::Utc::now(),
                    expires_at: None,
                };

                Ok(Some(ShareInfo {
                    id: row.id,
                    share_token: row.share_token,
                    has_password: row.password.is_some(),
                    max_downloads: row.max_downloads,
                    download_count: row.download_count,
                    is_active: row.is_active,
                    created_at: row.created_at,
                    expires_at: row.expires_at,
                    file: ShareFileInfo {
                        id: row.file_id,
                        filename: row.filename,
                        content_type: row.content_type,
                        size: row.size,
                        human_readable_size: file.human_readable_size(),
                    },
                }))
            }
            None => Ok(None),
        }
    }

    #[instrument(skip(self))]
    async fn find_by_file(&self, file_id: Id) -> Result<Vec<Share>> {
        let rows = sqlx::query!(
            r#"
            SELECT id, file_id, owner_id, share_token, password, max_downloads,
                   download_count, is_active, created_at, updated_at, expires_at
            FROM shares WHERE file_id = $1
            ORDER BY created_at DESC
            "#,
            file_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(Error::Database)?;

        let shares = rows
            .into_iter()
            .map(|row| Share {
                id: row.id,
                file_id: row.file_id,
                owner_id: row.owner_id,
                share_token: row.share_token,
                password: row.password,
                max_downloads: row.max_downloads,
                download_count: row.download_count,
                is_active: row.is_active,
                created_at: row.created_at,
                updated_at: row.updated_at,
                expires_at: row.expires_at,
            })
            .collect();

        Ok(shares)
    }

    #[instrument(skip(self))]
    async fn find_by_owner(
        &self,
        owner_id: Id,
        params: PaginationParams,
    ) -> Result<PaginatedResponse<ShareInfo>> {
        let limit = params.limit() as i64;
        let offset = params.offset() as i64;

        let rows = sqlx::query!(
            r#"
            SELECT s.id, s.share_token, s.password, s.max_downloads, s.download_count,
                   s.is_active, s.created_at, s.expires_at,
                   f.id as file_id, f.filename, f.content_type, f.size
            FROM shares s
            JOIN files f ON s.file_id = f.id
            WHERE s.owner_id = $1
            ORDER BY s.created_at DESC
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

        let shares: Vec<ShareInfo> = rows
            .into_iter()
            .map(|row| {
                let file = kingshare_domain::entities::File {
                    id: row.file_id,
                    owner_id: uuid::Uuid::new_v4(),
                    filename: row.filename.clone(),
                    original_filename: row.filename.clone(),
                    content_type: row.content_type.clone(),
                    size: row.size,
                    storage_path: String::new(),
                    checksum: String::new(),
                    is_public: false,
                    download_count: 0,
                    created_at: chrono::Utc::now(),
                    updated_at: chrono::Utc::now(),
                    expires_at: None,
                };

                ShareInfo {
                    id: row.id,
                    share_token: row.share_token,
                    has_password: row.password.is_some(),
                    max_downloads: row.max_downloads,
                    download_count: row.download_count,
                    is_active: row.is_active,
                    created_at: row.created_at,
                    expires_at: row.expires_at,
                    file: ShareFileInfo {
                        id: row.file_id,
                        filename: row.filename,
                        content_type: row.content_type,
                        size: row.size,
                        human_readable_size: file.human_readable_size(),
                    },
                }
            })
            .collect();

        let pagination = PaginationInfo::new(params.page.unwrap_or(1), params.limit(), total);

        Ok(PaginatedResponse {
            data: shares,
            pagination,
        })
    }

    #[instrument(skip(self, share))]
    async fn update(&self, share: Share) -> Result<Share> {
        sqlx::query!(
            r#"
            UPDATE shares 
            SET password = $2, max_downloads = $3, download_count = $4, is_active = $5,
                updated_at = $6, expires_at = $7
            WHERE id = $1
            "#,
            share.id,
            share.password,
            share.max_downloads,
            share.download_count,
            share.is_active,
            share.updated_at,
            share.expires_at
        )
        .execute(&self.pool)
        .await
        .map_err(Error::Database)?;

        info!(share_id = %share.id, "Share updated successfully");
        Ok(share)
    }

    #[instrument(skip(self))]
    async fn delete(&self, id: Id) -> Result<()> {
        sqlx::query!("DELETE FROM shares WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(Error::Database)?;

        info!(share_id = %id, "Share deleted successfully");
        Ok(())
    }

    #[instrument(skip(self))]
    async fn delete_by_file(&self, file_id: Id) -> Result<u64> {
        let result = sqlx::query!("DELETE FROM shares WHERE file_id = $1", file_id)
            .execute(&self.pool)
            .await
            .map_err(Error::Database)?;

        let deleted_count = result.rows_affected();
        info!(
            file_id = %file_id,
            deleted_count = deleted_count,
            "Shares deleted by file"
        );
        Ok(deleted_count)
    }

    #[instrument(skip(self))]
    async fn find_expired_shares(&self) -> Result<Vec<Share>> {
        let rows = sqlx::query!(
            r#"
            SELECT id, file_id, owner_id, share_token, password, max_downloads,
                   download_count, is_active, created_at, updated_at, expires_at
            FROM shares 
            WHERE expires_at IS NOT NULL AND expires_at <= NOW()
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(Error::Database)?;

        let shares = rows
            .into_iter()
            .map(|row| Share {
                id: row.id,
                file_id: row.file_id,
                owner_id: row.owner_id,
                share_token: row.share_token,
                password: row.password,
                max_downloads: row.max_downloads,
                download_count: row.download_count,
                is_active: row.is_active,
                created_at: row.created_at,
                updated_at: row.updated_at,
                expires_at: row.expires_at,
            })
            .collect();

        Ok(shares)
    }

    #[instrument(skip(self))]
    async fn cleanup_expired_shares(&self) -> Result<u64> {
        let result = sqlx::query!(
            "DELETE FROM shares WHERE expires_at IS NOT NULL AND expires_at <= NOW()"
        )
        .execute(&self.pool)
        .await
        .map_err(Error::Database)?;

        let deleted_count = result.rows_affected();
        info!(deleted_count = deleted_count, "Expired shares cleaned up");
        Ok(deleted_count)
    }

    #[instrument(skip(self))]
    async fn count_by_owner(&self, owner_id: Id) -> Result<u64> {
        let count = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM shares WHERE owner_id = $1",
            owner_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(Error::Database)?;

        Ok(count.unwrap_or(0) as u64)
    }
}