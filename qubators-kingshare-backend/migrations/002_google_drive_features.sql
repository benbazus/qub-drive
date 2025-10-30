-- Migration for Google Drive-like features
-- This adds support for drives, documents, spreadsheets, forms, and collaboration

-- Drives table
CREATE TABLE drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    drive_type VARCHAR(50) NOT NULL CHECK (drive_type IN ('Personal', 'Shared', 'Team', 'Organization')),
    storage_quota BIGINT NOT NULL DEFAULT 15000000000, -- 15GB in bytes
    storage_used BIGINT NOT NULL DEFAULT 0,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drives_owner_id ON drives(owner_id);
CREATE INDEX idx_drives_drive_type ON drives(drive_type);

-- Folders table
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    path TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_starred BOOLEAN NOT NULL DEFAULT FALSE,
    is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trashed_at TIMESTAMPTZ
);

CREATE INDEX idx_folders_drive_id ON folders(drive_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_owner_id ON folders(owner_id);
CREATE INDEX idx_folders_is_trashed ON folders(is_trashed);

-- Drive items table (unified table for all drive items)
CREATE TABLE drive_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('File', 'Folder', 'Document', 'Spreadsheet', 'Presentation', 'Form', 'Drawing', 'Shortcut')),
    mime_type VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL DEFAULT 0,
    path TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB NOT NULL DEFAULT '{}',
    permissions JSONB NOT NULL DEFAULT '{}',
    is_starred BOOLEAN NOT NULL DEFAULT FALSE,
    is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trashed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ
);

CREATE INDEX idx_drive_items_drive_id ON drive_items(drive_id);
CREATE INDEX idx_drive_items_parent_id ON drive_items(parent_id);
CREATE INDEX idx_drive_items_owner_id ON drive_items(owner_id);
CREATE INDEX idx_drive_items_item_type ON drive_items(item_type);
CREATE INDEX idx_drive_items_is_trashed ON drive_items(is_trashed);
CREATE INDEX idx_drive_items_is_starred ON drive_items(is_starred);
CREATE INDEX idx_drive_items_last_accessed ON drive_items(last_accessed_at);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('TextDocument', 'Spreadsheet', 'Presentation', 'Form', 'Drawing')),
    content JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    permissions JSONB NOT NULL DEFAULT '{}',
    version BIGINT NOT NULL DEFAULT 1,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_is_public ON documents(is_public);
CREATE INDEX idx_documents_is_template ON documents(is_template);

-- Collaboration sessions table
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version BIGINT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_collaboration_sessions_document_id ON collaboration_sessions(document_id);
CREATE INDEX idx_collaboration_sessions_is_active ON collaboration_sessions(is_active);

-- Collaboration participants table
CREATE TABLE collaboration_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    cursor_position JSONB,
    selection JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Idle', 'Away', 'Offline')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_collaboration_participants_session_id ON collaboration_participants(session_id);
CREATE INDEX idx_collaboration_participants_user_id ON collaboration_participants(user_id);

-- Operations table (for operational transform)
CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('Insert', 'Delete', 'Retain', 'Format', 'Replace')),
    position INTEGER NOT NULL,
    content TEXT,
    length INTEGER,
    attributes JSONB,
    version BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operations_session_id ON operations(session_id);
CREATE INDEX idx_operations_user_id ON operations(user_id);
CREATE INDEX idx_operations_version ON operations(version);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    anchor JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved', 'Deleted')),
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_document_id ON comments(document_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_status ON comments(status);

-- Comment replies table
CREATE TABLE comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comment_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX idx_comment_replies_author_id ON comment_replies(author_id);

-- Suggestions table
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggestion_type VARCHAR(50) NOT NULL CHECK (suggestion_type IN ('TextEdit', 'Formatting', 'Structure', 'Content', 'Style')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    changes JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Applied', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suggestions_document_id ON suggestions(document_id);
CREATE INDEX idx_suggestions_author_id ON suggestions(author_id);
CREATE INDEX idx_suggestions_status ON suggestions(status);

-- Suggestion reviewers table
CREATE TABLE suggestion_reviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'RequestChanges')),
    feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    UNIQUE(suggestion_id, user_id)
);

CREATE INDEX idx_suggestion_reviewers_suggestion_id ON suggestion_reviewers(suggestion_id);
CREATE INDEX idx_suggestion_reviewers_user_id ON suggestion_reviewers(user_id);

-- Document versions table
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_snapshot TEXT NOT NULL,
    changes_summary TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    size BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    is_major_version BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_author_id ON document_versions(author_id);
CREATE INDEX idx_document_versions_version_number ON document_versions(version_number);

