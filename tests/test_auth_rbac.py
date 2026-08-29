import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth.security import create_access_token
from app.database.database import SessionLocal
from app.models.user import User
from app.auth.security import hash_password

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_users():
    db = SessionLocal()
    # Ensure a Sales Executive user exists with id 99
    sales_user = db.query(User).filter(User.email == "test.sales@marketmind.ai").first()
    if not sales_user:
        sales_user = User(
            name="Test Sales Exec",
            email="test.sales@marketmind.ai",
            password_hash=hash_password("Sales@123"),
            role="Sales Executive",
            is_active=True
        )
        db.add(sales_user)

    # Ensure a Business Owner user exists with id 98
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
    db.close()


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "MarketMind AI"
    assert data["status"] == "online"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_system_roles_endpoint():
    response = client.get("/auth/roles")
    assert response.status_code == 200
    data = response.json()
    assert "roles" in data
    role_names = [r["name"] for r in data["roles"]]
    assert "Business Owner" in role_names
    assert "Store Manager" in role_names
    assert "Sales Executive" in role_names
    assert "System Administrator" in role_names


def test_seed_demo_users():
    response = client.post("/auth/seed-demo-users")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


def test_login_demo_users():
    # Seed users first
    client.post("/auth/seed-demo-users")
    response = client.post("/auth/login", json={
        "email": "owner@marketmind.ai",
        "password": "Owner@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["role"] == "Business Owner"


def test_unauthorized_access_fails():
    response = client.get("/ml/insights")
    assert response.status_code == 401


def test_role_based_access_control():
    db = SessionLocal()
    sales_user = db.query(User).filter(User.email == "test.sales@marketmind.ai").first()
    db.close()

    token = create_access_token(data={"sub": str(sales_user.id), "email": sales_user.email, "role": "Sales Executive"})
    headers = {"Authorization": f"Bearer {token}"}

    # Sales Exec can access recommendations
    rec_resp = client.get("/ml/recommendations", headers=headers)
    assert rec_resp.status_code in (200, 404, 400)

    # Sales Exec is forbidden from forecasting
    forecast_resp = client.get("/ml/forecast", headers=headers)
    assert forecast_resp.status_code == 403
