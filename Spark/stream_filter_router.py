# stream_filter_router.py

from array import ArrayType
import json
import os
import re
from typing import Dict, List, Tuple, Any

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StringType, IntegerType, StructType, StructField, LongType, ArrayType
)
from opentelemetry import trace
from opentelemetry.propagate import extract
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.resources import Resource

# -----------------------
# Config
# -----------------------
KAFKA_BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
INPUT_TOPIC = os.environ.get("INPUT_TOPIC", "chat.raw.request.v1")
OUTPUT_TO_KAFKA = os.environ.get("OUTPUT_TO_KAFKA", "false").lower() == "true"
OUTPUT_TOPIC = os.environ.get("OUTPUT_TOPIC", "chat.raw.filtered.v1")
FILTER_JSON_PATH = os.environ.get("FILTER_JSON_PATH", "filter_word.json")
JAEGER_HOST = os.environ.get("JAEGER_AGENT_HOST", "localhost")
JAEGER_PORT = int(os.environ.get("JAEGER_AGENT_PORT", 6831))

# -----------------------
# Load configs (driver)
# -----------------------
with open(FILTER_JSON_PATH, "r", encoding="utf-8") as f:
    FILTER_CFG = json.load(f)

# -----------------------
# OpenTelemetry
# -----------------------
tracer = None
def get_tracer():
    global tracer
    if tracer is None:
        provider = TracerProvider(
            resource=Resource.create({"service.name": "backend"})
        )
        jaeger_exporter = JaegerExporter(
            agent_host_name=JAEGER_HOST,
            agent_port=JAEGER_PORT,
        )
        provider.add_span_processor(SimpleSpanProcessor(jaeger_exporter))
        trace.set_tracer_provider(provider)
        tracer = trace.get_tracer(__name__)
    return tracer

BIT_INDEX = {"goodbye": 0, "apology": 1, "thank": 2, "greeting": 3, "call_only": 4, "reaction_only": 5, "no_meaning": 6}
CATEGORY_PRIORITY = {f["category"]: f.get("priority", 9999) for f in FILTER_CFG.get("filters", [])}
MEANINGFUL_RE = re.compile(r"[0-9A-Za-z가-힣]")

def _escape_spaces_to_ws_regex(s: str) -> str:
    parts = s.split()
    parts = [re.escape(p) for p in parts]
    return r"\s+".join(parts)

def _build_trailer_group(trailers: List[str]) -> str:
    if not trailers:
        return r""
    escaped = sorted([re.escape(t) for t in trailers], key=len, reverse=True)
    return r"(?:\s*(?:" + "|".join(escaped) + r"))*"

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

def filter_once(text: str) -> Tuple[str, int, List[Tuple[str, str]]]:
    raw_matches = []
    for cat, patterns in COMPILED.items():
        for pat in patterns:
            for m in pat.finditer(text):
                raw_matches.append((m.start(), m.end(), cat, m.group(1).strip()))
    
    raw_matches.sort(key=lambda m: (-(m[1] - m[0]), m[0], CATEGORY_PRIORITY.get(m[2], 9999)))
    
    selected_matches, occupied = [], []
    def overlaps(a, b): return not (a[1] <= b[0] or b[1] <= a[0])
    for m in raw_matches:
        span = (m[0], m[1])
        if any(overlaps(span, o) for o in occupied): continue
        selected_matches.append(m)
        occupied.append(span)

    selected_matches.sort(key=lambda x: x[0])
    
    filtered_text = remove_spans(text, [(s, e) for s, e, _, _ in selected_matches])
    matched_word_details = [(word, cat) for _, _, cat, word in selected_matches]
    
    mask = 0
    for _, _, cat, _ in selected_matches:
        bit = BIT_INDEX.get(cat)
        if bit is not None: mask |= (1 << bit)
        
    return filtered_text, mask, matched_word_details

def top_category_from_mask(mask: int) -> str:
    order = ["goodbye","apology","thank","greeting","call_only","reaction_only","no_meaning"]
    for i, cat in enumerate(order):
        if mask & (1 << i):
            return cat
    return ""

def route_message(text: str) -> Tuple[str, str, int, str, List[Tuple[str, str]]]:
    if text is None: return ("", "", 0, "auto", [])
    filtered, mask, matched_word_details = filter_once(text)
    if filtered and MEANINGFUL_RE.search(filtered):
        final_text = re.sub(r"ㅋ{2,}", "ㅋㅋ", filtered)
        return (final_text.strip(), "", mask, "pass", matched_word_details)
    top_cat = top_category_from_mask(mask)
    if not top_cat:
        top_cat = "no_meaning"
        mask |= (1 << BIT_INDEX["no_meaning"])
    return ("", top_cat, mask, "auto", matched_word_details)

