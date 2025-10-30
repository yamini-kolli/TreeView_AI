CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    theme_preference VARCHAR DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tree_sessions (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    session_name VARCHAR NOT NULL DEFAULT 'Untitled Tree',
    tree_type VARCHAR NOT NULL DEFAULT 'binary',
    tree_data JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_tree_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    tree_session_id VARCHAR NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    is_user_message BOOLEAN DEFAULT TRUE,
    intent_type VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_session FOREIGN KEY (tree_session_id) REFERENCES tree_sessions(id) ON DELETE CASCADE
);

