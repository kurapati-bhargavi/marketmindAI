import os
import unittest
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.sale import Sale
from app.models.invoice import Invoice
from app.models.ml_models import Alert, Anomaly, Report
from app.services.data_preprocessor import validate_and_preprocess_csv
from app.services.sales_service import batch_import_sales, process_sale
from app.analytics.sales_analytics import get_sales_summary, get_monthly_sales, get_product_sales, get_category_sales
from app.ml.segmentation import calculate_customer_segmentation
from app.ml.forecasting import generate_sales_forecast, generate_demand_forecast
from app.ml.churn import predict_customer_churn
from app.ml.recommendations import generate_product_recommendations, get_customer_recommendations
from app.ml.anomaly_detection import detect_all_anomalies
from app.ml.ai_insights import generate_executive_ai_insights
from app.ml.alerts_engine import sync_and_get_alerts, resolve_alert
from app.auth.security import hash_password, verify_password, create_access_token, decode_access_token


class TestMarketMindEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db: Session = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_authentication_and_jwt(self):
        """Test password hashing, verification and JWT tokens."""
        raw_password = "SecurePassword@2026"
        hashed = hash_password(raw_password)
        self.assertTrue(verify_password(raw_password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

        payload = {"sub": "1", "email": "test@marketmind.ai", "role": "Business Owner"}
        token = create_access_token(payload)
        self.assertIsNotNone(token)

        decoded = decode_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded.get("email"), "test@marketmind.ai")
        self.assertEqual(decoded.get("role"), "Business Owner")

    def test_02_csv_preprocessing_and_validation(self):
        """Test CSV parsing, normalization, column synonyms and validation rules."""
        sample_path = os.path.join(os.path.dirname(__file__), "..", "sample_sale.csv")
        self.assertTrue(os.path.exists(sample_path), "sample_sale.csv should exist")

        with open(sample_path, "rb") as f:
            contents = f.read()

        result = validate_and_preprocess_csv(contents, "sample_sale.csv")
        self.assertTrue(result["valid"])
        self.assertGreater(result["valid_rows_count"], 10)
        self.assertEqual(result["invalid_rows_count"], 0)
        self.assertIn("file_hash", result)

    def test_03_batch_sales_ingestion_and_sku_reuse(self):
        """Test batch sales ingestion, customer/product provisioning, SKU reuse and inventory deduction."""
        sample_path = os.path.join(os.path.dirname(__file__), "..", "sample_sale.csv")
        with open(sample_path, "rb") as f:
            contents = f.read()

        parsed = validate_and_preprocess_csv(contents, "sample_sale.csv")
        import_result = batch_import_sales(self.db, parsed["valid_rows"], parsed["file_hash"])

        self.assertTrue(import_result["success"])
        self.assertGreater(import_result["rows_inserted"], 0)
        self.assertIn("new_products", import_result)
        self.assertIn("existing_products_reused", import_result)

        # Check that sales, customers, products and inventory records exist in DB
        sales_count = self.db.query(Sale).count()
        customers_count = self.db.query(Customer).count()
        products_count = self.db.query(Product).count()
        inventories_count = self.db.query(Inventory).count()

        self.assertGreater(sales_count, 0)
        self.assertGreater(customers_count, 0)
        self.assertGreater(products_count, 0)
        self.assertGreater(inventories_count, 0)

        # Invoices generated
        invoices_count = self.db.query(Invoice).count()
        self.assertGreater(invoices_count, 0)

    def test_04_sales_aggregation_and_kpis(self):
        """Test sales analytics KPIs from database single source of truth."""
        summary = get_sales_summary(self.db)
        self.assertGreater(summary["total_revenue"], 0)
        self.assertGreater(summary["total_orders"], 0)
        self.assertGreater(summary["total_customers"], 0)
        self.assertGreater(summary["average_order_value"], 0)

        monthly = get_monthly_sales(self.db)
        self.assertIsInstance(monthly, list)
        self.assertGreater(len(monthly), 0)

        products = get_product_sales(self.db, limit=5)
        self.assertIsInstance(products, list)
        self.assertGreater(len(products), 0)

        categories = get_category_sales(self.db)
        self.assertIsInstance(categories, list)
        self.assertGreater(len(categories), 0)

    def test_05_customer_rfm_segmentation(self):
        """Test K-Means and Hierarchical RFM customer segmentation and Silhouette score."""
        seg_res_kmeans = calculate_customer_segmentation(self.db, algorithm="kmeans")
        self.assertTrue(seg_res_kmeans["success"])
        self.assertIn("segment_summaries", seg_res_kmeans)
        self.assertGreater(len(seg_res_kmeans["customers"]), 0)
        self.assertGreaterEqual(seg_res_kmeans["silhouette_score"], 0.0)

        seg_res_hier = calculate_customer_segmentation(self.db, algorithm="hierarchical")
        self.assertTrue(seg_res_hier["success"])
        self.assertIn("segment_summaries", seg_res_hier)

    def test_06_sales_and_demand_forecasting(self):
        """Test time-series revenue and unit demand forecasting with MAE, RMSE, MAPE, R2."""
        forecast_res = generate_sales_forecast(self.db, forecast_days=14)
        self.assertTrue(forecast_res["success"])
        self.assertEqual(len(forecast_res["forecast"]), 14)
        self.assertIn("metrics", forecast_res)
        self.assertIn("mae", forecast_res["metrics"])
        self.assertIn("rmse", forecast_res["metrics"])
        self.assertIn("mape", forecast_res["metrics"])
        self.assertIn("r2_score", forecast_res["metrics"])
        self.assertIn("trend", forecast_res["metrics"])
        self.assertIn("trend_explanation", forecast_res)
        self.assertIn("seasonality_analysis", forecast_res)

        demand_res = generate_demand_forecast(self.db, forecast_days=7)
        self.assertTrue(demand_res["success"])
        self.assertEqual(demand_res["target"], "demand")

    def test_07_customer_churn_prediction(self):
        """Test behavioral churn prediction with probability scoring, risk tiers (LOW/MEDIUM/HIGH) and retention actions."""
        churn_res = predict_customer_churn(self.db)
        self.assertTrue(churn_res["success"])
        self.assertIn("predictions", churn_res)
        self.assertGreater(len(churn_res["predictions"]), 0)
        self.assertIn("metrics", churn_res)
        self.assertIn("accuracy", churn_res["metrics"])

        sample_pred = churn_res["predictions"][0]
        self.assertIn("churn_probability", sample_pred)
        self.assertIn("churn_risk", sample_pred)
        self.assertIn(sample_pred["churn_risk"], ["LOW", "MEDIUM", "HIGH"])
        self.assertIn("retention_action", sample_pred)

    def test_08_product_recommendations_association_rules_and_upsell(self):
        """Test collaborative recommendations, association rules (Support, Confidence, Lift) and upsells."""
        rec_res = generate_product_recommendations(self.db, top_k=3)
        self.assertTrue(rec_res["success"])
        self.assertIn("metrics", rec_res)
        self.assertIn("precision_at_k", rec_res["metrics"])
        self.assertIn("product_affinity_matrix", rec_res)
        self.assertIn("upsell_opportunities", rec_res)

        # Test association rules
        if rec_res["product_affinity_matrix"]:
            first_rule = rec_res["product_affinity_matrix"][0]
            self.assertIn("confidence", first_rule)
            self.assertIn("lift", first_rule)
            self.assertIn("support", first_rule)

        # Test customer-specific recommendations
        cust = self.db.query(Customer).first()
        self.assertIsNotNone(cust)
        personal_recs = get_customer_recommendations(self.db, customer_id=cust.id, top_k=3)
        self.assertEqual(personal_recs["customer_id"], cust.id)
        self.assertIn("recommendations", personal_recs)

    def test_09_anomaly_detection_engine(self):
        """Test Isolation Forest & IQR sales/inventory anomaly detection."""
        anom_res = detect_all_anomalies(self.db)
        self.assertTrue(anom_res["success"])
        self.assertIn("sales_anomalies", anom_res)
        self.assertIn("inventory_anomalies", anom_res)

        # Check terminology
        for a in anom_res["sales_anomalies"]:
            self.assertNotEqual(a["anomaly_type"], "Confirmed Fraud")

    def test_10_ai_insights_and_alert_center(self):
        """Test overall business health score and alert management."""
        insights = generate_executive_ai_insights(self.db)
        self.assertTrue(insights["success"])
        self.assertGreaterEqual(insights["overall_health_score"], 0)
        self.assertLessEqual(insights["overall_health_score"], 100)
        self.assertIn("strategic_next_steps", insights)

        alerts = sync_and_get_alerts(self.db)
        self.assertIsInstance(alerts, list)
        if alerts:
            first_id = alerts[0]["id"]
            resolved = resolve_alert(self.db, first_id)
            self.assertTrue(resolved)


if __name__ == "__main__":
    unittest.main()
