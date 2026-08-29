from sqlalchemy import text
from app.database.database import engine, Base
import app.models  # registers all models


def run_migrations():
    """
    Ensures all database tables and new columns are synchronized in PostgreSQL/SQLite.
    """
    with engine.connect() as conn:
        # Check and add columns safely if they don't exist
        migration_statements = [
            # users
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();",
            # customers
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT 'New';",
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS churn_risk VARCHAR(30) DEFAULT 'Low Risk';",
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS churn_probability FLOAT DEFAULT 0.0;",
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();",
            # products
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price FLOAT;",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();",
            # sales
            "ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'CARD';",
            "ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);",
            "ALTER TABLE sales ADD COLUMN IF NOT EXISTS import_hash VARCHAR(64);",
            # inventory
            "ALTER TABLE inventory ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Main Warehouse';",
        ]

        for stmt in migration_statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                print(f"Migration notice: {e}")

    # Create any missing new tables (forecast_results, customer_segments, churn_predictions, product_recommendations, anomalies, alerts, reports)
    Base.metadata.create_all(bind=engine)
    print("Database migrations and table synchronization complete.")


if __name__ == "__main__":
    run_migrations()
