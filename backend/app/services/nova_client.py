"""
SpendIntel - Nova Read-Only Procurement REST API Client.

Integrates with Nova Procurement Cloud:
Base URL: https://www.aczen.in/nova-api/v1

Key Features:
- Authenticates via NOVA_API_KEY environment variable (never hard-coded or logged).
- Implements resilient HTTP client with timeout handling using Python requests.
- Automatic pagination via list_all(path, limit=200, offset=0).
- Automatic retry handling for:
    * 429: respects Retry-After header and retries.
    * 502: exponential backoff up to 3 retries.
    * Non-retryable status codes (400, 401, 404, 405) fail immediately.
- Structured NovaAPIError with error.code, error.message, and request_id.
- In-memory session cache for non-volatile procurement datasets.
- Helper functions for all procurement entities.
- Returns raw Nova JSON objects without fabricating fields.
"""

import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple
import requests

NOVA_BASE_URL: str = os.getenv("NOVA_BASE_URL", "https://www.aczen.in/nova-api/v1").rstrip("/")
DEFAULT_TIMEOUT: float = float(os.getenv("NOVA_TIMEOUT", "30.0"))
NON_RETRYABLE_STATUS_CODES = {400, 401, 403, 404, 405, 422}

# In-memory application session cache
_SESSION_CACHE: Dict[str, Any] = {}


class NovaAPIError(Exception):
    """
    Structured exception for errors returned by the Nova REST API.

    Attributes:
        status_code: HTTP status code (e.g. 401, 404, 502).
        error_code: Nova error code from response error.code (e.g. INVALID_PARAMS).
        message: Nova error message from response error.message.
        request_id: Unique request correlation ID from Nova response.
    """

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        error_code: Optional[str] = None,
        request_id: Optional[str] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.request_id = request_id
        super().__init__(self.__str__())

    def __str__(self) -> str:
        parts = []
        if self.status_code is not None:
            parts.append(f"HTTP {self.status_code}")
        if self.error_code:
            parts.append(f"Code: {self.error_code}")
        parts.append(self.message)
        if self.request_id:
            parts.append(f"(request_id: {self.request_id})")
        return " | ".join(parts)


def _get_api_key() -> str:
    """
    Read Nova API key strictly from the NOVA_API_KEY environment variable.
    Never logs or exposes the key.
    """
    key = os.getenv("NOVA_API_KEY", "").strip()
    if not key:
        raise NovaAPIError(
            status_code=401,
            error_code="MISSING_API_KEY",
            message="NOVA_API_KEY environment variable is not configured. Set NOVA_API_KEY to authenticate with Nova API.",
        )
    return key


def _extract_error_details(response: requests.Response) -> Tuple[Optional[str], str, Optional[str]]:
    """
    Extract structured error details (code, message, request_id) from Nova JSON response.
    """
    error_code: Optional[str] = None
    error_message: str = response.text or f"HTTP {response.status_code} Error"
    request_id: Optional[str] = None

    try:
        data = response.json()
        if isinstance(data, dict):
            request_id = data.get("request_id")
            err = data.get("error")
            if isinstance(err, dict):
                error_code = err.get("code")
                error_message = err.get("message") or error_message
            elif isinstance(err, str):
                error_message = err

            if not error_code and "code" in data:
                error_code = str(data["code"])
            if "message" in data and error_message == response.text:
                error_message = str(data["message"])
    except Exception:
        pass

    return error_code, error_message, request_id


def clear_nova_cache() -> None:
    """Clear the session cache for Nova API responses."""
    _SESSION_CACHE.clear()


def get_nova_cache_stats() -> Dict[str, Any]:
    """Return metrics on cached session responses."""
    return {
        "cached_entries": len(_SESSION_CACHE),
        "keys": list(_SESSION_CACHE.keys()),
    }


