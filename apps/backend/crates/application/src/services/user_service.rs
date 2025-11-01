use kingshare_core::{Error, Id, PaginatedResponse, PaginationParams, Result};
use kingshare_domain::{
    entities::{CreateUserRequest, UpdateUserRequest, User, UserProfile},
    repositories::UserRepository,
    services::AuthService,
    value_objects::Email,
};
use std::sync::Arc;
use tracing::{info, instrument};
use validator::Validate;

#[derive(Clone)]
pub struct UserService {
    user_repository: Arc<dyn UserRepository>,
    auth_service: Arc<dyn AuthService>,
}

impl UserService {
    pub fn new(
        user_repository: Arc<dyn UserRepository>,
        auth_service: Arc<dyn AuthService>,
    ) -> Self {
        Self {
            user_repository,
            auth_service,
        }
    }

    #[instrument(skip(self, request))]
    pub async fn create_user(&self, request: CreateUserRequest) -> Result<UserProfile> {
        // Validate request
        request.validate()
            .map_err(|e| Error::Validation(e.to_string()))?;

        // Check if email already exists
        let email = Email::new(request.email)
            .map_err(|e| Error::Validation(e.to_string()))?;

        if self.user_repository.exists_by_email(&email).await? {
            return Err(Error::Conflict("Email already exists".to_string()));
        }

        // Check if username already exists
        if self.user_repository.exists_by_username(&request.username).await? {
            return Err(Error::Conflict("Username already exists".to_string()));
        }

        // Hash password
        let password_hash = self.auth_service.hash_password(&request.password).await?;

        // Create user
        let user = User::new(
            email,
            request.username,
            request.first_name,
            request.last_name,
            password_hash,
        );

        let created_user = self.user_repository.create(user).await?;
        
        info!(user_id = %created_user.id, "User created successfully");
        Ok(created_user.into())
    }

    #[instrument(skip(self))]
    pub async fn get_user_by_id(&self, id: Id) -> Result<UserProfile> {
        let user = self.user_repository.find_by_id(id).await?
            .ok_or_else(|| Error::NotFound("User not found".to_string()))?;

        Ok(user.into())
    }

    #[instrument(skip(self))]
    pub async fn get_user_by_email(&self, email: &str) -> Result<UserProfile> {
        let email = Email::new(email.to_string())
            .map_err(|e| Error::Validation(e.to_string()))?;

        let user = self.user_repository.find_by_email(&email).await?
            .ok_or_else(|| Error::NotFound("User not found".to_string()))?;

        Ok(user.into())
    }

    #[instrument(skip(self, request))]
    pub async fn update_user(&self, id: Id, request: UpdateUserRequest) -> Result<UserProfile> {
        // Validate request
        request.validate()
            .map_err(|e| Error::Validation(e.to_string()))?;

        // Get existing user
        let mut user = self.user_repository.find_by_id(id).await?
            .ok_or_else(|| Error::NotFound("User not found".to_string()))?;

        // Update fields if provided
        if let Some(username) = request.username {
            // Check if new username is already taken by another user
            if let Some(existing_user) = self.user_repository.find_by_username(&username).await? {
                if existing_user.id != id {
                    return Err(Error::Conflict("Username already exists".to_string()));
                }
            }
            user.username = username;
        }

        if let Some(first_name) = request.first_name {
            user.first_name = first_name;
        }

        if let Some(last_name) = request.last_name {
            user.last_name = last_name;
        }

        user.updated_at = chrono::Utc::now();

        let updated_user = self.user_repository.update(user).await?;
        
        info!(user_id = %id, "User updated successfully");
        Ok(updated_user.into())
    }

    #[instrument(skip(self))]
    pub async fn delete_user(&self, id: Id) -> Result<()> {
        // Check if user exists
        self.user_repository.find_by_id(id).await?
            .ok_or_else(|| Error::NotFound("User not found".to_string()))?;

        self.user_repository.delete(id).await?;
        
        info!(user_id = %id, "User deleted successfully");
        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn list_users(&self, params: PaginationParams) -> Result<PaginatedResponse<UserProfile>> {
        self.user_repository.list(params).await
    }

    #[instrument(skip(self))]
    pub async fn verify_user(&self, id: Id) -> Result<UserProfile> {
        let mut user = self.user_repository.find_by_id(id).await?
            .ok_or_else(|| Error::NotFound("User not found".to_string()))?;

        user.verify();
        let updated_user = self.user_repository.update(user).await?;
        
        info!(user_id = %id, "User verified successfully");
        Ok(updated_user.into())
    }

    #[instrument(skip(self))]
    pub async fn deactivate_user(&self, id: Id) -> Result<UserProfile> {
        let mut user = self.user_repository.find_by_id(id).await?
            .ok_or_else(|| Error::NotFound("User not found".to_string()))?;

        user.deactivate();
        let updated_user = self.user_repository.update(user).await?;
        
        info!(user_id = %id, "User deactivated successfully");
        Ok(updated_user.into())
    }

    #[instrument(skip(self))]
    pub async fn activate_user(&self, id: Id) -> Result<UserProfile> {
        let mut user = self.user_repository.find_by_id(id).await?
            .ok_or_else(|| Error::NotFound("User not found".to_string()))?;

        user.activate();
        let updated_user = self.user_repository.update(user).await?;
        
        info!(user_id = %id, "User activated successfully");
        Ok(updated_user.into())
    }

    #[instrument(skip(self))]
    pub async fn update_last_login(&self, id: Id) -> Result<()> {
        let mut user = self.user_repository.find_by_id(id).await?
            .ok_or_else(|| Error::NotFound("User not found".to_string()))?;

        user.update_last_login();
        self.user_repository.update(user).await?;
        
        info!(user_id = %id, "User last login updated");
        Ok(())
    }

    #[instrument(skip(self, password))]
    pub async fn authenticate_user(&self, email: &str, password: &str) -> Result<UserProfile> {
        // Find user by email
        let email_obj = Email::new(email.to_string())
            .map_err(|e| Error::Validation(e.to_string()))?;

        let user = self.user_repository.find_by_email(&email_obj).await?
            .ok_or_else(|| Error::Authentication("Invalid credentials".to_string()))?;

        // Check if user is active
        if !user.is_active {
            return Err(Error::Authentication("Account is deactivated".to_string()));
        }

        // Verify password
        let is_valid = self.auth_service.verify_password(password, &user.password_hash).await?;
        if !is_valid {
            return Err(Error::Authentication("Invalid credentials".to_string()));
        }

        // Update last login
        self.update_last_login(user.id).await?;

        info!(user_id = %user.id, "User authenticated successfully");
        Ok(user.into())
    }
}