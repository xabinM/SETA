-- Full-Text Search를 위한 GIN 인덱스 생성
-- 인덱스가 이미 존재하면 에러가 발생하지 않도록 IF NOT EXISTS 추가
CREATE INDEX IF NOT EXISTS idx_chat_message_content_fts ON chat_message USING GIN (to_tsvector('english', content));
