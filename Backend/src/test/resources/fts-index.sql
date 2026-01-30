-- Full-Text Search를 위한 GIN 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_message_content_fts ON chat_message USING GIN (to_tsvector('english', content));
