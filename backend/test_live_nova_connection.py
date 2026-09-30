"""
SpendIntel - Live Nova Connection Verification Script.

Tests:
1. GET /me (Health & Authentication verification)
2. GET /purchase-orders?limit=5 (Procurement resource fetch)

Strict Security Constraints:
- Never print or expose NOVA_API_KEY.
- Reports only SUCCESS or FAILED.
- On failure, reports error code and request_id only.
"""

import sys
from pathlib import Path
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend directory in path and load backend/.env
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

from app.services.nova_client import nova_get, NovaAPIError, _extract_items_and_pagination


def test_nova_live_connection():
    print("=" * 60)
    print("NOVA API LIVE CONNECTION TEST")
    print("=" * 60)

    # 1. Test GET /me
    connection_successful = False
    try:
        me_response = nova_get("me")
        print("Nova connection: SUCCESS")
        connection_successful = True
    except NovaAPIError as e:
        print("Nova connection: FAILED")
        if e.error_code:
            print(f"Error Code: {e.error_code}")
        if e.request_id:
            print(f"Request ID: {e.request_id}")
        if e.status_code:
            print(f"HTTP Status: {e.status_code}")
    except Exception as ex:
        print("Nova connection: FAILED")
        print(f"Details: {str(ex)[:100]}")

    # 2. If successful, test GET /purchase-orders?limit=5
    if connection_successful:
        print("\n" + "=" * 60)
        print("TESTING PROCUREMENT RESOURCE: GET /purchase-orders?limit=5")
        print("=" * 60)

        try:
            po_response = nova_get("purchase-orders", params={"limit": 5})
            items, pagination = _extract_items_and_pagination(po_response)

            has_more = pagination.get("has_more") if isinstance(pagination, dict) else "N/A"
            first_record_type = type(items[0]).__name__ if items else "None"
            first_record_sample_keys = list(items[0].keys()) if (items and isinstance(items[0], dict)) else []

            print(f"- HTTP status: 200")
            print(f"- number of records returned: {len(items)}")
            print(f"- pagination.has_more: {has_more}")
            if items and isinstance(items[0], dict):
                entity_type = items[0].get("object") or items[0].get("type") or "purchase_order"
                print(f"- first record's object type: {entity_type} (fields: {', '.join(first_record_sample_keys[:5])}...)")
            else:
                print(f"- first record's object type: {first_record_type}")

        except NovaAPIError as e:
            print(f"Error fetching /purchase-orders: HTTP {e.status_code} | Code: {e.error_code} | (request_id: {e.request_id})")
        except Exception as ex:
            print(f"Error: {str(ex)[:100]}")

    print("=" * 60)


if __name__ == "__main__":
    test_nova_live_connection()
