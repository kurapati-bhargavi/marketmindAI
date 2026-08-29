from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.database import Base, engine
import app.models  # Ensure all models are registered in Base metadata

# Import all routers
from app.routes.auth import router as auth_router
from app.routes.users import router as user_router
from app.routes.customers import router as customer_router
from app.routes.products import router as product_router
from app.routes.inventory import router as inventory_router
from app.routes.sales import router as sales_router
from app.routes.invoices import router as invoice_router
from app.routes.sales_upload import router as sales_upload_router
from app.routes.analytics import router as analytics_router
from app.routes.ml_routes import router as ml_router
from app.routes.reports import router as reports_router

app = FastAPI(
    title="MarketMind AI",
    description="Small Business Sales Intelligence Platform API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all database tables
Base.metadata.create_all(bind=engine)

# Register Routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(customer_router)
app.include_router(product_router)
app.include_router(inventory_router)
app.include_router(sales_router)
app.include_router(invoices_router := invoice_router)
app.include_router(sales_upload_router)
app.include_router(analytics_router)
app.include_router(ml_router)
app.include_router(reports_router)


@app.get("/")
def root():
    return {
        "platform": "MarketMind AI",
        "description": "Small Business Sales Intelligence Platform",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }


@app.get("/database-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "database": "connected",
        "test_result": value
    }