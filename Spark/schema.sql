-- schema.sql

-- 1. Source Table
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY,
    user_id UUID,
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

-- 2. Aggregation Tables
CREATE TABLE IF NOT EXISTS user_saved_token_daily (
    user_id TEXT,
    window_start TIMESTAMPTZ,
    request_count BIGINT,
    saved_tokens BIGINT,
    token_sum BIGINT,
    cost_sum_usd NUMERIC(14, 6),
    PRIMARY KEY (user_id, window_start)
);

CREATE TABLE IF NOT EXISTS user_saved_token_total (
    user_id TEXT,
    stat_time TIMESTAMPTZ,
    request_count BIGINT,
    saved_tokens BIGINT,
    token_sum BIGINT,
    cost_sum_usd NUMERIC(14, 6),
    PRIMARY KEY (user_id, stat_time)
);

CREATE TABLE IF NOT EXISTS global_saved_token_daily (
    window_start TIMESTAMPTZ PRIMARY KEY,
    request_count BIGINT,
    saved_tokens BIGINT,
    token_sum BIGINT,
    cost_sum_usd NUMERIC(14, 6)
);

CREATE TABLE IF NOT EXISTS global_saved_token_total (
    stat_time TIMESTAMPTZ PRIMARY KEY,
    request_count BIGINT,
    saved_tokens BIGINT,
    token_sum BIGINT,
    cost_sum_usd NUMERIC(14, 6)
);