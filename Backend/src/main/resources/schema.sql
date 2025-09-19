BEGIN;

-- 확장 설치
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- room_summary_state
CREATE TABLE IF NOT EXISTS room_summary_state (
  chat_room_id    UUID PRIMARY KEY REFERENCES chat_room(chat_room_id),
  last_turn_end   INT,
  last_summary_at TIMESTAMPTZ
);

-- user_memory_embedding
CREATE TABLE IF NOT EXISTS user_memory_embedding (
  embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      BIGINT REFERENCES users(user_id),
  chat_room_id UUID REFERENCES chat_room(chat_room_id),
  source_type  VARCHAR(16) CHECK (source_type IN ('message', 'summary')),
  source_id    UUID,
  content      TEXT,
  embedding    VECTOR(1536),
  created_at   TIMESTAMPTZ DEFAULT now(),
  turn_start   INT,
  turn_end     INT
);

-- filter_result
CREATE TABLE IF NOT EXISTS filter_result (
  filter_id    BIGSERIAL PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_room(chat_room_id),
  message_id   UUID REFERENCES chat_message(message_id),
  stage        VARCHAR(16) CHECK (stage IN ('rule', 'ml')),
  action       VARCHAR(8)  CHECK (action IN ('PASS', 'DROP')),
  rule_name    VARCHAR(64),
  score        NUMERIC(5,3),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- prompt_built
CREATE TABLE IF NOT EXISTS prompt_built (
  trace_id      VARCHAR(64) PRIMARY KEY,
  built_prompt  TEXT,
  context_messages JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- llm_response
CREATE TABLE IF NOT EXISTS llm_response (
  trace_id        VARCHAR(64) PRIMARY KEY,
  model_name      VARCHAR(64),
  temperature     FLOAT,
  top_p           FLOAT,
  response_text   TEXT,
  response_tokens INT,
  latency_ms      INT,
  total_cost_usd  NUMERIC(14,6),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- token_usage
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    message_id UUID,
    prompt_tokens INT,
    completion_tokens INT,
    total_tokens INT,
    cost_usd NUMERIC(14, 6),
    energy_wh NUMERIC(14, 6),
    co2_g NUMERIC(14, 6),
    saved_tokens INT,
    saved_cost_usd NUMERIC(14, 6),
    saved_energy_wh NUMERIC(14, 6),
    saved_co2_g NUMERIC(14, 6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
