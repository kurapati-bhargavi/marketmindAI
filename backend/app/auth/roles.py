from enum import Enum


class UserRole(str, Enum):
    BUSINESS_OWNER = "Business Owner"
    STORE_MANAGER = "Store Manager"
    SALES_EXECUTIVE = "Sales Executive"
    SYSTEM_ADMINISTRATOR = "System Administrator"


# Role hierarchy and permissions mapping
ROLE_PERMISSIONS = {
    UserRole.BUSINESS_OWNER: [
        "view_dashboard", "view_sales", "manage_sales", "view_inventory", "manage_inventory",
        "view_customers", "manage_customers", "view_segmentation", "view_forecasting",
        "view_churn", "view_recommendations", "view_anomalies", "view_alerts", "manage_alerts",
        "view_reports", "upload_data", "view_users"
    ],
    UserRole.STORE_MANAGER: [
        "view_dashboard", "view_sales", "manage_sales", "view_inventory", "manage_inventory",
        "view_customers", "view_segmentation", "view_forecasting", "view_recommendations",
        "view_anomalies", "view_alerts", "upload_data"
    ],
    UserRole.SALES_EXECUTIVE: [
        "view_dashboard", "view_sales", "manage_sales", "view_inventory",
        "view_customers", "view_recommendations"
    ],
    UserRole.SYSTEM_ADMINISTRATOR: [
        "view_dashboard", "manage_users", "manage_roles", "manage_permissions",
        "view_system_health", "view_sales", "view_inventory", "view_customers",
        "view_alerts", "manage_platform"
    ],
}