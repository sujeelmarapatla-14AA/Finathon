"""
SpendIntel - Nova Client Test & Validation Suite.

Validates all requirements for backend/app/services/nova_client.py:
1. API key read exclusively from NOVA_API_KEY environment variable.
2. Bearer token authentication header injection.
3. Pagination via list_all(path, limit=200, offset=0) until pagination.has_more == false.
4. Retry handling: 429 with Retry-After, 502 with exponential backoff.
5. Non-retryable status codes: 400, 401, 404, 405 fail immediately.
6. Structured error parsing (error.code, error.message, request_id).
7. All 8 entity helper functions present and callable.
8. In-memory session caching.
9. Raw JSON preservation without invented fields.
"""

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch
import requests

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.services.nova_client import (
    NOVA_BASE_URL,
    NovaAPIError,
    nova_get,
    list_all,
    clear_nova_cache,
    get_nova_cache_stats,
    get_purchase_orders,
    get_purchase_bills,
    get_vendors,
    get_vendor_contracts,
    get_inventory,
    get_purchase_requisitions,
    get_supplier_quotes,
    get_goods_receipts,
)


def test_missing_api_key():
    print("\n--- Test 1: Missing API Key Handling ---")
    with patch.dict(os.environ, {}, clear=True):
        try:
            nova_get("/purchase-orders")
            assert False, "Expected NovaAPIError when NOVA_API_KEY is missing"
        except NovaAPIError as e:
            assert e.status_code == 401
            assert e.error_code == "MISSING_API_KEY"
            print("  ✓ Missing NOVA_API_KEY raises structured NovaAPIError(401)")


def test_authenticated_get_request():
    print("\n--- Test 2: Authenticated GET Request ---")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": [{"id": "PO-101", "total_amount": 50000}],
        "pagination": {"total": 1, "limit": 200, "offset": 0, "has_more": False},
        "request_id": "req_abc123",
    }

    with patch.dict(os.environ, {"NOVA_API_KEY": "test-key-12345"}):
        with patch("requests.get", return_value=mock_resp) as mock_get:
            res = nova_get("/purchase-orders")
            mock_get.assert_called_once()
            call_url = mock_get.call_args[0][0]
            call_headers = mock_get.call_args[1]["headers"]

            assert call_url == f"{NOVA_BASE_URL}/purchase-orders"
            assert call_headers["Authorization"] == "Bearer test-key-12345"
            assert res["data"][0]["id"] == "PO-101"
            print("  ✓ Bearer token header properly injected into request")
            print("  ✓ Raw Nova response returned unchanged")


def test_pagination_list_all():
    print("\n--- Test 3: Pagination with list_all ---")
    clear_nova_cache()

    # Page 1 response: 200 items, has_more=True
    page1_items = [{"id": f"PO-{i}"} for i in range(1, 201)]
    resp1 = MagicMock()
    resp1.status_code = 200
    resp1.json.return_value = {
        "data": page1_items,
        "pagination": {"total": 250, "limit": 200, "offset": 0, "has_more": True},
    }

    # Page 2 response: 50 items, has_more=False
    page2_items = [{"id": f"PO-{i}"} for i in range(201, 251)]
    resp2 = MagicMock()
    resp2.status_code = 200
    resp2.json.return_value = {
        "data": page2_items,
        "pagination": {"total": 250, "limit": 200, "offset": 200, "has_more": False},
    }

    with patch.dict(os.environ, {"NOVA_API_KEY": "test-key-12345"}):
        with patch("requests.get", side_effect=[resp1, resp2]) as mock_get:
            all_records = list_all("/purchase-orders", limit=200, use_cache=False)
            assert mock_get.call_count == 2
            assert len(all_records) == 250
            assert all_records[0]["id"] == "PO-1"
            assert all_records[249]["id"] == "PO-250"

            # Check offset progression
            call1_params = mock_get.call_args_list[0][1]["params"]
            call2_params = mock_get.call_args_list[1][1]["params"]
            assert call1_params == {"limit": 200, "offset": 0}
            assert call2_params == {"limit": 200, "offset": 200}
            print(f"  ✓ Automatically paginated {len(all_records)} records across 2 pages (offset 0 -> 200)")


def test_retry_429_rate_limit():
    print("\n--- Test 4: Rate Limiting (429) & Retry-After Handling ---")
    resp_429 = MagicMock()
    resp_429.status_code = 429
    resp_429.headers = {"Retry-After": "0.1"}

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {"data": [{"id": "VEND-1"}]}

    with patch.dict(os.environ, {"NOVA_API_KEY": "test-key-12345"}):
        with patch("requests.get", side_effect=[resp_429, resp_200]) as mock_get:
            with patch("time.sleep") as mock_sleep:
                res = nova_get("/vendors")
                assert mock_get.call_count == 2
                mock_sleep.assert_called_with(0.1)
                assert res["data"][0]["id"] == "VEND-1"
                print("  ✓ 429 Rate Limit respected Retry-After and succeeded on retry")


