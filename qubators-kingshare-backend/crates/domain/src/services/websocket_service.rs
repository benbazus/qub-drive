use crate::entities::{WebSocketConnection, WebSocketEvent, WebSocketMessage};
use async_trait::async_trait;
use kingshare_core::{Error, Id, Result};
use mockall::automock;
use std::collections::HashMap;

#[automock]
#[async_trait]
pub trait WebSocketService: Send + Sync {
    async fn add_connection(&self, connection: WebSocketConnection) -> Result<()>;
    async fn remove_connection(&self, connection_id: &str) -> Result<()>;
    async fn get_connection(&self, connection_id: &str) -> Result<Option<WebSocketConnection>>;
    async fn get_user_connections(&self, user_id: Id) -> Result<Vec<WebSocketConnection>>;
    async fn send_to_connection(&self, connection_id: &str, message: WebSocketMessage) -> Result<()>;
    async fn send_to_user(&self, user_id: Id, message: WebSocketMessage) -> Result<()>;
    async fn broadcast(&self, message: WebSocketMessage) -> Result<()>;
    async fn broadcast_to_users(&self, user_ids: Vec<Id>, message: WebSocketMessage) -> Result<()>;
    async fn get_online_users(&self) -> Result<Vec<Id>>;
    async fn is_user_online(&self, user_id: Id) -> Result<bool>;
    async fn cleanup_inactive_connections(&self, timeout_seconds: u64) -> Result<u64>;
    async fn get_connection_stats(&self) -> Result<ConnectionStats>;
}

#[derive(Debug, Clone)]
pub struct ConnectionStats {
    pub total_connections: usize,
    pub unique_users: usize,
    pub connections_by_user: HashMap<Id, usize>,
}