def nova_get(
    path: str,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
    max_retries_502: int = 3,
    max_retries_429: int = 3,
) -> Any:
    """
    Execute a single authenticated GET request to the Nova REST API.

    Features:
    - Injects Authorization: Bearer <NOVA_API_KEY> header.
    - Handles 429 by sleeping for Retry-After duration and retrying.
    - Handles 502 with exponential backoff up to 3 retries.
    - Fails immediately without retrying on 400, 401, 404, 405.
    - Parses structured Nova error responses.

    Args:
        path: Resource endpoint path (e.g. '/purchase-orders' or 'purchase-orders').
        params: Optional query parameters dictionary.
        timeout: HTTP request timeout in seconds.
        max_retries_502: Max retry attempts for 502 Bad Gateway.
        max_retries_429: Max retry attempts for 429 Rate Limit.

    Returns:
        Parsed JSON response from Nova API.
    """
    api_key = _get_api_key()
    clean_path = path.strip().lstrip("/")
    url = f"{NOVA_BASE_URL}/{clean_path}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": "SpendIntel-NovaClient/1.0",
    }

    retries_502 = 0
    retries_429 = 0

    while True:
        try:
            response = requests.get(url, headers=headers, params=params, timeout=timeout)
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            if retries_502 < max_retries_502:
                retries_502 += 1
                backoff = 0.5 * (2 ** retries_502)
                time.sleep(backoff)
                continue
            raise NovaAPIError(
                status_code=None,
                error_code="NETWORK_ERROR",
                message=f"Request to Nova API timed out or connection failed: {str(e)}",
            )

        status = response.status_code

        # 1. Success Response (200-299)
        if 200 <= status < 300:
            try:
                return response.json()
            except Exception as e:
                raise NovaAPIError(
                    status_code=status,
                    error_code="INVALID_JSON",
                    message=f"Nova API returned invalid non-JSON payload: {str(e)}",
                )

        # 2. Rate Limiting (429) -> Wait Retry-After and retry
        if status == 429:
            if retries_429 < max_retries_429:
                retries_429 += 1
                retry_after_hdr = response.headers.get("Retry-After")
                sleep_sec = 2.0
                if retry_after_hdr:
                    try:
                        sleep_sec = max(float(retry_after_hdr), 0.0)
                    except ValueError:
                        sleep_sec = 2.0
                time.sleep(sleep_sec)
                continue
            err_code, err_msg, req_id = _extract_error_details(response)
            raise NovaAPIError(
                status_code=429,
                error_code=err_code or "RATE_LIMITED",
                message=err_msg or "Nova API rate limit exceeded (429)",
                request_id=req_id,
            )

        # 3. Bad Gateway (502) -> Exponential backoff up to 3 retries
        if status == 502:
            if retries_502 < max_retries_502:
                retries_502 += 1
                backoff = 1.0 * (2 ** (retries_502 - 1))
                time.sleep(backoff)
                continue
            err_code, err_msg, req_id = _extract_error_details(response)
            raise NovaAPIError(
                status_code=502,
                error_code=err_code or "BAD_GATEWAY",
                message=err_msg or "Nova API returned 502 Bad Gateway after 3 retries",
                request_id=req_id,
            )

        # 4. Non-retryable client errors (400, 401, 404, 405, etc.)
        if status in NON_RETRYABLE_STATUS_CODES or (400 <= status < 500):
            err_code, err_msg, req_id = _extract_error_details(response)
            raise NovaAPIError(
                status_code=status,
                error_code=err_code,
                message=err_msg,
                request_id=req_id,
            )

        # 5. Any other server error
        err_code, err_msg, req_id = _extract_error_details(response)
        raise NovaAPIError(
            status_code=status,
            error_code=err_code or f"SERVER_ERROR_{status}",
            message=err_msg,
            request_id=req_id,
        )


