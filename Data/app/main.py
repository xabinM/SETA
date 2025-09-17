from fastapi import FastAPI
from dotenv import load_dotenv

from app.utils.es import get_es, wait_for_es, es_health, close_es
from app.router.filter_router import router as filter_router
from app.router.embed_router import router as embed_router
from app.router.summarize_router import router as summarize_router

load_dotenv()

app = FastAPI(
    title="SETA ML API",
    description="ML API for SETA",
    version="1.0.0",
)

@app.on_event("startup")
def on_startup():
    get_es()
    wait_for_es(timeout_sec=10)

@app.on_event("shutdown")
def on_shutdown():
    close_es()

app.include_router(filter_router)
app.include_router(embed_router)
app.include_router(summarize_router)

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
v