use async_trait::async_trait;
use axum::extract::ws::{Message, WebSocket};
use dashmap::DashMap;
use futures_util::{sink::SinkExt, stream::StreamExt};
use kingshare_core::{Error, Id, Result};
use kingshare_domain::{
    entities::{WebSocketConnection, WebSocketMessage},
    services::{ConnectionStats, WebSocketService},
};
use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tokio::sync::mpsc;
use tracing::{error, info, instrument, warn};

pub type ConnectionSender = mpsc::UnboundedSender<WebSocketMessage>;
pub type ConnectionReceiver = mpsc::UnboundedReceiver<WebSocketMessage>;

#[derive(Debug, Clone)]
struct ActiveConnection {
    connection: WebSocketConnection,
    sender: ConnectionSender,
}

#[derive(Debug, Clone)]
pub struct InMemoryWebSocketService {
    connections: Arc<DashMap<String, ActiveConnection>>,
    user_connections: Arc<DashMap<Id, Vec<String>>>,
}

impl InMemoryWebSocketService {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(DashMap::new()),
            user_connections: Arc::new(DashMap::new()),
        }
    }

    pub async fn handle_connection(
        &self,
        websocket: WebSocket,
        connection_id: String,
        user_id: Option<Id>,
    ) -> Result<()> {
        let (mut ws_sender, mut ws_receiver) = websocket.split();
        let (tx, mut rx): (ConnectionSender, ConnectionReceiver) = mpsc::unbounded_channel();

        // If user is authenticated, add to connections
        if let Some(user_id) = user_id {
            let connection = WebSocketConnection {
                connection_id: connection_id.clone(),
                user_id,
                connected_at: chrono::Utc::now(),
                last_activity: chrono::Utc::now(),
                metadata: HashMap::new(),
            };

            self.add_connection_internal(connection, tx.clone()).await?;

            // Notify other users that this user is online
            let _ = self.broadcast(WebSocketMessage::UserOnline {
                user_id,
                username: "User".to_string(), // This should come from user data
            }).await;
        }

        let service = self.clone();
        let connection_id_clone = connection_id.clone();

        // Spawn task to handle outgoing messages
        let send_task = tokio::spawn(async move {
            while let Some(message) = rx.recv().await {
                let json_message = match serde_json::to_string(&message) {
                    Ok(json) => json,
                    Err(e) => {
                        error!("Failed to serialize message: {}", e);
                        continue;
                    }
                };

                if ws_sender.send(Message::Text(json_message)).await.is_err() {
                    break;
                }
            }
        });

        // Handle incoming messages
        let receive_task = tokio::spawn(async move {
            while let Some(msg) = ws_receiver.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        if let Err(e) = service.handle_incoming_message(&connection_id_clone, &text).await {
                            error!("Error handling message: {}", e);
                        }
                    }
                    Ok(Message::Binary(_)) => {
                        warn!("Received binary message, ignoring");
                    }
                    Ok(Message::Close(_)) => {
                        info!("WebSocket connection closed");
                        break;
                    }
                    Ok(Message::Ping(data)) => {
                        if let Err(e) = service.send_to_connection(&connection_id_clone, WebSocketMessage::Pong).await {
                            error!("Failed to send pong: {}", e);
                        }
                    }
                    Ok(Message::Pong(_)) => {
                        // Update last activity
                        if let Some(mut conn) = service.connections.get_mut(&connection_id_clone) {
                            conn.connection.last_activity = chrono::Utc::now();
                        }
                    }
                    Err(e) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                }
            }
        });

        // Wait for either task to complete
        tokio::select! {
            _ = send_task => {},
            _ = receive_task => {},
        }

        // Clean up connection
        if let Err(e) = self.remove_connection(&connection_id).await {
            error!("Failed to remove connection: {}", e);
        }

        Ok(())
    }

    async fn add_connection_internal(
        &self,
        connection: WebSocketConnection,
        sender: ConnectionSender,
    ) -> Result<()> {
        let connection_id = connection.connection_id.clone();
        let user_id = connection.user_id;

        let active_conn = ActiveConnection { connection, sender };
        
        self.connections.insert(connection_id.clone(), active_conn);

        // Add to user connections
        self.user_connections
            .entry(user_id)
            .or_insert_with(Vec::new)
            .push(connection_id);

        info!(
            connection_id = %connection_id,
            user_id = %user_id,
            "WebSocket connection added"
        );

        Ok(())
    }

    async fn handle_incoming_message(&self, connection_id: &str, text: &str) -> Result<()> {
        let message: WebSocketMessage = serde_json::from_str(text)
            .map_err(|e| Error::Validation(format!("Invalid message format: {}", e)))?;

        match message {
            WebSocketMessage::Ping => {
                self.send_to_connection(connection_id, WebSocketMessage::Pong).await?;
            }
            WebSocketMessage::Authenticate { token } => {
                // Handle authentication
                // This would verify the JWT token and associate the connection with a user
                self.send_to_connection(
                    connection_id,
                    WebSocketMessage::AuthenticationResult {
                        success: true,
                        message: "Authenticated successfully".to_string(),
                    },
                ).await?;
            }
            _ => {
                // Handle other message types as needed
                info!("Received message: {:?}", message);
            }
        }

        // Update last activity
        if let Some(mut conn) = self.connections.get_mut(connection_id) {
            conn.connection.last_activity = chrono::Utc::now();
        }

        Ok(())
    }
}

