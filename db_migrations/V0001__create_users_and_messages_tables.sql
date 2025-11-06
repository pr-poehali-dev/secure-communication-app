-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_username VARCHAR(50) NOT NULL,
    recipient_username VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
