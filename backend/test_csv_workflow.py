import requests
import sys
import uuid
import time

sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://127.0.0.1:8000'
login = requests.post(f'{BASE}/auth/login', json={'email': 'testowner@marketmind.ai', 'password': 'Test@1234'})
token = login.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

print('=== TESTING COMPLETE CSV IMPORT WORKFLOW ===')

test_id = uuid.uuid4().hex[:6]
prod_name = f"Smart LED Bulb {test_id}"

# Test 1: Fresh CSV with new products (no SKU conflicts)
csv_new = f"customer_name,customer_email,product_name,category,quantity,unit_price,total_amount,sale_date,payment_method\n"
csv_new += f"Priya Patel,priya_{test_id}@test.com,{prod_name},Electronics,5,299.00,1495.00,2026-09-04,UPI\n"
csv_new += f"Rahul Sharma,rahul_{test_id}@test.com,Yoga Mat {test_id},Sports,2,1299.00,2598.00,2026-09-04,CARD\n"
csv_new += f"Priya Patel,priya_{test_id}@test.com,{prod_name},Electronics,3,299.00,897.00,2026-09-03,UPI"

files = {'file': (f'new_products_{test_id}.csv', csv_new.encode(), 'text/csv')}
r = requests.post(f'{BASE}/sales-upload/preview', files=files, headers=headers)
preview = r.json()
valid_count = preview.get('valid_rows_count', 0)
invalid_count = preview.get('invalid_rows_count', 0)
is_dup = preview.get('is_duplicate', False)
print(f'Preview: {valid_count} valid, {invalid_count} invalid, duplicate={is_dup}')
assert valid_count == 3, f'Expected 3, got {valid_count}'
print('  Preview test PASSED')

files = {'file': (f'new_products_{test_id}.csv', csv_new.encode(), 'text/csv')}
r = requests.post(f'{BASE}/sales-upload/csv', files=files, headers=headers)
result = r.json()
print(f'Import: success={result["success"]}, inserted={result.get("rows_inserted", 0)}, products_created={result.get("products_created", 0)}')
assert result['success'] == True
print('  Import test PASSED')

# Test 2: Same CSV again (duplicate detection)
files = {'file': (f'new_products_{test_id}.csv', csv_new.encode(), 'text/csv')}
r = requests.post(f'{BASE}/sales-upload/csv', files=files, headers=headers)
dup_result = r.json()
msg = dup_result.get('message', '')[:60]
print(f'Duplicate attempt: success={dup_result["success"]}, message={msg}')
assert dup_result['success'] == False
print('  Duplicate detection test PASSED')

# Test 3: Same product name in new CSV (SKU reuse - not creating duplicate products)
csv_repeat_prod = f"customer_name,customer_email,product_name,category,quantity,unit_price,total_amount,sale_date,payment_method\n"
csv_repeat_prod += f"New Customer X,newcust_{test_id}@test.com,{prod_name},Electronics,1,299.00,299.00,2026-09-05,UPI"
files = {'file': (f'repeat_product_{test_id}.csv', csv_repeat_prod.encode(), 'text/csv')}
r = requests.post(f'{BASE}/sales-upload/csv', files=files, headers=headers)
rep_result = r.json()
prod_created = rep_result.get('products_created', 0)
print(f'Same product reuse: success={rep_result["success"]}, products_created={prod_created} (should be 0 - reusing existing)')
assert rep_result['success'] == True
assert prod_created == 0, f'Should reuse existing product, not create new. Got {prod_created}'
print('  Product reuse test PASSED (no duplicate SKU error!)')

print()
print('All CSV import workflow tests PASSED! SKU duplicate issue is fully resolved.')
