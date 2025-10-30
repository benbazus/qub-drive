use async_trait::async_trait;
use kingshare_core::{Error, Id, PaginatedResponse, PaginationInfo, PaginationParams, Result};
use kingshare_domain::{
    entities::{User, UserProfile, UserRole},
    repositories::UserRepository,
    value_objects::Email,
};
use sqlx::PgPool;
use tracing::{info, instrument};

#[derive(Debug, Clone)]
pub struct PostgresUserRepository {
    pool: PgPool,
}

impl PostgresUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for PostgresUserRepository {
    #[instrument(skip(self, user))]
    async fn create(&self, user: User) -> Result<User> {
        let role_str = match user.role {
            UserRole::Admin => "Admin",
            UserRole::User => "User",
            UserRole::Guest => "Guest",
        };

        sqlx::query!(
            r#"
            INSERT INTO users (id, email, username, first_name, last_name, password_hash, 
                             is_active, is_verified, role, created_at, updated_at, last_login_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
            user.id,
            user.email.as_str(),
            user.username,
            user.first_name,
            user.last_name,
            user.password_hash,
            user.is_active,
            user.is_verified,
            role_str,
            user.created_at,
            user.updated_at,
            user.last_login_at
        )
        .execute(&self.pool)
        .await
        .map_err(Error::Database)?;

        info!(user_id = %user.id, "User created successfully");
        Ok(user)
    }

    #[instrument(skip(self))]
    async fn find_by_id(&self, id: Id) -> Result<Option<User>> {
        let row = sqlx::query!(
            r#"
            SELECT id, email, username, first_name, last_name, password_hash,
                   is_active, is_verified, role, created_at, updated_at, last_login_at
            FROM users WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(Error::Database)?;

        match row {
            Some(row) => {
                let role = match row.role.as_str() {
                    "Admin" => UserRole::Admin,
                    "Guest" => UserRole::Guest,
                    _ => UserRole::User,
                };

                let email = Email::new(row.email)
                    .map_err(|e| Error::Validation(e.to_string()))?;

                Ok(Some(User {
                    id: row.id,
                    email,
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    password_hash: row.password_hash,
                    is_active: row.is_active,
                    is_verified: row.is_verified,
                    role,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    last_login_at: row.last_login_at,
                }))
            }
            None => Ok(None),
        }
    }

    #[instrument(skip(self))]
    async fn find_by_email(&self, email: &Email) -> Result<Option<User>> {
        let row = sqlx::query!(
            r#"
            SELECT id, email, username, first_name, last_name, password_hash,
                   is_active, is_verified, role, created_at, updated_at, last_login_at
            FROM users WHERE email = $1
            "#,
            email.as_str()
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(Error::Database)?;

        match row {
            Some(row) => {
                let role = match row.role.as_str() {
                    "Admin" => UserRole::Admin,
                    "Guest" => UserRole::Guest,
                    _ => UserRole::User,
                };

                let email = Email::new(row.email)
                    .map_err(|e| Error::Validation(e.to_string()))?;

                Ok(Some(User {
                    id: row.id,
                    email,
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    password_hash: row.password_hash,
                    is_active: row.is_active,
                    is_verified: row.is_verified,
                    role,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    last_login_at: row.last_login_at,
                }))
            }
            None => Ok(None),
        }
    }

    #[instrument(skip(self))]
    async fn find_by_username(&self, username: &str) -> Result<Option<User>> {
        let row = sqlx::query!(
            r#"
            SELECT id, email, username, first_name, last_name, password_hash,
                   is_active, is_verified, role, created_at, updated_at, last_login_at
            FROM users WHERE username = $1
            "#,
            username
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(Error::Database)?;

        match row {
            Some(row) => {
                let role = match row.role.as_str() {
                    "Admin" => UserRole::Admin,
                    "Guest" => UserRole::Guest,
                    _ => UserRole::User,
                };

                let email = Email::new(row.email)
                    .map_err(|e| Error::Validation(e.to_string()))?;

                Ok(Some(User {
                    id: row.id,
                    email,
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    password_hash: row.password_hash,
                    is_active: row.is_active,
                    is_verified: row.is_verified,
                    role,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    last_login_at: row.last_login_at,
                }))
            }
            None => Ok(None),
        }
    }

    #[instrument(skip(self, user))]
    async fn update(&self, user: User) -> Result<User> {
        let role_str = match user.role {
            UserRole::Admin => "Admin",
            UserRole::User => "User",
            UserRole::Guest => "Guest",
        };

        sqlx::query!(
            r#"
            UPDATE users 
            SET email = $2, username = $3, first_name = $4, last_name = $5, 
                password_hash = $6, is_active = $7, is_verified = $8, role = $9,
                updated_at = $10, last_login_at = $11
            WHERE id = $1
            "#,
            user.id,
            user.email.as_str(),
            user.username,
            user.first_name,
            user.last_name,
            user.password_hash,
            user.is_active,
            user.is_verified,
            role_str,
            user.updated_at,
            user.last_login_at
        )
        .execute(&self.pool)
        .await
        .map_err(Error::Database)?;

        info!(user_id = %user.id, "User updated successfully");
        Ok(user)
    }

    #[instrument(skip(self))]
    async fn delete(&self, id: Id) -> Result<()> {
        sqlx::query!("DELETE FROM users WHERE id = $1::uuid", id)
            .execute(&self.pool)
            .await
            .map_err(Error::Database)?;

        info!(user_id = %id, "User deleted successfully");
        Ok(())
    }

    #[instrument(skip(self))]
    async fn list(&self, params: PaginationParams) -> Result<PaginatedResponse<UserProfile>> {
        let limit = params.limit() as i64;
        let offset = params.offset() as i64;

        let rows = sqlx::query!(
            r#"
            SELECT id, email, username, first_name, last_name, is_active, is_verified, 
                   role, created_at, last_login_at
            FROM users 
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map_err(Error::Database)?;

        let total = self.count().await?;

        let profiles: Vec<UserProfile> = rows
            .into_iter()
            .map(|row| {
                let role = match row.role.as_str() {
                    "Admin" => UserRole::Admin,
                    "Guest" => UserRole::Guest,
                    _ => UserRole::User,
                };

                UserProfile {
                    id: row.id,
                    email: row.email,
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    is_active: row.is_active,
                    is_verified: row.is_verified,
                    role,
                    created_at: row.created_at,
                    last_login_at: row.last_login_at,
                }
            })
            .collect();

        let pagination = PaginationInfo::new(
            params.page.unwrap_or(1),
            params.limit(),
            total,
        );

        Ok(PaginatedResponse {
            data: profiles,
            pagination,
        })
    }

    #[instrument(skip(self))]
    async fn exists_by_email(&self, email: &Email) -> Result<bool> {
        let count = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM users WHERE email = $1",
            email.as_str()
        )
        .fetch_one(&self.pool)
        .await
        .map_err(Error::Database)?;

        Ok(count.unwrap_or(0) > 0)
    }

    #[instrument(skip(self))]
    async fn exists_by_username(&self, username: &str) -> Result<bool> {
        let count = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM users WHERE username = $1",
            username
        )
        .fetch_one(&self.pool)
        .await
        .map_err(Error::Database)?;

        Ok(count.unwrap_or(0) > 0)
    }

    #[instrument(skip(self))]
    async fn count(&self) -> Result<u64> {
        let count = sqlx::query_scalar!("SELECT COUNT(*) FROM users")
            .fetch_one(&self.pool)
            .await
            .map_err(Error::Database)?;

        Ok(count.unwrap_or(0) as u64)
    }

    #[instrument(skip(self))]
    async fn find_active_users(&self, params: PaginationParams) -> Result<PaginatedResponse<UserProfile>> {
        let limit = params.limit() as i64;
        let offset = params.offset() as i64;

        let rows = sqlx::query!(
            r#"
            SELECT id, email, username, first_name, last_name, is_active, is_verified, 
                   role, created_at, last_login_at
            FROM users 
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map_err(Error::Database)?;

        let total = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM users WHERE is_active = true"
        )
        .fetch_one(&self.pool)
        .await
        .map_err(Error::Database)?
        .unwrap_or(0) as u64;

        let profiles: Vec<UserProfile> = rows
            .into_iter()
            .map(|row| {
                let role = match row.role.as_str() {
                    "Admin" => UserRole::Admin,
                    "Guest" => UserRole::Guest,
                    _ => UserRole::User,
                };

                UserProfile {
                    id: row.id,
                    email: row.email,
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    is_active: row.is_active,
                    is_verified: row.is_verified,
                    role,
                    created_at: row.created_at,
                    last_login_at: row.last_login_at,
                }
            })
            .collect();

        let pagination = PaginationInfo::new(
            params.page.unwrap_or(1),
            params.limit(),
            total,
        );

        Ok(PaginatedResponse {
            data: profiles,
            pagination,
        })
    }
}