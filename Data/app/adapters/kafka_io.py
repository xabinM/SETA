import json
from confluent_kafka import Consumer, Producer

def make_consumer(bootstrap: str, group: str, topics: list[str]) -> Consumer:
    """
    Kafka Consumer 생성.
    - bootstrap: Kafka broker 주소
    - group: consumer group id
    - topics: 구독할 토픽 리스트
    """
    c = Consumer({
        "bootstrap.servers": bootstrap,
        "group.id": group,
        "auto.offset.reset": "earliest",
        "enable.auto.commit": True
    })
    c.subscribe(topics)
    return c

def make_producer(bootstrap: str) -> Producer:
    """
    Kafka Producer 생성.
    - bootstrap: Kafka broker 주소
    """
    return Producer({"bootstrap.servers": bootstrap})

def publish(producer: Producer, topic: str, payload: dict):
    """
    Kafka 메시지 발행.
    - producer: Producer 객체
    - topic: 발행할 토픽명
    - payload: dict → JSON 직렬화 후 발행
    """
    producer.produce(topic, json.dumps(payload).encode("utf-8"))
    producer.flush(1.0)
