use crate::{handlers, middleware::auth, server::AppState};
use axum::{
    middleware,
    routing::{get, post},
    Router,
};

pub fn create_routes(state: AppState) -> Router {
    // Public routes (no authentication required)
    let public_routes = Router::new()
        // Health check
        .route("/health", get(handlers::health::health_check))
        
        // Authentication routes
        .route("/api/v1/auth/register", post(handlers::auth::register))
        .route("/api/v1/auth/login", post(handlers::auth::login))
        .route("/api/v1/auth/refresh", post(handlers::auth::refresh_token))
        
        // Public share access
        .route("/api/v1/shares/token/:token", get(handlers::shares::get_share_by_token))
        .route("/api/v1/shares/token/:token/download", post(handlers::shares::download_shared_file))
        
        // WebSocket (handles auth internally)
        .route("/ws", get(handlers::websocket::websocket_handler));

    // Protected routes (authentication required)
    let protected_routes = Router::new()
        // Authentication
        .route("/api/v1/auth/logout", post(handlers::auth::logout))
        
        // User routes
        .route("/api/v1/users", get(handlers::users::list_users))
        .route("/api/v1/users/profile", get(handlers::users::get_profile))
        .route("/api/v1/users/profile", post(handlers::users::update_profile))
        
        // File routes
        .route("/api/v1/files", post(handlers::files::upload_file))
        .route("/api/v1/files/:id", post(handlers::files::update_file))
        .route("/api/v1/files/:id", axum::routing::delete(handlers::files::delete_file))
        .route("/api/v1/files/stats", get(handlers::files::get_storage_stats))
        
        // Share routes
        .route("/api/v1/shares", get(handlers::shares::list_shares))
        .route("/api/v1/shares", post(handlers::shares::create_share))
        .route("/api/v1/shares/:id", get(handlers::shares::get_share))
        .route("/api/v1/shares/:id", post(handlers::shares::update_share))
        .route("/api/v1/shares/:id", axum::routing::delete(handlers::shares::delete_share))
        .route("/api/v1/shares/:id/regenerate", post(handlers::shares::regenerate_share_token))
        
        // WebSocket management
        .route("/api/v1/ws/stats", get(handlers::websocket::get_websocket_stats))
        .route("/api/v1/ws/cleanup", post(handlers::websocket::cleanup_websocket_connections))
        
        // Drive routes
        .route("/api/v1/drives", post(handlers::drive::create_drive))
        .route("/api/v1/drives", get(handlers::drive::get_user_drives))
        .route("/api/v1/drives/:drive_id", get(handlers::drive::get_drive))
        .route("/api/v1/drives/:drive_id", axum::routing::patch(handlers::drive::update_drive))
        .route("/api/v1/drives/:drive_id", axum::routing::delete(handlers::drive::delete_drive))
        .route("/api/v1/drives/:drive_id/folders", post(handlers::drive::create_folder))
        .route("/api/v1/drives/:drive_id/folders/:folder_id/contents", get(handlers::drive::get_folder_contents))
        .route("/api/v1/drives/:drive_id/search", get(handlers::drive::search_drive))
        .route("/api/v1/drives/:drive_id/activity", get(handlers::drive::get_drive_activity))
        .route("/api/v1/drives/:drive_id/storage", get(handlers::drive::get_storage_usage))
        .route("/api/v1/drives/:drive_id/trash", get(handlers::drive::get_trash_items))
        .route("/api/v1/drives/:drive_id/trash", axum::routing::delete(handlers::drive::empty_trash))
        
        // Folder routes
        .route("/api/v1/folders/:folder_id", axum::routing::patch(handlers::drive::update_folder))
        .route("/api/v1/folders/:folder_id", axum::routing::delete(handlers::drive::delete_folder))
        
        // Drive item routes
        .route("/api/v1/items/:item_id", get(handlers::drive::get_drive_item))
        .route("/api/v1/items/:item_id/move", post(handlers::drive::move_drive_item))
        .route("/api/v1/items/:item_id/copy", post(handlers::drive::copy_drive_item))
        .route("/api/v1/items/:item_id/star", post(handlers::drive::star_item))
        .route("/api/v1/items/:item_id/star", axum::routing::delete(handlers::drive::unstar_item))
        .route("/api/v1/items/:item_id/trash", post(handlers::drive::move_to_trash))
        .route("/api/v1/items/:item_id/restore", post(handlers::drive::restore_from_trash))
        .route("/api/v1/items/:item_id/share", post(handlers::drive::share_item))
        .route("/api/v1/items/:item_id/share/link", post(handlers::drive::create_sharing_link))
        .route("/api/v1/items/:item_id/share/link", axum::routing::delete(handlers::drive::revoke_sharing_link))
        
        // Special collections
        .route("/api/v1/recent", get(handlers::drive::get_recent_items))
        .route("/api/v1/starred", get(handlers::drive::get_starred_items))
        .route("/api/v1/shared-with-me", get(handlers::drive::get_shared_with_me))
        
        // Document routes
        .route("/api/v1/documents", post(handlers::documents::create_document))
        .route("/api/v1/documents", get(handlers::documents::list_documents))
        .route("/api/v1/documents/:document_id", get(handlers::documents::get_document))
        .route("/api/v1/documents/:document_id", axum::routing::patch(handlers::documents::update_document))
        .route("/api/v1/documents/:document_id", axum::routing::delete(handlers::documents::delete_document))
        
        // Document collaboration
        .route("/api/v1/documents/:document_id/collaborate/start", post(handlers::documents::start_collaboration))
        .route("/api/v1/documents/:document_id/collaborate/join", post(handlers::documents::join_collaboration))
        .route("/api/v1/documents/:document_id/collaborate/leave", post(handlers::documents::leave_collaboration))
        .route("/api/v1/documents/:document_id/operations", post(handlers::documents::apply_operations))
        .route("/api/v1/documents/:document_id/operations", get(handlers::documents::get_pending_operations))
        
        // Document comments
        .route("/api/v1/documents/:document_id/comments", post(handlers::documents::add_comment))
        .route("/api/v1/documents/:document_id/comments", get(handlers::documents::get_comments))
        .route("/api/v1/comments/:comment_id", axum::routing::patch(handlers::documents::update_comment))
        .route("/api/v1/comments/:comment_id/reply", post(handlers::documents::reply_to_comment))
        .route("/api/v1/comments/:comment_id/resolve", post(handlers::documents::resolve_comment))
        
        // Document suggestions
        .route("/api/v1/documents/:document_id/suggestions", post(handlers::documents::create_suggestion))
        .route("/api/v1/documents/:document_id/suggestions", get(handlers::documents::get_suggestions))
        .route("/api/v1/suggestions/:suggestion_id/review", post(handlers::documents::review_suggestion))
        .route("/api/v1/suggestions/:suggestion_id/apply", post(handlers::documents::apply_suggestion))
        .route("/api/v1/suggestions/pending", get(handlers::documents::get_pending_reviews))
        
        // Document versions
        .route("/api/v1/documents/:document_id/versions", post(handlers::documents::create_version))
        .route("/api/v1/documents/:document_id/versions", get(handlers::documents::get_versions))
        .route("/api/v1/documents/:document_id/versions/:version_id/restore", post(handlers::documents::restore_version))
        
        // Document templates
        .route("/api/v1/documents/:document_id/template", post(handlers::documents::save_as_template))
        .route("/api/v1/templates", get(handlers::documents::get_templates))
        .route("/api/v1/templates/:template_id/create", post(handlers::documents::create_from_template))
        
        // Spreadsheet routes
        .route("/api/v1/spreadsheets", post(handlers::spreadsheets::create_spreadsheet))
        .route("/api/v1/spreadsheets/:spreadsheet_id", get(handlers::spreadsheets::get_spreadsheet))
        .route("/api/v1/spreadsheets/:spreadsheet_id", axum::routing::patch(handlers::spreadsheets::update_spreadsheet))
        .route("/api/v1/spreadsheets/:spreadsheet_id", axum::routing::delete(handlers::spreadsheets::delete_spreadsheet))
        .route("/api/v1/spreadsheets/:spreadsheet_id/analytics", get(handlers::spreadsheets::get_spreadsheet_analytics))
        .route("/api/v1/spreadsheets/:spreadsheet_id/circular-refs", get(handlers::spreadsheets::detect_circular_references))
        
        // Sheet routes
        .route("/api/v1/spreadsheets/:spreadsheet_id/sheets", post(handlers::spreadsheets::create_sheet))
        .route("/api/v1/sheets/:sheet_id", get(handlers::spreadsheets::get_sheet))
        .route("/api/v1/sheets/:sheet_id", axum::routing::patch(handlers::spreadsheets::update_sheet))
        .route("/api/v1/sheets/:sheet_id", axum::routing::delete(handlers::spreadsheets::delete_sheet))
        .route("/api/v1/sheets/:sheet_id/duplicate", post(handlers::spreadsheets::duplicate_sheet))
        .route("/api/v1/sheets/:sheet_id/recalculate", post(handlers::spreadsheets::recalculate_sheet))
        
        // Cell operations
        .route("/api/v1/sheets/:sheet_id/cells/:cell_ref", get(handlers::spreadsheets::get_cell))
        .route("/api/v1/sheets/:sheet_id/cells/:cell_ref", axum::routing::patch(handlers::spreadsheets::update_cell))
        .route("/api/v1/sheets/:sheet_id/cells", axum::routing::patch(handlers::spreadsheets::batch_update_cells))
        .route("/api/v1/sheets/:sheet_id/range", get(handlers::spreadsheets::get_range))
        .route("/api/v1/sheets/:sheet_id/range/clear", post(handlers::spreadsheets::clear_range))
        .route("/api/v1/sheets/:sheet_id/formula/calculate", post(handlers::spreadsheets::calculate_formula))
        
        // Chart routes
        .route("/api/v1/spreadsheets/:spreadsheet_id/charts", post(handlers::spreadsheets::create_chart))
        .route("/api/v1/charts/:chart_id", get(handlers::spreadsheets::get_chart))
        .route("/api/v1/charts/:chart_id", axum::routing::patch(handlers::spreadsheets::update_chart))
        .route("/api/v1/charts/:chart_id", axum::routing::delete(handlers::spreadsheets::delete_chart))
        
        // Pivot table routes
        .route("/api/v1/spreadsheets/:spreadsheet_id/pivot-tables", post(handlers::spreadsheets::create_pivot_table))
        .route("/api/v1/pivot-tables/:pivot_table_id", get(handlers::spreadsheets::get_pivot_table))
        .route("/api/v1/pivot-tables/:pivot_table_id/refresh", post(handlers::spreadsheets::refresh_pivot_table))
        
        // Import/Export
        .route("/api/v1/spreadsheets/:spreadsheet_id/sheets/:sheet_id/import/csv", post(handlers::spreadsheets::import_csv))
        .route("/api/v1/sheets/:sheet_id/export/csv", get(handlers::spreadsheets::export_csv))
        
        // Forms routes
        .route("/api/v1/forms", post(handlers::forms::create_form))
        .route("/api/v1/forms", get(handlers::forms::list_forms))
        .route("/api/v1/forms/:form_id", get(handlers::forms::get_form))
        .route("/api/v1/forms/:form_id", axum::routing::patch(handlers::forms::update_form))
        .route("/api/v1/forms/:form_id", axum::routing::delete(handlers::forms::delete_form))
        
        // Form building
        .route("/api/v1/forms/:form_id/sections", post(handlers::forms::add_section))
        .route("/api/v1/forms/:form_id/fields", post(handlers::forms::add_field))
        .route("/api/v1/fields/:field_id", axum::routing::patch(handlers::forms::update_field))
        .route("/api/v1/fields/:field_id", axum::routing::delete(handlers::forms::delete_field))
        .route("/api/v1/forms/:form_id/reorder", post(handlers::forms::reorder_elements))
        
        // Form publishing
        .route("/api/v1/forms/:form_id/publish", post(handlers::forms::publish_form))
        .route("/api/v1/forms/:form_id/unpublish", post(handlers::forms::unpublish_form))
        .route("/api/v1/forms/:form_id/embed", get(handlers::forms::get_embed_code))
        .route("/api/v1/forms/:form_id/qr-code", get(handlers::forms::get_qr_code))
        
        // Form responses (authenticated)
        .route("/api/v1/forms/:form_id/responses", get(handlers::forms::get_form_responses))
        .route("/api/v1/responses/:response_id", get(handlers::forms::get_response))
        .route("/api/v1/responses/:response_id", axum::routing::patch(handlers::forms::update_response))
        .route("/api/v1/responses/:response_id", axum::routing::delete(handlers::forms::delete_response))
        .route("/api/v1/responses/:response_id/approve", post(handlers::forms::approve_response))
        .route("/api/v1/responses/:response_id/reject", post(handlers::forms::reject_response))
        
        // Form analytics
        .route("/api/v1/forms/:form_id/analytics", get(handlers::forms::get_form_analytics))
        .route("/api/v1/forms/:form_id/summary", get(handlers::forms::get_response_summary))
        .route("/api/v1/forms/:form_id/insights", get(handlers::forms::generate_insights))
        .route("/api/v1/forms/:form_id/export", post(handlers::forms::export_responses))
        
        // Form templates
        .route("/api/v1/forms/:form_id/template", post(handlers::forms::save_as_template))
        .route("/api/v1/form-templates", get(handlers::forms::get_templates))
        .route("/api/v1/form-templates/:template_id/preview", get(handlers::forms::preview_template))
        
        // Advanced form features
        .route("/api/v1/forms/:form_id/logic", post(handlers::forms::setup_conditional_logic))
        .route("/api/v1/forms/:form_id/notifications", post(handlers::forms::configure_notifications))
        .route("/api/v1/forms/:form_id/integrations", post(handlers::forms::setup_integrations))
        .route("/api/v1/forms/:form_id/optimize", post(handlers::forms::optimize_form))
        .route("/api/v1/forms/:form_id/validate", get(handlers::forms::validate_form))
        .route("/api/v1/forms/:form_id/health", get(handlers::forms::get_health_score))
        
        .layer(middleware::from_fn_with_state(state.clone(), auth::auth_middleware));

    // Optional auth routes (authentication optional)
    let optional_auth_routes = Router::new()
        // File routes that work with or without auth
        .route("/api/v1/files", get(handlers::files::list_files))
        .route("/api/v1/files/:id", get(handlers::files::get_file))
        .route("/api/v1/files/:id/download", get(handlers::files::download_file))
        
        .layer(middleware::from_fn_with_state(state.clone(), auth::optional_auth_middleware));

    // Public form submission routes (no authentication required)
    let public_form_routes = Router::new()
        .route("/api/v1/forms/:form_id/submit", post(handlers::forms::submit_response))
        .route("/api/v1/forms/:form_id/draft", post(handlers::forms::save_draft_response));

    // Combine all routes
    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .merge(optional_auth_routes)
        .merge(public_form_routes)
        .with_state(state)
}