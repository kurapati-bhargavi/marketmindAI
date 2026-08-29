import csv
import random
from datetime import datetime, timedelta

CUSTOMERS = [
    ("Aditi Sharma", "aditi.sharma@example.com", "+91-9876543201"),
    ("Rajesh Kumar", "rajesh.kumar@example.com", "+91-9876543202"),
    ("Priya Patel", "priya.patel@example.com", "+91-9876543203"),
    ("Vikram Singh", "vikram.singh@example.com", "+91-9876543204"),
    ("Ananya Roy", "ananya.roy@example.com", "+91-9876543205"),
    ("Karthik Iyer", "karthik.iyer@example.com", "+91-9876543206"),
    ("Sneha Reddy", "sneha.reddy@example.com", "+91-9876543207"),
    ("Amitabh Verma", "amitabh.verma@example.com", "+91-9876543208"),
    ("Pooja Nair", "pooja.nair@example.com", "+91-9876543209"),
    ("Rohan Mehta", "rohan.mehta@example.com", "+91-9876543210"),
    ("Deepika Joshi", "deepika.joshi@example.com", "+91-9876543211"),
    ("Suresh Gupta", "suresh.gupta@example.com", "+91-9876543212"),
    ("Neha Deshmukh", "neha.deshmukh@example.com", "+91-9876543213"),
    ("Manoj Pillai", "manoj.pillai@example.com", "+91-9876543214"),
    ("Divya Agarwal", "divya.agarwal@example.com", "+91-9876543215"),
    ("Rahul Sen", "rahul.sen@example.com", "+91-9876543216"),
    ("Swati Saxena", "swati.saxena@example.com", "+91-9876543217"),
    ("Gaurav Kapoor", "gaurav.kapoor@example.com", "+91-9876543218"),
    ("Meera Choudhury", "meera.choudhury@example.com", "+91-9876543219"),
    ("Kunal Bhatia", "kunal.bhatia@example.com", "+91-9876543220"),
]

PRODUCTS = [
    # Electronics
    ("Wireless Bluetooth Earbuds", "Electronics", 2499.00),
    ("Ultra HD Smart Watch", "Electronics", 4999.00),
    ("Fast Charging Power Bank 20000mAh", "Electronics", 1899.00),
    ("Noise Cancelling Headphones", "Electronics", 8499.00),
    ("4K USB-C Hub Adapter", "Electronics", 1499.00),
    # Apparel
    ("Classic Slim-Fit Denim Jeans", "Apparel", 1999.00),
    ("Premium Organic Cotton T-Shirt", "Apparel", 899.00),
    ("Formal Linen Shirt", "Apparel", 1699.00),
    ("Lightweight Running Jacket", "Apparel", 2799.00),
    ("All-Day Comfort Sneakers", "Apparel", 3499.00),
    # Home & Kitchen
    ("Stainless Steel Air Fryer", "Home & Kitchen", 6499.00),
    ("Aroma Essential Oil Diffuser", "Home & Kitchen", 1299.00),
    ("Cast Iron Dutch Oven", "Home & Kitchen", 3899.00),
    ("Ergonomic Memory Foam Pillow", "Home & Kitchen", 1499.00),
    ("Precision Digital Kitchen Scale", "Home & Kitchen", 899.00),
    # Health & Beauty
    ("Vitamin C Brightening Serum", "Health & Beauty", 799.00),
    ("Hydrating Sunscreen SPF 50", "Health & Beauty", 599.00),
    ("Sonic Electric Toothbrush", "Health & Beauty", 2199.00),
    ("Organic Whey Protein Isolate 1kg", "Health & Beauty", 2899.00),
    ("Ayurvedic Herbal Hair Oil", "Health & Beauty", 449.00),
]

PAYMENT_METHODS = ["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "CASH"]


def generate_retail_data(filename="data/sample_retail_sales.csv", num_records=300):
    random.seed(42)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=120)

    rows = []
    for _ in range(num_records):
        # Weighted customer selection to create natural champions and one-time buyers
        cust_weights = [10, 8, 8, 7, 7, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1]
        customer = random.choices(CUSTOMERS, weights=cust_weights, k=1)[0]

        # Weighted product selection
        prod_weights = [12, 10, 9, 7, 6, 11, 14, 8, 6, 7, 5, 7, 4, 8, 6, 10, 12, 6, 8, 9]
        product = random.choices(PRODUCTS, weights=prod_weights, k=1)[0]

        # Co-occurrence bonus: customers buying earbuds often buy smart watch or power bank
        quantity = random.choices([1, 2, 3, 4, 5], weights=[60, 25, 10, 3, 2], k=1)[0]
        unit_price = product[2]
        total_amount = round(quantity * unit_price, 2)

        # Dates distributed across last 120 days with slight upward trend
        days_offset = random.triangular(0, 120, 100)
        sale_date = start_date + timedelta(days=days_offset, hours=random.randint(9, 21), minutes=random.randint(0, 59))

        payment_method = random.choices(PAYMENT_METHODS, weights=[45, 25, 15, 10, 5], k=1)[0]

        rows.append({
            "customer_name": customer[0],
            "customer_email": customer[1],
            "customer_phone": customer[2],
            "product_name": product[0],
            "category": product[1],
            "quantity": quantity,
            "unit_price": unit_price,
            "total_amount": total_amount,
            "sale_date": sale_date.strftime("%Y-%m-%d %H:%M:%S"),
            "payment_method": payment_method
        })

    # Sort chronologically
    rows.sort(key=lambda x: x["sale_date"])

    # Write to CSV
    fieldnames = [
        "customer_name", "customer_email", "customer_phone",
        "product_name", "category", "quantity", "unit_price",
        "total_amount", "sale_date", "payment_method"
    ]

    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} sales records into {filename}")


if __name__ == "__main__":
    generate_retail_data()
