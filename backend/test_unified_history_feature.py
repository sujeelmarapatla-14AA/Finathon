import requests

BASE = 'http://127.0.0.1:8000'

def test_database_and_history():
    # 1. Fetch all datasets
    res = requests.get(f'{BASE}/api/datasets')
    print('=== 1. ALL DATASETS === (Status:', res.status_code, ')')
    datasets = res.json().get('datasets', [])
    print(f'Count: {len(datasets)}')
    for d in datasets:
        print(f" • [{d['source_type']}] {d['name']} (ID: {d['id']}, Rows: {d['total_rows']}, Spend: INR {d['total_spend']:,.0f}, Leakage: INR {d['potential_leakage']:,.0f})")

    # 2. Test filtered queries
    for st in ['CSV', 'NOVA_API', 'MANUAL']:
        r = requests.get(f'{BASE}/api/datasets?source_type={st}')
        items = r.json().get('datasets', [])
        print(f"=== FILTER {st} ===: count = {len(items)}")

    # 3. Test Raw Row Preservation
    if datasets:
        for d in datasets:
            target_id = d['id']
            r_rows = requests.get(f'{BASE}/api/datasets/{target_id}/rows?limit=2')
            data = r_rows.json()
            print(f"\n=== RAW ROWS FOR [{d['source_type']}] {target_id} ===: total = {data.get('total_rows')}")
            for row in data.get('rows', []):
                print(f" - Row #{row['row_number']}: {row['product_name']} | Supplier: {row['supplier']} | Price: {row['price']} | raw_data: {row['raw_data']}")

    # 4. Test Comparison Matrix Preservation
    if datasets:
        for d in datasets:
            target_id = d['id']
            r_comps = requests.get(f'{BASE}/api/datasets/{target_id}/comparisons')
            print(f"=== COMPARISONS FOR [{d['source_type']}] {target_id} ===: total = {r_comps.json().get('total_comparisons')}")

if __name__ == '__main__':
    test_database_and_history()
