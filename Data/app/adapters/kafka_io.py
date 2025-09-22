import os
import json
from typing import Any, Dict, Iterable, List, Optional, Tuple
from confluent_kafka import Consumer, Producer, KafkaException

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

def make_producer(bootstrap: Optional[str] = None) -> Producer:
    """
    Kafka Producer 생성
    """
    return Producer({"bootstrap.servers": bootstrap or KAFKA_BOOTSTRAP})

def make_consumer(
    topics: Iterable[str],
    group_id: str,
    bootstrap: Optional[str] = None,
    enable_autocommit: bool = True,
    auto_offset_reset: str = "earliest",
    extra_config: Optional[Dict[str, Any]] = None,
) -> Consumer:
    """
    지정된 토픽을 구독하는 Kafka Consumer 생성
    """
    cfg = {
        "bootstrap.servers": bootstrap or KAFKA_BOOTSTRAP,
        "group.id": group_id,
        "auto.offset.reset": auto_offset_reset,
        "enable.auto.commit": enable_autocommit,
    }
    if extra_config:
        cfg.update(extra_config)
    c = Consumer(cfg)
    c.subscribe(list(topics))
    return c

def publish(
    producer: Producer,
    topic: str,
    key: Optional[str] = None,
    value: Optional[Dict[str, Any]] = None,
    headers: Optional[List[Tuple[str, bytes]]] = None,
) -> None:
    """
    Kafka 메시지 발행 (key, value, headers 지원)
    """
    payload = json.dumps(value or {}, ensure_ascii=False).encode("utf-8")
    try:
        producer.produce(
            topic,
            key=(key.encode() if isinstance(key, str) else key),
            value=payload,
            headers=headers,
        )
        producer.flush(1.0)
    except BufferError:
        # 버퍼 꽉 찼으면 flush 후 재시도
        producer.poll(0)
        producer.produce(
            topic,
            key=(key.encode() if isinstance(key, str) else key),
            value=payload,
            headers=headers,
        )
        producer.flush(1.0)
    except KafkaException as e:
        raise e

def read_headers(msg) -> Dict[str, bytes]:
    """
    Kafka 메시지의 headers를 dict로 변환
    """
    hdrs = {}
    if msg is not None and msg.headers():
        for k, v in msg.headers():
            if k is not None:
                hdrs[k] = v
    return hdrs
