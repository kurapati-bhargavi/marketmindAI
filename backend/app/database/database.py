import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def create_db_engine():
    if DATABASE_URL and DATABASE_URL.strip():
        try:
            connect_args = {"connect_timeout": 3} if "postgres" in DATABASE_URL else {}
            test_engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
            with test_engine.connect():
                pass
            print(f"[Database] Successfully connected to PostgreSQL: {DATABASE_URL.split('@')[-1]}")
            return test_engine
        except Exception as e:
            print(f"[Database Warning] PostgreSQL connection failed: {e}\n[Database] Seamlessly falling back to local SQLite.")

    
    # Fallback SQLite engine
    sqlite_url = "sqlite:///./marketmind.db"
    print(f"[Database] Using SQLite database: {sqlite_url}")
    return create_engine(sqlite_url, connect_args={"check_same_thread": False}, echo=False)

engine = create_db_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()