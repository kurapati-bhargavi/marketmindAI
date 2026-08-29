import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth.security import create_access_token, hash_password
from app.database.database import SessionLocal
from app.models.user import User

client = TestClient(app)


@pytest.fixture
def auth_headers():
    db = SessionLocal()
    owner_user = db.query(User).filter(User.email == "test.owner@marketmind.ai").first()
    if not owner_user:
        owner_user = User(
            name="Test Owner",
            email="test.owner@marketmind.ai",
            password_hash=hash_password("Owner@123"),
            role="Business Owner",
            is_active=True
        )
        db.add(owner_user)
        db.commit()
        db.refresh(owner_user)
    uid = str(owner_user.id)
    db.close()

    token = create_access_token(data={"sub": uid, "email": "test.owner@marketmind.ai", "role": "Business Owner"})
    return {"Authorization": f"Bearer {token}"}


def test_sales_summary_kpis(auth_headers):
    response = client.get("/analytics/sales-summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "total_orders" in data
    assert "average_order_value" in data
    assert "total_customers" in data
    assert "low_stock_products" in data


def test_customer_segmentation_ml(auth_headers):
    response = client.get("/ml/segmentation", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "silhouette_score" in data
    assert "segment_summaries" in data
    assert "customers" in data


def test_sales_forecasting_ml(auth_headers):
    response = client.get("/ml/forecast?days=14", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "forecast" in data
    assert "metrics" in data
    assert "mae" in data["metrics"]
    assert "rmse" in data["metrics"]
    assert "r2_score" in data["metrics"]


def test_customer_churn_ml(auth_headers):
    response = client.get("/ml/churn", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert "metrics" in data
    assert "accuracy" in data["metrics"]
    assert "f1_score" in data["metrics"]


def test_product_recommendations_ml(auth_headers):
    response = client.get("/ml/recommendations?top_k=3", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "precision_at_k" in data["metrics"]
    assert "recall_at_k" in data["metrics"]


def test_anomaly_detection_ml(auth_headers):
    response = client.get("/ml/anomalies", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "sales_anomalies" in data
    assert "inventory_anomalies" in data
    assert "total_anomalies" in data


def test_ai_insights(auth_headers):
    response = client.get("/ml/insights", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "overall_health_score" in data
    assert "insights" in data
    assert "key_metrics" in data


def test_business_report_generation(auth_headers):
    response = client.get("/reports/generate", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "report" in data