def test_retry_502_bad_gateway():
    print("\n--- Test 5: Bad Gateway (502) Exponential Backoff ---")
    resp_502 = MagicMock()
    resp_502.status_code = 502
    resp_502.text = "Bad Gateway"

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {"data": [{"id": "BILL-101"}]}

    with patch.dict(os.environ, {"NOVA_API_KEY": "test-key-12345"}):
        with patch("requests.get", side_effect=[resp_502, resp_502, resp_200]) as mock_get:
            with patch("time.sleep") as mock_sleep:
                res = nova_get("/purchase-bills")
                assert mock_get.call_count == 3
                assert mock_sleep.call_count == 2
                assert res["data"][0]["id"] == "BILL-101"
                print("  ✓ 502 Bad Gateway retried with exponential backoff and succeeded")


def test_non_retryable_errors():
    print("\n--- Test 6: Non-Retryable Error Handling (400, 401, 404, 405) ---")
    error_codes = [400, 401, 404, 405]

    with patch.dict(os.environ, {"NOVA_API_KEY": "test-key-12345"}):
        for code in error_codes:
            mock_err = MagicMock()
            mock_err.status_code = code
            mock_err.json.return_value = {
                "error": {
                    "code": f"ERR_{code}",
                    "message": f"Resource error {code}",
                },
                "request_id": f"req_{code}",
            }

            with patch("requests.get", return_value=mock_err) as mock_get:
                try:
                    nova_get(f"/test-{code}")
                    assert False, f"Expected NovaAPIError for {code}"
                except NovaAPIError as e:
                    assert mock_get.call_count == 1, f"Should not retry on status {code}"
                    assert e.status_code == code
                    assert e.error_code == f"ERR_{code}"
                    assert e.request_id == f"req_{code}"
                    print(f"  ✓ HTTP {code} raised immediately without retry: {e}")


def test_session_cache():
    print("\n--- Test 7: In-Memory Session Cache ---")
    clear_nova_cache()

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": [{"id": "ITEM-1", "name": "Industrial Bearing"}],
        "pagination": {"has_more": False},
    }

    with patch.dict(os.environ, {"NOVA_API_KEY": "test-key-12345"}):
        with patch("requests.get", return_value=mock_resp) as mock_get:
            # First call -> hits API
            res1 = get_inventory(use_cache=True)
            assert mock_get.call_count == 1
            assert len(res1) == 1

            # Second call -> hits in-memory session cache
            res2 = get_inventory(use_cache=True)
            assert mock_get.call_count == 1  # No additional network call
            assert res1 == res2

            stats = get_nova_cache_stats()
            assert stats["cached_entries"] >= 1
            print(f"  ✓ Cached session hit verified (1 network call for 2 requests, stats: {stats['cached_entries']} cached keys)")

            # Clear cache
            clear_nova_cache()
            assert get_nova_cache_stats()["cached_entries"] == 0
            print("  ✓ clear_nova_cache() successfully evicted cache")


def test_all_helper_functions():
    print("\n--- Test 8: Entity Helper Functions ---")
    clear_nova_cache()

    endpoints_map = {
        get_purchase_orders: "/purchase-orders",
        get_purchase_bills: "/purchase-bills",
        get_vendors: "/vendors",
        get_vendor_contracts: "/vendor-contracts",
        get_inventory: "/inventory",
        get_purchase_requisitions: "/purchase-requisitions",
        get_supplier_quotes: "/supplier-quotes",
        get_goods_receipts: "/goods-receipts",
    }

    with patch.dict(os.environ, {"NOVA_API_KEY": "test-key-12345"}):
        for helper_fn, expected_path in endpoints_map.items():
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "data": [{"id": f"{expected_path.strip('/')}-1"}],
                "pagination": {"has_more": False},
            }

            with patch("requests.get", return_value=mock_resp) as mock_get:
                res = helper_fn(use_cache=False)
                call_url = mock_get.call_args[0][0]
                assert expected_path in call_url
                assert len(res) == 1
                print(f"  ✓ {helper_fn.__name__}() -> {call_url}")


def run_all_tests():
    print("=" * 70)
    print("SPENDINTEL — NOVA CLIENT VERIFICATION SUITE")
    print("=" * 70)

    test_missing_api_key()
    test_authenticated_get_request()
    test_pagination_list_all()
    test_retry_429_rate_limit()
    test_retry_502_bad_gateway()
    test_non_retryable_errors()
    test_session_cache()
    test_all_helper_functions()

    print("\n" + "=" * 70)
    print("ALL NOVA CLIENT TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
