# app/main.py
from fastapi import FastAPI
from dotenv import load_dotenv

from app.utils.es import get_es, wait_for_es, es_health, close_es

load_dotenv()

app = FastAPI(
    title="SETA ML API",
    description="ML API for SETA",
    version="1.0.0",
)


@app.on_event("startup")
def on_startup():
    # ES 클라이언트 준비 및 간단한 대기(선택)
    get_es()
    wait_for_es(timeout_sec=10)  # ES가 늦게 뜨는 경우를 위한 짧은 재시도


@app.on_event("shutdown")
def on_shutdown():
    # 자원 정리 (필요 시)
    close_es()


@app.get("/")
def root():
    return {"message": "Welcome to the SETA ML API", "status": "running"}


@app.get("/health")
def health_check():
    es = es_health()
    status = "healthy" if es.get("connected") else "degraded"
    return {
        "status": status,
        "elasticsearch": "connected" if es.get("connected") else "disconnected",
        "es_cluster": es.get("cluster_name"),
        "es_version": es.get("version"),
        "api_version": "1.0.0",
        "error": es.get("error"),
    }