#[async_trait]
impl WebSocketService for InMemoryWebSocketService {
    #[instrument(skip(self, connection))]
    async fn add_connection(&self, connection: WebSocketConnection) -> Result<()> {
        // This method is for external use when you have a sender
        // The internal method is used by handle_connection
        Err(Error::Internal("Use handle_connection instead".to_string()))
    }

    #[instrument(skip(self))]
    async fn remove_connection(&self, connection_id: &str) -> Result<()> {
        if let Some((_, active_conn)) = self.connections.remove(connection_id) {
            let user_id = active_conn.connection.user_id;

            // Remove from user connections
            if let Some(mut user_conns) = self.user_connections.get_mut(&user_id) {
                user_conns.retain(|id| id != connection_id);
                if user_conns.is_empty() {
                    drop(user_conns);
                    self.user_connections.remove(&user_id);

                    // Notify that user is offline
                    let _ = self.broadcast(WebSocketMessage::UserOffline {
                        user_id,
                        username: "User".to_string(),
                    }).await;
                }
            }

            info!(
                connection_id = %connection_id,
                user_id = %user_id,
                "WebSocket connection removed"
            );
        }

        Ok(())
    }

    #[instrument(skip(self))]
    async fn get_connection(&self, connection_id: &str) -> Result<Option<WebSocketConnection>> {
        Ok(self.connections.get(connection_id).map(|conn| conn.connection.clone()))
    }

    #[instrument(skip(self))]
    async fn get_user_connections(&self, user_id: Id) -> Result<Vec<WebSocketConnection>> {
        let mut connections = Vec::new();

        if let Some(connection_ids) = self.user_connections.get(&user_id) {
            for connection_id in connection_ids.iter() {
                if let Some(active_conn) = self.connections.get(connection_id) {
                    connections.push(active_conn.connection.clone());
                }
            }
        }

        Ok(connections)
    }

    #[instrument(skip(self, message))]
    async fn send_to_connection(&self, connection_id: &str, message: WebSocketMessage) -> Result<()> {
        if let Some(active_conn) = self.connections.get(connection_id) {
            active_conn.sender.send(message)
                .map_err(|e| Error::Internal(format!("Failed to send message: {}", e)))?;
        } else {
            return Err(Error::NotFound(format!("Connection {} not found", connection_id)));
        }

        Ok(())
    }

    #[instrument(skip(self, message))]
    async fn send_to_user(&self, user_id: Id, message: WebSocketMessage) -> Result<()> {
        if let Some(connection_ids) = self.user_connections.get(&user_id) {
            for connection_id in connection_ids.iter() {
                if let Err(e) = self.send_to_connection(connection_id, message.clone()).await {
                    warn!("Failed to send message to connection {}: {}", connection_id, e);
                }
            }
        }

        Ok(())
    }

    #[instrument(skip(self, message))]
    async fn broadcast(&self, message: WebSocketMessage) -> Result<()> {
        let mut failed_connections = Vec::new();

        for entry in self.connections.iter() {
            let connection_id = entry.key().clone();
            let active_conn = entry.value();

            if let Err(_) = active_conn.sender.send(message.clone()) {
                failed_connections.push(connection_id);
            }
        }

        // Clean up failed connections
        for connection_id in failed_connections {
            let _ = self.remove_connection(&connection_id).await;
        }

        Ok(())
    }

    #[instrument(skip(self, message))]
    async fn broadcast_to_users(&self, user_ids: Vec<Id>, message: WebSocketMessage) -> Result<()> {
        for user_id in user_ids {
            if let Err(e) = self.send_to_user(user_id, message.clone()).await {
                warn!("Failed to send message to user {}: {}", user_id, e);
            }
        }

        Ok(())
    }

    #[instrument(skip(self))]
    async fn get_online_users(&self) -> Result<Vec<Id>> {
        Ok(self.user_connections.iter().map(|entry| *entry.key()).collect())
    }

    #[instrument(skip(self))]
    async fn is_user_online(&self, user_id: Id) -> Result<bool> {
        Ok(self.user_connections.contains_key(&user_id))
    }

    #[instrument(skip(self))]
    async fn cleanup_inactive_connections(&self, timeout_seconds: u64) -> Result<u64> {
        let timeout_duration = Duration::from_secs(timeout_seconds);
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
        let mut removed_count = 0;
        let mut to_remove = Vec::new();

        for entry in self.connections.iter() {
            let connection = &entry.value().connection;
            let last_activity_duration = Duration::from_secs(connection.last_activity.timestamp() as u64);
            
            if now > last_activity_duration && (now - last_activity_duration) > timeout_duration {
                to_remove.push(entry.key().clone());
            }
        }

        for connection_id in to_remove {
            if let Err(e) = self.remove_connection(&connection_id).await {
                error!("Failed to remove inactive connection {}: {}", connection_id, e);
            } else {
                removed_count += 1;
            }
        }

        info!("Cleaned up {} inactive connections", removed_count);
        Ok(removed_count)
    }

    #[instrument(skip(self))]
    async fn get_connection_stats(&self) -> Result<ConnectionStats> {
        let total_connections = self.connections.len();
        let unique_users = self.user_connections.len();
        
        let mut connections_by_user = HashMap::new();
        for entry in self.user_connections.iter() {
            connections_by_user.insert(*entry.key(), entry.value().len());
        }

        Ok(ConnectionStats {
            total_connections,
            unique_users,
            connections_by_user,
        })
    }
}