def _extract_items_and_pagination(response_data: Any) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Extract the item list and pagination metadata from raw Nova response.
    Supports list format, dict['data'], or resource-keyed payloads.
    """
    if isinstance(response_data, list):
        return response_data, {"has_more": False}

    if isinstance(response_data, dict):
        pagination = response_data.get("pagination", {})
        if not isinstance(pagination, dict):
            pagination = {}

        # Check standard list container keys
        items: Optional[List[Dict[str, Any]]] = None
        for key in ["data", "items", "records", "results"]:
            if key in response_data and isinstance(response_data[key], list):
                items = response_data[key]
                break

        if items is None:
            # Check any top-level key containing list of objects
            for key, val in response_data.items():
                if key not in ["pagination", "error", "metadata", "links", "summary"] and isinstance(val, list):
                    items = val
                    break

        if items is None:
            items = []

        return items, pagination

    return [], {"has_more": False}


def list_all(
    path: str,
    params: Optional[Dict[str, Any]] = None,
    limit: int = 200,
    use_cache: bool = True,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Fetch all paginated records from a Nova API endpoint.

    Paginates using:
    - limit: 200 (default)
    - offset: starts at 0, increases by limit on each iteration
    - continues until: pagination.has_more == false or no more items returned

    Caches aggregated results in-memory for the current session.

    Args:
        path: Resource endpoint path.
        params: Optional query filter parameters.
        limit: Records per page (default 200).
        use_cache: If True, uses cached results when available.
        timeout: Request timeout in seconds.

    Returns:
        List of raw Nova JSON records.
    """
    cache_key = f"{path.strip().lstrip('/')}:{json.dumps(params or {}, sort_keys=True)}:{limit}"
    if use_cache and cache_key in _SESSION_CACHE:
        return _SESSION_CACHE[cache_key]

    offset = 0
    all_items: List[Dict[str, Any]] = []
    base_params = dict(params or {})

    while True:
        page_params = dict(base_params)
        page_params["limit"] = limit
        page_params["offset"] = offset

        page_response = nova_get(path, params=page_params, timeout=timeout)
        items, pagination = _extract_items_and_pagination(page_response)

        all_items.extend(items)

        # Evaluate pagination condition
        has_more = pagination.get("has_more")
        if has_more is False:
            break
        elif has_more is True:
            offset += limit
        else:
            # Fallback when has_more field is omitted: break if page returned fewer than limit
            if len(items) < limit or len(items) == 0:
                break
            offset += limit

    if use_cache:
        _SESSION_CACHE[cache_key] = all_items

    return all_items


# -----------------------------------------------------------------------------
# HELPER FUNCTIONS FOR NOVA PROCUREMENT ENTITIES
# -----------------------------------------------------------------------------

def get_purchase_orders(
    use_cache: bool = True,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Retrieve all purchase orders from Nova API (/purchase-orders).

    Returns:
        List of raw Nova purchase order JSON records.
    """
    return list_all("/purchase-orders", params=params, use_cache=use_cache, timeout=timeout)


def get_purchase_bills(
    use_cache: bool = True,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Retrieve all purchase bills / invoices from Nova API (/purchase-bills).

    Returns:
        List of raw Nova purchase bill JSON records.
    """
    return list_all("/purchase-bills", params=params, use_cache=use_cache, timeout=timeout)


def get_vendors(
    use_cache: bool = True,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Retrieve all vendor master records from Nova API (/vendors).

    Returns:
        List of raw Nova vendor JSON records.
    """
    return list_all("/vendors", params=params, use_cache=use_cache, timeout=timeout)


def get_vendor_contracts(
    use_cache: bool = True,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Retrieve all vendor contracts and rate card agreements from Nova API (/vendor-contracts).

    Returns:
        List of raw Nova vendor contract JSON records.
    """
    return list_all("/vendor-contracts", params=params, use_cache=use_cache, timeout=timeout)


def get_inventory(
    use_cache: bool = True,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Retrieve all inventory / product catalog items from Nova API (/inventory).

    Returns:
        List of raw Nova inventory item JSON records.
    """
    return list_all("/inventory", params=params, use_cache=use_cache, timeout=timeout)


def get_purchase_requisitions(
    use_cache: bool = True,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Retrieve all internal purchase requisitions from Nova API (/purchase-requisitions).

    Returns:
        List of raw Nova purchase requisition JSON records.
    """
    return list_all("/purchase-requisitions", params=params, use_cache=use_cache, timeout=timeout)


def get_supplier_quotes(
    use_cache: bool = True,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Retrieve all supplier quotes / RFP bids from Nova API (/supplier-quotes).

    Returns:
        List of raw Nova supplier quote JSON records.
    """
    return list_all("/supplier-quotes", params=params, use_cache=use_cache, timeout=timeout)


def get_goods_receipts(
    use_cache: bool = True,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Retrieve all goods receipts notes (GRNs) from Nova API (/goods-receipts).

    Returns:
        List of raw Nova goods receipt JSON records.
    """
    return list_all("/goods-receipts", params=params, use_cache=use_cache, timeout=timeout)
