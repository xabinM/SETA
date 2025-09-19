from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

def get_db_url():
    """
    Jenkins credential 기반 Postgres 접속 문자열 생성.
    """
    host = os.environ["POSTGRES_HOST"]
    port = os.environ["POSTGRES_PORT"]
    user = os.environ["POSTGRES_USER"]
    password = os.environ["POSTGRES_PASSWORD"]
    db = os.environ["POSTGRES_DB"]
    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"

# 세션 팩토리
engine = create_engine(get_db_url(), echo=False, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_session():
    """
    DB 세션 생성기. with문과 함께 사용.
    """
    return SessionLocal()
