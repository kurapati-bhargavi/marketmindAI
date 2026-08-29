import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth.security import create_access_token
from app.services.data_preprocessor import validate_and_preprocess_csv

client = TestClient(app)


def test_csv_preprocessing_validation():
    valid_csv = (
        "customer_name,product_name,category,quantity,unit_price,sale_date\n"
        "John Doe,Wireless Headphones,Electronics,2,2500,2026-08-01\n"
        "Jane Smith,Cotton T-Shirt,Apparel,3,800,2026-08-02\n"
    ).encode("utf-8")

    result = validate_and_preprocess_csv(valid_csv, "test.csv")
    assert result["valid"] is True
    assert result["valid_rows_count"] == 2
    assert result["invalid_rows_count"] == 0


def test_csv_preprocessing_with_invalid_rows():
    invalid_csv = (
        "customer_name,product_name,quantity,unit_price\n"
        ",Wireless Headphones,2,2500\n"  # missing customer
        "Jane Smith,,-1,800\n"  # missing product & negative qty
    ).encode("utf-8")

    result = validate_and_preprocess_csv(invalid_csv, "invalid.csv")
    assert result["valid_rows_count"] == 0
    assert result["invalid_rows_count"] == 2


def test_sales_upload_preview():
    token = create_access_token(data={"sub": "1", "email": "owner@marketmind.ai", "role": "Business Owner"})
    headers = {"Authorization": f"Bearer {token}"}

    csv_data = (
        "customer_name,product_name,category,quantity,unit_price,sale_date\n"
        "Aarav Sharma,Bluetooth Speaker,Electronics,1,1999,2026-08-10\n"
    ).encode("utf-8")

    files = {"file": ("test_sales.csv", io.BytesIO(csv_data), "text/csv")}
    response = client.post("/sales-upload/preview", headers=headers, files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["valid_rows_count"] == 1
