"""
LeakGuard AI - AI Investigation Service.

Provides an AI explanation layer for verified procurement spend leakage findings.
Explains only supplied deterministic evidence without calculating or altering
financial numbers, inventing facts, or creating unsupported findings.
"""

import json
import os
from typing import Any, Dict, List
import httpx

SYSTEM_INSTRUCTION = (
    "You are a procurement forensic investigation analyst for SpendIntel.\n"
    "Explain and summarize only the verified evidence provided.\n"
    "Never calculate or invent financial values, contracts, dates, suppliers, or motives.\n"
    "Do not claim fraud without supporting rules or verifiable data.\n"
    "If information is unavailable, explicitly state that it is unavailable."
)


def _clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Strip markdown code formatting and parse raw JSON response."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("AI response did not return a JSON object")

    summary = str(parsed.get("summary", "")).strip()
    root_cause = str(parsed.get("root_cause", "")).strip()
    evidence_points = [str(item).strip() for item in parsed.get("evidence_points", []) if item]
    recommended_actions = [str(item).strip() for item in parsed.get("recommended_actions", []) if item]

    return {
        "summary": summary,
        "root_cause": root_cause,
        "evidence_points": evidence_points,
        "recommended_actions": recommended_actions,
    }


def _call_gemini(api_key: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    """Call Google Gemini REST API."""
    model = os.getenv("AI_MODEL", "gemini-2.0-flash").strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    user_prompt = (
        f"{SYSTEM_INSTRUCTION}\n\n"
        "Explain the following procurement spend leakage evidence:\n"
        f"{json.dumps(evidence, indent=2)}\n\n"
        "Return strictly valid JSON with this schema:\n"
        "{\n"
        '    "summary": "Executive explanation of the finding",\n'
        '    "root_cause": "Primary cause of price deviation based on provided evidence",\n'
        '    "evidence_points": [\n'
        '        "Key fact 1",\n'
        '        "Key fact 2"\n'
        "    ],\n"
        '    "recommended_actions": [\n'
        '        "Action 1",\n'
        '        "Action 2"\n'
        "    ]\n"
        "}"
    )

    payload = {
        "systemInstruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        },
        "contents": [
            {
                "parts": [{"text": user_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    with httpx.Client(timeout=15.0) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("No candidates returned from Gemini API")
        content_parts = candidates[0].get("content", {}).get("parts", [])
        if not content_parts:
            raise ValueError("Empty content returned from Gemini API")
        raw_text = content_parts[0].get("text", "")
        return _clean_json_response(raw_text)


def _call_openrouter(api_key: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    """Call OpenRouter chat completions endpoint."""
    model = os.getenv("AI_MODEL", "google/gemini-2.0-flash-001").strip()
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://leakguard.ai",
        "X-Title": "LeakGuard AI",
    }

    user_prompt = (
        "Explain the following procurement spend leakage evidence:\n"
        f"{json.dumps(evidence, indent=2)}\n\n"
        "Return strictly valid JSON with this schema:\n"
        "{\n"
        '    "summary": "Executive explanation of the finding",\n'
        '    "root_cause": "Primary cause of price deviation based on provided evidence",\n'
        '    "evidence_points": [\n'
        '        "Key fact 1",\n'
        '        "Key fact 2"\n'
        "    ],\n"
        '    "recommended_actions": [\n'
        '        "Action 1",\n'
        '        "Action 2"\n'
        "    ]\n"
        "}"
    )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    with httpx.Client(timeout=15.0) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            raise ValueError("No choices returned from OpenRouter API")
        raw_text = choices[0].get("message", {}).get("content", "")
        return _clean_json_response(raw_text)


def _generate_fallback(evidence: Dict[str, Any], reason: str = "AI_API_KEY is not configured") -> Dict[str, Any]:
    """
    Produce a deterministic fallback response when AI is unavailable or fails.
    Ensures the application never breaks.
    """
    finding = evidence.get("finding", {})
    evidence_steps = evidence.get("evidence", [])
    deterministic_summary = evidence.get("analyst_summary", "")

    product = finding.get("product_name") or finding.get("product", "Item")
    supplier = finding.get("supplier", "Supplier")
    actual_price = finding.get("actual_price", 0.0)
    benchmark_price = finding.get("benchmark_price", 0.0)
    variance_pct = finding.get("variance_percent", 0.0)
    potential_leakage = finding.get("potential_leakage", 0.0)
    quantity = finding.get("quantity", 0)

    # Build evidence points from provided steps if available
    evidence_points: List[str] = []
    if evidence_steps:
        for step in evidence_steps:
            title = step.get("title", "")
            desc = step.get("description", "")
            val = step.get("value", "")
            if val and desc:
                evidence_points.append(f"{title}: {desc} ({val})")
            elif desc:
                evidence_points.append(f"{title}: {desc}")
    else:
        evidence_points = [
            f"Purchase quantity of {quantity} units of {product} from {supplier}.",
            f"Actual invoiced rate of ₹{actual_price:,.2f} versus benchmark rate of ₹{benchmark_price:,.2f}.",
            f"Detected price variance of {variance_pct:.2f}% across the transaction.",
            f"Identified spend leakage impact of ₹{potential_leakage:,.2f}.",
        ]

    if deterministic_summary:
        summary = f"Verified Audit Analysis: {deterministic_summary}"
    else:
        summary = (
            f"Verified Audit Analysis: "
            f"{quantity} units of {product} were procured from {supplier} with {variance_pct:.2f}% price variance."
        )

    root_cause = evidence.get("root_cause") or (
        f"Unit price of ₹{actual_price:,.2f} exceeded the verified benchmark of ₹{benchmark_price:,.2f} "
        f"by {variance_pct:.2f}% without an active volume discount or negotiated rate card."
    )

    recommended_actions = evidence.get("recommended_actions") or [
        f"Validate purchase order terms with {supplier} against the contracted benchmark index.",
        f"Issue a procurement reconciliation notice or debit note for the ₹{potential_leakage:,.2f} variance.",
        "Enforce centralized catalog routing for subsequent requisitions of this SKU.",
    ]

    return {
        "summary": summary,
        "root_cause": root_cause,
        "evidence_points": evidence_points,
        "recommended_actions": recommended_actions,
    }


def generate_investigation(evidence: dict) -> Dict[str, Any]:
    """
    Generate an AI-powered explanation of verified procurement evidence.

    - Explains only provided evidence.
    - Never modifies financial values.
    - Supports 'gemini' and 'openrouter' via AI_PROVIDER environment variable.
    - Gracefully returns deterministic fallback if AI_API_KEY is missing or provider fails.
    """
    api_key = os.getenv("AI_API_KEY", "").strip()
    provider = os.getenv("AI_PROVIDER", "gemini").lower().strip()

    # Fallback to provider-specific keys if AI_API_KEY is not set
    if not api_key:
        if provider == "openrouter":
            api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        else:
            api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        return _generate_fallback(evidence, reason="AI_API_KEY environment variable is not configured")

    try:
        if provider == "openrouter":
            return _call_openrouter(api_key, evidence)
        else:
            # Default to gemini provider
            return _call_gemini(api_key, evidence)
    except Exception as e:
        # Gracefully handle any API, network, or parsing failure
        return _generate_fallback(evidence, reason=f"AI provider '{provider}' error: {str(e)}")
