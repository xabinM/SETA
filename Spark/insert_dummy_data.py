# insert_dummy_data.py
import psycopg2
import uuid
import random
from datetime import datetime, timedelta, timezone

# --- Configuration ---
CONN_INFO = "dbname='testdb' user='testuser' host='localhost' password='mysecretpassword' port='5432'"
NUM_RECORDS = 20
USER_IDS = [str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())]
PROMPT_COST_PER_TOKEN = 0.0000005
COMPLETION_COST_PER_TOKEN = 0.0000015

# --- Main Logic ---
records_to_insert = []
print(f"{NUM_RECORDS}개의 더미 데이터를 생성합니다...")

now = datetime.now(timezone.utc)
end_minute = now.minute - (now.minute % 5)
five_min_end_time = now.replace(minute=end_minute, second=0, microsecond=0)
five_min_start_time = five_min_end_time - timedelta(minutes=5)
print(f"Spark가 처리할 시간대인 {five_min_start_time} ~ {five_min_end_time} (UTC)에 데이터를 생성합니다.")

for _ in range(NUM_RECORDS):
    prompt_tokens = random.randint(50, 1000)
    completion_tokens = random.randint(20, 500)
    saved_tokens = int((prompt_tokens + completion_tokens) * random.uniform(0.1, 0.5))
    total_tokens = prompt_tokens + completion_tokens
    cost_usd = (prompt_tokens * PROMPT_COST_PER_TOKEN) + (completion_tokens * COMPLETION_COST_PER_TOKEN)
    saved_cost_usd = saved_tokens * PROMPT_COST_PER_TOKEN
    energy_wh = total_tokens * 0.00015
    co2_g = energy_wh * 0.4
    saved_energy_wh = saved_tokens * 0.00015
    saved_co2_g = saved_energy_wh * 0.4
    created_at = five_min_start_time + timedelta(seconds=random.randint(0, 299))

    record = (
        str(uuid.uuid4()), random.choice(USER_IDS), str(uuid.uuid4()),
        prompt_tokens, completion_tokens, total_tokens,
        round(cost_usd, 6), round(energy_wh, 6), round(co2_g, 6),
        saved_tokens, round(saved_cost_usd, 6), round(saved_energy_wh, 6),
        round(saved_co2_g, 6), created_at
    )
    records_to_insert.append(record)

# --- Database Insertion ---
try:
    with psycopg2.connect(CONN_INFO) as conn:
        with conn.cursor() as cur:
            sql = """
            INSERT INTO token_usage (
                id, user_id, message_id, prompt_tokens, completion_tokens, total_tokens,
                cost_usd, energy_wh, co2_g, saved_tokens, saved_cost_usd,
                saved_energy_wh, saved_co2_g, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cur.executemany(sql, records_to_insert)
        print(f"{len(records_to_insert)}개의 더미 데이터 삽입 성공!")
except Exception as e:
    print(f"오류 발생: {e}")