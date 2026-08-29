from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database.database import Base


class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    forecast_date = Column(String(50), nullable=False, index=True)
    predicted_revenue = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    trend = Column(String(50), nullable=True)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CustomerSegment(Base):
    __tablename__ = "customer_segments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    recency = Column(Integer, nullable=False)
    frequency = Column(Integer, nullable=False)
    monetary = Column(Float, nullable=False)
    segment_name = Column(String(100), nullable=False, index=True)
    silhouette_score = Column(Float, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ChurnPrediction(Base):
    __tablename__ = "churn_predictions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    churn_probability = Column(Float, nullable=False)
    churn_risk = Column(String(50), nullable=False, index=True)
    key_factors = Column(JSON, nullable=True)
    accuracy = Column(Float, nullable=True)
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    predicted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ProductRecommendation(Base):
    __tablename__ = "product_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    recommended_product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    recommendation_score = Column(Float, nullable=False)
    reason = Column(String(255), nullable=True)
    precision_at_k = Column(Float, nullable=True)
    recall_at_k = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_type = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)  # 'SALES' or 'INVENTORY'
    entity_id = Column(String(100), nullable=True)
    date = Column(String(50), nullable=False, index=True)
    actual_value = Column(Float, nullable=False)
    expected_value = Column(Float, nullable=False)
    deviation_percentage = Column(Float, nullable=False)
    severity = Column(String(50), nullable=False, default="WARNING")
    description = Column(Text, nullable=False)
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False, index=True)  # 'LOW_STOCK', 'CHURN_RISK', 'SALES_DROP', etc.
    severity = Column(String(30), nullable=False, default="MEDIUM")  # 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    report_type = Column(String(100), nullable=False, default="EXECUTIVE_SUMMARY")
    summary = Column(Text, nullable=False)
    metrics_snapshot = Column(JSON, nullable=True)
    ai_insights = Column(JSON, nullable=True)
    created_by = Column(String(100), nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
