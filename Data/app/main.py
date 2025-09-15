from fastapi import FastAPI
from elasticsearch import Elasticsearch
import os
from dotenv import load_dotenv

load_dotenv()   

app = FastAPI(
    title="SETA ML API",
    description="ML API for SETA",
    version="1.0.0"
)

es_client = None

@app.on_event("startup")
async def startup_event():
    global es_client
    es_url = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
    es_client = Elasticsearch([es_url])
    try:
        if es_client.ping():
            print("Connected to Elasticsearch")
        else:
            print("Could not connect to Elasticsearch")
    except Exception as e:
        print(f"Error connecting to Elasticsearch: {e}")

@app.get("/")
async def root():
    return {"message": "Welcome to the SETA ML API", "status": "running"}

@app.get("/health")
async def health_check():
    try:
        es_status = es_client.ping() if es_client else False
        return {
            "status": "healthy",
            "elasticsearch": "connected" if es_status else "disconnected",
            "version": "1.0.0"
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}