# -----------------------
# Spark UDF
# -----------------------
udf_schema = StructType([
    StructField("final_text", StringType(), True),
    StructField("top_category", StringType(), True),
    StructField("category_mask", IntegerType(), True),
    StructField("mode", StringType(), True),
    StructField("filtered_words_details", ArrayType(ArrayType(StringType())), False),
    StructField("outgoing_headers", ArrayType(
        StructType([
            StructField("key", StringType(), False),
            StructField("value", StringType(), True)
        ])
    ))
])

@F.udf(returnType=udf_schema)
def apply_filter_and_trace_udf(trace_id, room_id, message_id, user_id, timestamp, text, schema_version):
    local_tracer = get_tracer()
    carrier = {'traceparent': trace_id} if trace_id else {}
    ctx = extract(carrier)

    with local_tracer.start_as_current_span("pyspark-filter-and-route", context=ctx) as span:
        
        final_text, top_category, category_mask, mode, matched_word_details = route_message(text)
        words = [item[0] for item in matched_word_details]
        categories = [item[1] for item in matched_word_details]
        filtered_words_details = [words, categories]
        
        input_data = {
            "trace_id": trace_id, "room_id": room_id, "message_id": message_id,
            "user_id": user_id, "timestamp": timestamp, "text": text,
            "schema_version": schema_version
        }
        output_data = {
            "final_text": final_text, "top_category": top_category,
            "category_mask": category_mask, "mode": mode,
            "filtered_words": [item[0] for item in matched_word_details]
        }

        span.set_attribute("input.data.json", json.dumps(input_data, ensure_ascii=False))
        span.set_attribute("output.data.json", json.dumps(output_data, ensure_ascii=False))
        span.set_attribute("correlation.trace_id", trace_id if trace_id else "N/A")
        span.set_attribute("filter.word_count", len(words))

        outgoing_headers = [{"key": "trace_id", "value": trace_id if trace_id else ""}]
        
        return (final_text, top_category, category_mask, mode, filtered_words_details, outgoing_headers)

# -----------------------
# Spark app
# -----------------------
spark = SparkSession.builder \
    .appName("SETA - Save Earth Through AI") \
    .config("spark.sql.shuffle.partitions", "4") \
    .config("spark.ui.showConsoleProgress", "true") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

kafka_schema = StructType([
    StructField("trace_id", StringType(), True),
    StructField("room_id", StringType(), True),
    StructField("message_id", StringType(), True),
    StructField("user_id", StringType(), True),
    StructField("timestamp", LongType(), True),
    StructField("text", StringType(), True),
    StructField("schema_version", StringType(), True)
])

kafka_stream = spark.readStream.format("kafka").option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS).option("subscribe", INPUT_TOPIC).load()
parsed_stream = kafka_stream.select(F.from_json(F.decode(F.col("value"), "UTF-8"), kafka_schema).alias("data")).select("data.*")
applied = parsed_stream.withColumn("result", apply_filter_and_trace_udf(
    F.col("trace_id"), F.col("room_id"), F.col("message_id"),
    F.col("user_id"), F.col("timestamp"), F.col("text"), F.col("schema_version")
))

final_df = applied.select(
    "trace_id", "room_id", "message_id", "user_id", "timestamp", "text", "schema_version",
    F.col("result.final_text").alias("final_text"),
    F.col("result.top_category").alias("top_category"),
    F.col("result.category_mask").alias("category_mask"),
    F.col("result.mode").alias("mode"),
    F.col("result.filtered_words_details").alias("filtered_words_details"),
    F.col("result.outgoing_headers").alias("headers")
)

console_q = final_df.writeStream.outputMode("append").format("console").option("truncate", "false").start()

if OUTPUT_TO_KAFKA:
    kafka_out = final_df.select(
        F.to_json(F.struct(*[c for c in final_df.columns if c != 'headers'])).alias("value"),
        F.col("headers").cast("array<struct<key:string,value:binary>>").alias("headers")
    )
    kafka_q = kafka_out.writeStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS) \
        .option("topic", OUTPUT_TOPIC) \
        .option("checkpointLocation", "/tmp/chkpt-filter-router-v1") \
        .start()

spark.streams.awaitAnyTermination()