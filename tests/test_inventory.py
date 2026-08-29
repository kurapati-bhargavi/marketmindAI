import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth.security import create_access_token

client = TestClient(app)


def test_inventory_retrieval():
    token = create_access_token(data={"sub": "1", "email": "owner@marketmind.ai", "role": "Business Owner"})
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/inventory/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_items" in data
    assert "items" in data