-- Spreadsheets table
CREATE TABLE spreadsheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spreadsheets_document_id ON spreadsheets(document_id);

-- Sheets table
CREATE TABLE sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spreadsheet_id UUID NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    index_position INTEGER NOT NULL,
    grid_properties JSONB NOT NULL DEFAULT '{}',
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    tab_color JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sheets_spreadsheet_id ON sheets(spreadsheet_id);
CREATE INDEX idx_sheets_index_position ON sheets(index_position);

-- Cells table
CREATE TABLE cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
    cell_reference VARCHAR(10) NOT NULL, -- e.g., "A1", "B2"
    value JSONB,
    formula TEXT,
    format JSONB NOT NULL DEFAULT '{}',
    note TEXT,
    hyperlink TEXT,
    data_validation JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sheet_id, cell_reference)
);

CREATE INDEX idx_cells_sheet_id ON cells(sheet_id);
CREATE INDEX idx_cells_cell_reference ON cells(cell_reference);

-- Charts table
CREATE TABLE charts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spreadsheet_id UUID NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    chart_type VARCHAR(50) NOT NULL,
    data_range JSONB NOT NULL,
    position JSONB NOT NULL,
    spec JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_charts_spreadsheet_id ON charts(spreadsheet_id);

-- Pivot tables table
CREATE TABLE pivot_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spreadsheet_id UUID NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source_range JSONB NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pivot_tables_spreadsheet_id ON pivot_tables(spreadsheet_id);

-- Forms table
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    branding JSONB NOT NULL DEFAULT '{}',
    logic JSONB NOT NULL DEFAULT '{}',
    analytics JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Paused', 'Closed', 'Archived')),
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_forms_document_id ON forms(document_id);
CREATE INDEX idx_forms_status ON forms(status);

-- Form sections table
CREATE TABLE form_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_position INTEGER NOT NULL,
    is_repeatable BOOLEAN NOT NULL DEFAULT FALSE,
    conditions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_sections_form_id ON form_sections(form_id);
CREATE INDEX idx_form_sections_order_position ON form_sections(order_position);

-- Form fields table
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES form_sections(id) ON DELETE CASCADE,
    field_type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    placeholder TEXT,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    order_position INTEGER NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    validation JSONB,
    default_value JSONB,
    properties JSONB NOT NULL DEFAULT '{}',
    conditions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_fields_section_id ON form_fields(section_id);
CREATE INDEX idx_form_fields_order_position ON form_fields(order_position);

-- Form responses table
CREATE TABLE form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    respondent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    respondent_email VARCHAR(255),
    responses JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'InProgress' CHECK (status IN ('InProgress', 'Submitted', 'Approved', 'Rejected', 'Flagged')),
    score DECIMAL(5,2),
    completion_time INTEGER, -- seconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

CREATE INDEX idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX idx_form_responses_respondent_id ON form_responses(respondent_id);
CREATE INDEX idx_form_responses_status ON form_responses(status);
CREATE INDEX idx_form_responses_submitted_at ON form_responses(submitted_at);

-- Drive activity table (audit log)
CREATE TABLE drive_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    item_id UUID REFERENCES drive_items(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drive_activities_drive_id ON drive_activities(drive_id);
CREATE INDEX idx_drive_activities_item_id ON drive_activities(item_id);
CREATE INDEX idx_drive_activities_user_id ON drive_activities(user_id);
CREATE INDEX idx_drive_activities_activity_type ON drive_activities(activity_type);
CREATE INDEX idx_drive_activities_created_at ON drive_activities(created_at);

-- Sharing links table
CREATE TABLE sharing_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES drive_items(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    access_level VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255),
    access_count BIGINT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sharing_links_item_id ON sharing_links(item_id);
CREATE INDEX idx_sharing_links_token ON sharing_links(token);
CREATE INDEX idx_sharing_links_expires_at ON sharing_links(expires_at);

-- Item shares table (user-to-user sharing)
CREATE TABLE item_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES drive_items(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL DEFAULT '{}',
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
    expires_at TIMESTAMPTZ,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(item_id, shared_with_user_id)
);

CREATE INDEX idx_item_shares_item_id ON item_shares(item_id);
CREATE INDEX idx_item_shares_shared_with_user_id ON item_shares(shared_with_user_id);
CREATE INDEX idx_item_shares_shared_by_user_id ON item_shares(shared_by_user_id);

-- Named ranges table (for spreadsheets)
CREATE TABLE named_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spreadsheet_id UUID NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    range_definition JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(spreadsheet_id, name)
);

