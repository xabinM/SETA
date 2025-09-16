# stream_filter_router.py
# Kafka -> Spark Structured Streaming
# 1) filter_word.json 기반으로 트리거 탐지/제거
# 2) 비트마스크 및 우선순위 결정
# 3) 남은 내용이 의미 없으면 response.json에서 neutral 톤 3문장 중 랜덤 반환
# 4) 남아있으면 그 남은 텍스트를 반환
#
# 실행 전 요구:
# - Kafka 접속 가능
# - filter_word.json / response.json 파일이 현재 작업 디렉터리에 존재
# - pyspark, org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0

import json
import uuid
import random
import os
import re
from typing import Dict, List, Tuple, Any

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StringType, IntegerType, StructType, StructField, LongType
)

# -----------------------
# Config
# -----------------------
KAFKA_BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
INPUT_TOPIC = os.environ.get("INPUT_TOPIC", "prompts-topic")
OUTPUT_TO_KAFKA = os.environ.get("OUTPUT_TO_KAFKA", "false").lower() == "true"
OUTPUT_TOPIC = os.environ.get("OUTPUT_TOPIC", "responses-topic")

FILTER_JSON_PATH = os.environ.get("FILTER_JSON_PATH", "filter_word.json")
RESPONSES_JSON_PATH = os.environ.get("RESPONSES_JSON_PATH", "response.json")

# -----------------------
# Load configs (driver)
# -----------------------
with open(FILTER_JSON_PATH, "r", encoding="utf-8") as f:
    FILTER_CFG = json.load(f)

with open(RESPONSES_JSON_PATH, "r", encoding="utf-8") as f:
    RESPONSES = json.load(f)

# Bit mask: LSB = goodbye
BIT_INDEX = {
    "goodbye": 0,
    "apology": 1,
    "gratitude": 2,
    "greeting": 3,
    "call_only": 4,
    "reaction_only": 5,
    "no_meaning": 6,
}

# Priority config. Must be same filter_word.json's priority
CATEGORY_PRIORITY = {
    f["category"]: f.get("priority", 9999)
    for f in FILTER_CFG.get("filters", [])
}

# -----------------------
# Regex builders (driver)
# -----------------------
# \s+ and re.escape
def _escape_spaces_to_ws_regex(s: str) -> str:
    parts = s.split()
    parts = [re.escape(p) for p in parts]
    return r"\s+".join(parts)

# Build regex group for allowed trailing phrases
def _build_trailer_group(trailers: List[str]) -> str:
    if not trailers:
        return r""
    escaped = sorted([re.escape(t) for t in trailers], key=len, reverse=True)
    return r"(?:\s*(?:" + "|".join(escaped) + r"))*"

# Negative lookbehind to prevent matching inside words
def _left_boundary() -> str:
    return r"(?<![0-9A-Za-z가-힣])"

def compile_filters(filter_cfg: Dict[str, Any]) -> Dict[str, List[re.Pattern]]:
    compiled: Dict[str, List[re.Pattern]] = {}
    for f in filter_cfg.get("filters", []):
        cat = f.get("category")
        strict = f.get("strict", {})
        pats: List[re.Pattern] = []
        if cat == "call_only":
            bases = strict.get("base", [])
            suf = strict.get("allow_suffix", [])
            trailers = strict.get("allowed_trailers", [])
            trail = _build_trailer_group(trailers)
            left = _left_boundary()
            suf_alt = r"(?:" + "|".join([re.escape(s) for s in suf]) + r")?" if suf else r""
            for base in bases:
                b = _escape_spaces_to_ws_regex(base)
                rx = left + "(" + b + ")" + suf_alt + trail + r"(?![0-9A-Za-z가-힣])"
                pats.append(re.compile(rx, re.IGNORECASE | re.UNICODE))
        else:
            exact = strict.get("exact", [])
            trailers = strict.get("allowed_trailers", [])
            trail = _build_trailer_group(trailers)
            left = _left_boundary()
            for phrase in exact:
                p = _escape_spaces_to_ws_regex(phrase)
                rx = left + "(" + p + ")" + trail + r"(?![0-9A-Za-z가-힣])"
                pats.append(re.compile(rx, re.IGNORECASE | re.UNICODE))
        compiled[cat] = pats
    return compiled

COMPILED = compile_filters(FILTER_CFG)

# -----------------------
# Core filtering (driver)
# -----------------------
MEANINGFUL_RE = re.compile(r"[0-9A-Za-z가-힣]")

# remove spans from text
def remove_spans(text: str, spans: List[Tuple[int, int]]) -> str:
    if not spans:
        return text
    out = []
    prev = 0
    for s, e in spans:
        out.append(text[prev:s])
        prev = e
    out.append(text[prev:])
    result = "".join(out)
    result = re.sub(r"[ \t]{2,}", " ", result)
    result = re.sub(r"\s+\n", "\n", result)
    result = re.sub(r"\n\s+", "\n", result)
    return result.strip()

