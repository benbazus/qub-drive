use crate::value_objects::{Email, Password};
use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct User {
    pub id: Id,
    pub email: Email,
    pub username: String,
    pub first_name: String,
    pub last_name: String,
    pub password_hash: String,
    pub is_active: bool,
    pub is_verified: bool,
    pub role: UserRole,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub last_login_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserRole {
    Admin,
    User,
    Guest,
}

impl Default for UserRole {
    fn default() -> Self {
        UserRole::User
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    
    #[validate(length(min = 8))]
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub last_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Id,
    pub email: String,
    pub username: String,
    pub first_name: String,
    pub last_name: String,
    pub is_active: bool,
    pub is_verified: bool,
    pub role: UserRole,
    pub created_at: Timestamp,
    pub last_login_at: Option<Timestamp>,
}

impl From<User> for UserProfile {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email.into(),
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            is_active: user.is_active,
            is_verified: user.is_verified,
            role: user.role,
            created_at: user.created_at,
            last_login_at: user.last_login_at,
        }
    }
}

impl User {
    pub fn new(
        email: Email,
        username: String,
        first_name: String,
        last_name: String,
        password_hash: String,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: uuid::Uuid::new_v4(),
            email,
            username,
            first_name,
            last_name,
            password_hash,
            is_active: true,
            is_verified: false,
            role: UserRole::default(),
            created_at: now,
            updated_at: now,
            last_login_at: None,
        }
    }

    pub fn full_name(&self) -> String {
        format!("{} {}", self.first_name, self.last_name)
    }

    pub fn update_last_login(&mut self) {
        self.last_login_at = Some(chrono::Utc::now());
        self.updated_at = chrono::Utc::now();
    }

    pub fn verify(&mut self) {
        self.is_verified = true;
        self.updated_at = chrono::Utc::now();
    }

    pub fn deactivate(&mut self) {
        self.is_active = false;
        self.updated_at = chrono::Utc::now();
    }

    pub fn activate(&mut self) {
        self.is_active = true;
        self.updated_at = chrono::Utc::now();
    }
}