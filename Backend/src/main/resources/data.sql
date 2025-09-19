BEGIN;

-- users
INSERT INTO users (username, password, name)
VALUES
('alice', 'pw1234', 'Alice Kim'),
('bob', 'pw1234', 'Bob Lee'),
('charlie', 'pw1234', 'Charlie Park')
ON CONFLICT (username) DO NOTHING;

-- user_setting
INSERT INTO user_setting (user_setting_id, user_id, call_me, role_description, preferred_tone, traits, additional_context)
VALUES
(gen_random_uuid(), (SELECT user_id FROM users WHERE username='alice'), 'Ally', 'Likes friendly talk', 'FRIENDLY', 'Positive, active', 'Interested in environment'),
(gen_random_uuid(), (SELECT user_id FROM users WHERE username='bob'), 'Bob', 'Prefers concise answers', 'NEUTRAL', 'Analytical', 'Uses financial data'),
(gen_random_uuid(), (SELECT user_id FROM users WHERE username='charlie'), 'Charlie', 'Calm style', 'CALM', 'Quiet', 'Interested in AI');

-- chat_room
INSERT INTO chat_room (chat_room_id, owner_id, title)
VALUES
(gen_random_uuid(), (SELECT user_id FROM users WHERE username='alice'), 'Alice first room'),
(gen_random_uuid(), (SELECT user_id FROM users WHERE username='bob'), 'Bob test room'),
(gen_random_uuid(), (SELECT user_id FROM users WHERE username='charlie'), 'Charlie summary room')
ON CONFLICT (chat_room_id) DO NOTHING;

-- chat_message
INSERT INTO chat_message (message_id, chat_room_id, author_id, role, content, turn_index, created_at)
VALUES
(gen_random_uuid(), (SELECT chat_room_id FROM chat_room LIMIT 1), (SELECT user_id FROM users WHERE username='bob'), 'user', 'Hello!', 1, now()),
(gen_random_uuid(), (SELECT chat_room_id FROM chat_room LIMIT 1), (SELECT user_id FROM users WHERE username='charlie'), 'assistant', 'Hello Alice!', 1, now()),
(gen_random_uuid(), (SELECT chat_room_id FROM chat_room OFFSET 1 LIMIT 1), (SELECT user_id FROM users WHERE username='charlie'), 'user', 'Test message', 1, now())
ON CONFLICT (message_id) DO NOTHING;

-- room_summary_state
INSERT INTO room_summary_state (chat_room_id, last_turn_end, last_summary_at)
VALUES
((SELECT chat_room_id FROM chat_room LIMIT 1), 1, now()),
((SELECT chat_room_id FROM chat_room OFFSET 1 LIMIT 1), 2, now())
ON CONFLICT (chat_room_id) DO NOTHING;

-- user_memory_embedding
INSERT INTO user_memory_embedding
(embedding_id, user_id, chat_room_id, source_type, source_id, content, embedding, turn_start, turn_end)
VALUES
(
  gen_random_uuid(),
  (SELECT user_id FROM users WHERE username='alice'),
  (SELECT chat_room_id FROM chat_room LIMIT 1),
  'message',
  gen_random_uuid(),
  'Alice memory',
  (SELECT array_agg(0.0)::vector FROM generate_series(1,1536)),
  1,
  2
),
(
  gen_random_uuid(),
  (SELECT user_id FROM users WHERE username='bob'),
  (SELECT chat_room_id FROM chat_room OFFSET 1 LIMIT 1),
  'summary',
  gen_random_uuid(),
  'Bob summary content',
  (SELECT array_agg(0.0)::vector FROM generate_series(1,1536)),
  1,
  3
)
ON CONFLICT (embedding_id) DO NOTHING;

-- filter_result
INSERT INTO filter_result (chat_room_id, message_id, stage, action, rule_name, score)
VALUES
((SELECT chat_room_id FROM chat_room LIMIT 1), (SELECT message_id FROM chat_message LIMIT 1), 'rule', 'PASS', 'length_check', 0.95)
ON CONFLICT (filter_id) DO NOTHING;