# Detect and remove all category patterns
def filter_once(text: str) -> Tuple[str, int, List[Tuple[int,int,str]]]:
    """
    텍스트에서 모든 카테고리 패턴을 탐지하여 제거.
    반환:
      - filtered_text
      - bitmask (LSB=goodbye)
      - matches: [(start,end,category), ...] (제거된 span)
    """
    matches = []
    for cat, patterns in COMPILED.items():
        for pat in patterns:
            for m in pat.finditer(text):
                matches.append((m.start(), m.end(), cat))

    def sk(m):
        s, e, cat = m
        return (-(e - s), s, CATEGORY_PRIORITY.get(cat, 9999))
    matches.sort(key=sk)

    selected = []
    occupied: List[Tuple[int,int]] = []
    def overlaps(a, b): return not (a[1] <= b[0] or b[1] <= a[0])
    for m in matches:
        span = (m[0], m[1])
        if any(overlaps(span, o) for o in occupied):
            continue
        selected.append(m)
        occupied.append(span)
    selected.sort(key=lambda x: x[0])

    filtered_text = remove_spans(text, [(s,e) for s,e,_ in selected])

    mask = 0
    for _, _, cat in selected:
        bit = BIT_INDEX.get(cat)
        if bit is not None:
            mask |= (1 << bit)

    return filtered_text, mask, selected

def top_category_from_mask(mask: int) -> str:
    order = ["goodbye","apology","gratitude","greeting","call_only","reaction_only","no_meaning"]
    for i, cat in enumerate(order):
        if mask & (1 << i):
            return cat
    return ""

def choose_auto_response(category: str, tone: str = "neutral") -> str:
    pool = RESPONSES.get(category, {}).get(tone, [])
    if not pool:
        for alt in ["neutral","friendly","polite","cheerful","calm","cynical"]:
            pool = RESPONSES.get(category, {}).get(alt, [])
            if pool:
                break
    return random.choice(pool) if pool else ""

def route_message(text: str) -> Tuple[str, str, int, str]:
    """
    입력 텍스트를 필터링하고 최종 라우팅 결과를 생성.
    반환:
      final_text, top_category, category_mask, mode
      - mode: "auto" (자동응답) | "pass" (남은 텍스트 전달)
    """
    if text is None:
        return ("", "", 0, "auto")

    filtered, mask, _ = filter_once(text)

    text = re.sub(r"ㅋ{2,}", "ㅋㅋ", text)

    if filtered and MEANINGFUL_RE.search(filtered):
        return (filtered.strip(), "", mask, "pass")

    top_cat = top_category_from_mask(mask)
    if top_cat:
        resp = choose_auto_response(top_cat, "neutral")
        return (resp, top_cat, mask, "auto")

    resp = choose_auto_response("no_meaning", "neutral")
    return (resp, "no_meaning", (1 << BIT_INDEX["no_meaning"]), "auto")

# -----------------------
# Spark UDF
# -----------------------
def make_udf_return():
    schema = StructType([
        StructField("final_text", StringType(), True),
        StructField("top_category", StringType(), True),
        StructField("category_mask", IntegerType(), True),
        StructField("mode", StringType(), True),
    ])
    @F.udf(returnType=schema)
    def udf_apply(text: str):
        ft, tc, mask, mode = route_message(text)
        return (ft, tc, mask, mode)
    return udf_apply

apply_udf = make_udf_return()

# -----------------------
# Spark app
# -----------------------
spark = SparkSession.builder \
    .appName("SETA - Save Earth Through AI") \
    .master("local[*]") \
    .config("spark.sql.shuffle.partitions", "4") \
    .config("spark.ui.showConsoleProgress", "true") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

kafka_schema = StructType([
    StructField("trace_id", StringType(), True),
    StructField("room_id", StringType(), True),
    StructField("message_id", StringType(), True),
    StructField("user_id", StringType(), True),
    StructField("timestamp", LongType(), True), # Unix epoch milliseconds는 Long 타입이 적합
    StructField("text", StringType(), True),
    StructField("schema_version", StringType(), True)
])

# Kafka source
kafka_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS) \
    .option("subscribe", INPUT_TOPIC) \
    .load()

parsed_stream = kafka_stream.select(
    F.from_json(F.col("value").cast("string"), kafka_schema).alias("data")
).select("data.*")

# apply filtering + routing
applied = parsed_stream.withColumn("r", apply_udf(F.col("text"))) \
    .select(
        F.col("trace_id"),
        F.col("room_id"),
        F.col("message_id"),
        F.col("user_id"),
        F.col("timestamp"),
        F.col("text"),
        F.col("schema_version"),
        F.col("r.final_text").alias("final_text"),
        F.col("r.top_category").alias("top_category"),
        F.col("r.category_mask").alias("category_mask"),
        F.col("r.mode").alias("mode")
    )

# console sink (Demo)
console_q = applied.writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", "false") \
    .start()

# (선택) Kafka sink
if OUTPUT_TO_KAFKA:
    # 최종 결과를 JSON 형태로 다시 Kafka에 전송
    kafka_out = applied.select(
        F.to_json(F.struct("*")).alias("value")
    )
    kafka_q = kafka_out.writeStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS) \
        .option("topic", OUTPUT_TOPIC) \
        .option("checkpointLocation", "./chkpt-filter-router") \
        .start()

console_q.awaitTermination()