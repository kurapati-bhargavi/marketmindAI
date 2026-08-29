from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class ForecastPoint(BaseModel):
    date: str
    predicted_revenue: float
    lower_bound: float
    upper_bound: float
    predicted_orders: Optional[int] = None


class ForecastMetrics(BaseModel):
    mae: float
    rmse: float
    r2_score: float
    method: str
    trend: str
    growth_rate_pct: float


class ForecastResponse(BaseModel):
    success: bool
    historical: list[dict[str, Any]]
    forecast: list[ForecastPoint]
    metrics: ForecastMetrics
    business_interpretation: str


class CustomerSegmentSummary(BaseModel):
    segment_name: str
    customer_count: int
    avg_recency_days: float
    avg_order_frequency: float
    avg_monetary_value: float
    percentage_of_base: float
    recommended_strategy: str


class CustomerSegmentDetail(BaseModel):
    customer_id: int
    customer_name: str
    email: Optional[str] = None
    recency_days: int
    frequency_orders: int
    monetary_total: float
    avg_order_value: float
    segment_name: str


class SegmentationResponse(BaseModel):
    success: bool
    silhouette_score: float
    optimal_clusters: int
    segment_summaries: list[CustomerSegmentSummary]
    customers: list[CustomerSegmentDetail]
    interpretation: str


class ChurnCustomerDetail(BaseModel):
    customer_id: int
    customer_name: str
    email: Optional[str] = None
    last_purchase_date: Optional[str] = None
    days_since_last_purchase: int
    total_orders: int
    total_revenue: float
    churn_probability: float
    churn_risk: str  # "High Risk", "Medium Risk", "Low Risk"
    top_factors: list[str]
    retention_action: str


class ChurnMetrics(BaseModel):
    accuracy: float
    precision_score: float
    recall_score: float
    f1_score: float
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int


class ChurnResponse(BaseModel):
    success: bool
    metrics: ChurnMetrics
    predictions: list[ChurnCustomerDetail]
    summary_insights: list[str]


class ProductRecommendationItem(BaseModel):
    product_id: int
    product_name: str
    category: Optional[str] = None
    price: float
    recommendation_score: float
    reason: str


class CustomerRecommendationDetail(BaseModel):
    customer_id: int
    customer_name: str
    purchased_products: list[str]
    recommendations: list[ProductRecommendationItem]


class RecommendationMetrics(BaseModel):
    precision_at_k: float
    recall_at_k: float
    k_value: int
    model_type: str


class RecommendationResponse(BaseModel):
    success: bool
    metrics: RecommendationMetrics
    customer_recommendations: list[CustomerRecommendationDetail]
    frequently_bought_together: list[dict[str, Any]]


class AnomalyItem(BaseModel):
    id: Optional[int] = None
    date: str
    anomaly_type: str
    entity_type: str  # 'SALES' or 'INVENTORY'
    entity_name: str
    actual_value: float
    expected_value: float
    deviation_percentage: float
    severity: str  # 'CRITICAL', 'WARNING', 'INFO'
    description: str


class AnomalyResponse(BaseModel):
    success: bool
    sales_anomalies: list[AnomalyItem]
    inventory_anomalies: list[AnomalyItem]
    detection_method: str
    total_anomalies: int


class AlertItem(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    is_read: bool
    is_resolved: bool
    created_at: datetime


class AIInsightItem(BaseModel):
    category: str  # 'FORECAST', 'CHURN', 'INVENTORY', 'SALES', 'GROWTH'
    title: str
    summary: str
    impact: str  # 'POSITIVE', 'NEGATIVE', 'NEUTRAL', 'CRITICAL'
    action_items: list[str]
    data_source: str


class AIInsightsResponse(BaseModel):
    success: bool
    overall_health_score: int  # 0 to 100
    business_status: str
    insights: list[AIInsightItem]
    key_metrics: dict[str, Any]
    generated_at: str