-- prompt_built
INSERT INTO prompt_built (trace_id, built_prompt, context_messages)
VALUES
('trace-001', 'User: Hi?\nAssistant: Hello!', '{"messages":[{"role":"user","content":"Hi?"}]}')
ON CONFLICT (trace_id) DO NOTHING;

-- llm_response
INSERT INTO llm_response (trace_id, model_name, temperature, top_p, response_text, response_tokens, latency_ms, total_cost_usd)
VALUES
('trace-001', 'gpt-4o', 0.7, 0.9, 'Hello! How can I help you?', 30, 1500, 0.0020)
ON CONFLICT (trace_id) DO NOTHING;

-- token_usage
INSERT INTO token_usage (
    id, message_id, prompt_tokens, completion_tokens, total_tokens,
    cost_usd, energy_wh, co2_g,
    saved_tokens, saved_cost_usd, saved_energy_wh, saved_co2_g
)
VALUES
(gen_random_uuid(), (SELECT message_id FROM chat_message LIMIT 1),
 50, 20, 70, 0.0010, 0.5, 0.2, 10, 0.0002, 0.05, 0.01)
ON CONFLICT (id) DO NOTHING;

-- message_attachment
INSERT INTO message_attachment (attachment_id, message_id, type, url, meta)
VALUES
(gen_random_uuid(), (SELECT message_id FROM chat_message LIMIT 1), 'image', 'https://example.com/test.png', '{"width":640,"height":480}')
ON CONFLICT (attachment_id) DO NOTHING;

-- error_log
INSERT INTO error_log (trace_id, error_type, error_message, stack_trace)
VALUES
('trace-error-1', 'KafkaError', 'Message send failed', 'stacktrace...')
ON CONFLICT (trace_id) DO NOTHING;

-- user_saved_token_daily
INSERT INTO user_saved_token_daily (user_id, window_start, request_count, saved_tokens, token_sum, cost_sum_usd)
VALUES
((SELECT user_id FROM users WHERE username='alice'), now() - interval '1 day', 15, 60, 300, 0.0345),
((SELECT user_id FROM users WHERE username='alice'), now(), 20, 80, 400, 0.0456),
((SELECT user_id FROM users WHERE username='bob'), now(), 10, 40, 200, 0.0222),
((SELECT user_id FROM users WHERE username='charlie'), now() - interval '2 days', 8, 25, 180, 0.0150)
ON CONFLICT (user_id, window_start) DO NOTHING;

-- global_saved_token_daily
INSERT INTO global_saved_token_daily (window_start, request_count, saved_tokens, token_sum, cost_sum_usd)
VALUES
(now() - interval '2 days', 90, 360, 1800, 0.2001),
(now() - interval '1 day', 100, 400, 2000, 0.2234),
(now(), 130, 520, 2600, 0.2789)
ON CONFLICT (window_start) DO NOTHING;

-- user_saved_token_total
INSERT INTO user_saved_token_total (user_id, stat_date, request_count, saved_tokens, token_sum, cost_sum_usd)
VALUES
((SELECT user_id FROM users WHERE username='alice'), now()::date, 35, 140, 700, 0.0801),
((SELECT user_id FROM users WHERE username='bob'), now()::date, 10, 40, 200, 0.0219),
((SELECT user_id FROM users WHERE username='charlie'), now()::date - interval '1 day', 12, 50, 250, 0.0300)
ON CONFLICT (user_id, stat_date) DO NOTHING;

-- global_saved_token_total
INSERT INTO global_saved_token_total (stat_date, request_count, saved_tokens, token_sum, cost_sum_usd)
VALUES
(now()::date - interval '10 day', 180, 720, 3600, 0.3600),
(now()::date - interval '7 day', 200, 800, 4000, 0.4021)
ON CONFLICT (stat_date) DO NOTHING;

COMMIT;