CREATE INDEX idx_named_ranges_spreadsheet_id ON named_ranges(spreadsheet_id);

-- Form templates table
CREATE TABLE form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    preview_image_url TEXT,
    template_data JSONB NOT NULL,
    usage_count BIGINT NOT NULL DEFAULT 0,
    rating DECIMAL(3,2),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_templates_category ON form_templates(category);
CREATE INDEX idx_form_templates_created_by ON form_templates(created_by);
CREATE INDEX idx_form_templates_is_public ON form_templates(is_public);
CREATE INDEX idx_form_templates_tags ON form_templates USING GIN(tags);

-- Workflows table (for form automation)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_form_id ON workflows(form_id);
CREATE INDEX idx_workflows_is_active ON workflows(is_active);

-- Integrations table (for form integrations)
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    field_mappings JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integrations_form_id ON integrations(form_id);
CREATE INDEX idx_integrations_integration_type ON integrations(integration_type);
CREATE INDEX idx_integrations_is_active ON integrations(is_active);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_drives_updated_at BEFORE UPDATE ON drives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drive_items_updated_at BEFORE UPDATE ON drive_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaboration_sessions_updated_at BEFORE UPDATE ON collaboration_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comment_replies_updated_at BEFORE UPDATE ON comment_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spreadsheets_updated_at BEFORE UPDATE ON spreadsheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sheets_updated_at BEFORE UPDATE ON sheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cells_updated_at BEFORE UPDATE ON cells FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charts_updated_at BEFORE UPDATE ON charts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pivot_tables_updated_at BEFORE UPDATE ON pivot_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_sections_updated_at BEFORE UPDATE ON form_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_responses_updated_at BEFORE UPDATE ON form_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_named_ranges_updated_at BEFORE UPDATE ON named_ranges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON form_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default form templates
INSERT INTO form_templates (name, description, category, template_data, created_by, tags) VALUES
('Contact Form', 'Basic contact form with name, email, and message fields', 'Contact', 
 '{"sections":[{"title":"Contact Information","fields":[{"type":"ShortText","label":"Full Name","required":true},{"type":"Email","label":"Email Address","required":true},{"type":"Phone","label":"Phone Number","required":false},{"type":"LongText","label":"Message","required":true}]}]}',
 (SELECT id FROM users LIMIT 1), ARRAY['contact', 'basic', 'communication']),
 
('Event Registration', 'Event registration form with participant details', 'Events',
 '{"sections":[{"title":"Participant Information","fields":[{"type":"ShortText","label":"Full Name","required":true},{"type":"Email","label":"Email Address","required":true},{"type":"Dropdown","label":"Event Session","required":true,"options":["Morning Session","Afternoon Session","Evening Session"]},{"type":"Checkboxes","label":"Dietary Restrictions","options":["Vegetarian","Vegan","Gluten-Free","No Restrictions"]}]}]}',
 (SELECT id FROM users LIMIT 1), ARRAY['event', 'registration', 'participants']),
 
('Customer Feedback', 'Customer satisfaction survey form', 'Survey',
 '{"sections":[{"title":"Your Experience","fields":[{"type":"Rating","label":"Overall Satisfaction","required":true},{"type":"MultipleChoice","label":"How did you hear about us?","options":["Social Media","Friend Referral","Google Search","Advertisement"]},{"type":"LongText","label":"Additional Comments","required":false}]}]}',
 (SELECT id FROM users LIMIT 1), ARRAY['feedback', 'survey', 'customer']);

-- Create some sample data for testing
DO $$
DECLARE
    sample_user_id UUID;
    sample_drive_id UUID;
    sample_document_id UUID;
    sample_form_id UUID;
BEGIN
    -- Get a sample user (assuming users exist)
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- Create a sample personal drive
        INSERT INTO drives (owner_id, name, drive_type) 
        VALUES (sample_user_id, 'My Drive', 'Personal') 
        RETURNING id INTO sample_drive_id;
        
        -- Create a sample document
        INSERT INTO documents (owner_id, title, document_type, content)
        VALUES (sample_user_id, 'Welcome Document', 'TextDocument', '{"content":"Welcome to KingShare!","format":"RichText"}')
        RETURNING id INTO sample_document_id;
        
        -- Create a sample form
        INSERT INTO forms (document_id, title, description, status)
        VALUES (sample_document_id, 'Sample Feedback Form', 'A sample form for collecting feedback', 'Draft')
        RETURNING id INTO sample_form_id;
        
        -- Create a sample form section
        INSERT INTO form_sections (form_id, title, order_position)
        VALUES (sample_form_id, 'General Information', 1);
    END IF;
END $$;