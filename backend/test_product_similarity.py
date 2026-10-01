import pytest
import pandas as pd
from backend.app.services.product_similarity import (
    extract_product_attributes,
    compute_product_similarity,
    analyze_product_intelligence,
    DEFAULT_WEIGHTS,
)


def test_zero_price_dependency_in_similarity():
    """Requirement 1 & 10: Price MUST NOT be used in similarity score calculation."""
    prod_a = extract_product_attributes({
        "product_name": "USB-C Fast Charging Cable 60W 1m Braided Nylon",
        "category": "Cables & Adapters",
        "description": "USB-C fast charging cable, 1 meter, braided nylon, 60W power delivery",
        "brand": "Anker",
        "model": "PowerLine",
        "unit_price": 500.0,
        "quantity": 10
    })
    prod_b_low_price = extract_product_attributes({
        "product_name": "Type-C Braided Charging Cable 1m 60W",
        "category": "Cables & Adapters",
        "description": "Type-C braided charging cable, 1m, supports 60W fast charging",
        "brand": "Anker",
        "model": "PowerLine",
        "unit_price": 500.0,
        "quantity": 10
    })
    prod_b_high_price = extract_product_attributes({
        "product_name": "Type-C Braided Charging Cable 1m 60W",
        "category": "Cables & Adapters",
        "description": "Type-C braided charging cable, 1m, supports 60W fast charging",
        "brand": "Anker",
        "model": "PowerLine",
        "unit_price": 500000.0,  # 1000x price difference!
        "quantity": 10
    })

    sim_low = compute_product_similarity(prod_a, prod_b_low_price)
    sim_high = compute_product_similarity(prod_a, prod_b_high_price)

    assert sim_low["similarity_score"] == sim_high["similarity_score"], "Similarity score must be independent of price!"
    assert sim_low["classification"] == sim_high["classification"]
    assert sim_low["similarity_score"] >= 80.0


def test_equal_price_different_specification():
    """Requirement 13 & Jury Feedback: Equal Price with materially different specifications."""
    laptop_a = extract_product_attributes({
        "product_name": "Enterprise Workstation Laptop 14-inch 8GB RAM 256GB SSD",
        "category": "IT Equipment",
        "description": "Enterprise laptop with 8GB RAM and 256GB SSD storage",
        "brand": "Dell",
        "model": "Latitude 3420",
        "unit_price": 10000.0,
        "quantity": 5
    })
    laptop_b = extract_product_attributes({
        "product_name": "Enterprise Workstation Laptop 14-inch 16GB RAM 512GB SSD",
        "category": "IT Equipment",
        "description": "Enterprise laptop with 16GB RAM and 512GB SSD storage",
        "brand": "Dell",
        "model": "Latitude 3420",
        "unit_price": 10000.0,  # Exact same price!
        "quantity": 5
    })

    result = compute_product_similarity(laptop_a, laptop_b)
    # Price is same, but specs (RAM, SSD) differ
    assert result["price_a"] == result["price_b"]
    assert result["procurement_case"] == "CASE_C_EQUAL_PRICE_DIFFERENT_SPEC"
    assert result["is_equal_price_different_spec"] is True
    diff_text = " ".join(result["different_attributes"])
    assert "RAM" in diff_text or "Storage" in diff_text
    assert "Equal transaction price" in result["explanation"]


def test_specification_differentiation_laptops():
    """Requirement 4: Core i5/16GB/512GB vs Core i7/32GB/1TB."""
    laptop_mid = extract_product_attributes({
        "product_name": "Dell Latitude 5440 i5 16GB 512GB SSD",
        "category": "Laptops",
        "description": "Dell Latitude 5440 Laptop Core i5 16GB RAM 512GB SSD",
        "brand": "Dell",
        "model": "Latitude 5440",
        "unit_price": 65000.0
    })
    laptop_high = extract_product_attributes({
        "product_name": "Dell Latitude 5440 i7 32GB 1TB SSD",
        "category": "Laptops",
        "description": "Dell Latitude 5440 Laptop Core i7 32GB RAM 1TB SSD",
        "brand": "Dell",
        "model": "Latitude 5440",
        "unit_price": 85000.0
    })

    result = compute_product_similarity(laptop_mid, laptop_high)
    diff_str = " ".join(result["different_attributes"]).lower()
    assert "ram" in diff_str
    assert "storage" in diff_str
    assert "cpu" in diff_str or "processor" in diff_str
    assert laptop_mid["specifications"]["ram"] == "16GB"
    assert laptop_high["specifications"]["ram"] == "32GB"
    assert laptop_mid["specifications"]["storage"] == "512GB"
    assert laptop_high["specifications"]["storage"] == "1TB"


def test_pack_size_and_unit_normalization():
    """Requirement 5: 1L @ ₹500 vs 500ml @ ₹275 -> Normalized unit rates."""
    item_1l = extract_product_attributes({
        "product_name": "Sanitizer Liquid 1 Litre Can",
        "category": "Facility Supplies",
        "description": "Hospital grade disinfectant sanitizer liquid 1L bottle",
        "unit_price": 500.0,
        "quantity": 10
    })
    item_500ml = extract_product_attributes({
        "product_name": "Sanitizer Liquid 500ml Pack",
        "category": "Facility Supplies",
        "description": "Hospital grade disinfectant sanitizer liquid 500ml bottle",
        "unit_price": 275.0,
        "quantity": 10
    })

    result = compute_product_similarity(item_1l, item_500ml)
    assert item_1l["specifications"]["volume"] == "1L"
    assert item_500ml["specifications"]["volume"] == "500ml"
    assert result["normalized_price_a"] == 500.0
    assert result["normalized_price_b"] == 550.0  # 275 / 0.5L = 550 per L
    assert result["procurement_case"] == "CASE_F_PACK_SIZE_DIFFERENCE"


def test_box_quantity_normalization():
    """Requirement 5: 1 box x 100 units vs 10 boxes x 10 units."""
    item_box100 = extract_product_attributes({
        "product_name": "Ballpoint Pens Box of 100 Blue",
        "category": "Office Supplies",
        "description": "1 box x 100 units ballpoint pens blue ink",
        "unit_price": 400.0
    })
    item_10boxes10 = extract_product_attributes({
        "product_name": "Ballpoint Pens 10 Boxes of 10 Blue",
        "category": "Office Supplies",
        "description": "10 boxes x 10 units ballpoint pens blue ink",
        "unit_price": 450.0
    })

    result = compute_product_similarity(item_box100, item_10boxes10)
    assert item_box100["pack_quantity"] == 100.0
    assert item_10boxes10["pack_quantity"] == 100.0
    match_str = " ".join(result["matching_attributes"]).lower()
    assert "pack" in match_str


def test_brand_model_differentiation():
    """Requirement 6: Dell Latitude 5440 vs HP ProBook 440 G10."""
    dell = extract_product_attributes({
        "product_name": "Dell Latitude 5440 Business Laptop",
        "category": "Laptops",
        "description": "Dell Latitude 5440 14 inch commercial notebook",
        "brand": "Dell",
        "model": "Latitude 5440",
        "unit_price": 70000.0
    })
    hp = extract_product_attributes({
        "product_name": "HP ProBook 440 G10 Business Laptop",
        "category": "Laptops",
        "description": "HP ProBook 440 G10 14 inch commercial notebook",
        "brand": "HP",
        "model": "ProBook 440 G10",
        "unit_price": 70000.0
    })

    result = compute_product_similarity(dell, hp)
    assert result["scores_breakdown"]["brand_model"] < 50.0
    diff_str = " ".join(result["different_attributes"]).lower()
    assert "brand" in diff_str or "model" in diff_str
    assert result["similarity_score"] < 90.0  # Not identical


def test_zero_fabrication_for_missing_attributes():
    """Requirement 2, 7 & 8: Never fabricate specifications, reviews, or quality."""
    plain_item_a = extract_product_attributes({
        "product_name": "Plain Wooden Desk",
        "category": "Furniture",
        "description": "Solid timber office workstation desk",
        "unit_price": 12000.0
    })
    plain_item_b = extract_product_attributes({
        "product_name": "Plain Wooden Desk",
        "category": "Furniture",
        "description": "Solid timber office workstation desk",
        "unit_price": 12500.0
    })

    assert plain_item_a["quality_grade"] is None
    assert plain_item_a["warranty"] is None
    assert plain_item_a["rating"] is None
    assert plain_item_a["review_count"] is None

    result = compute_product_similarity(plain_item_a, plain_item_b)
    unavail_str = " ".join(result["unavailable_attributes"]).lower()
    assert "quality" in unavail_str
    assert "review" in unavail_str or "rating" in unavail_str


def test_supplier_differentiation_consolidation():
    """Requirement 9: Printer Paper A4 75 GSM across Supplier A and Supplier B."""
    paper_sup_a = extract_product_attributes({
        "product_name": "Printer Paper A4 75 GSM 500 Sheets",
        "category": "Paper Supplies",
        "description": "Multipurpose copy paper A4 size 75 GSM 500 sheets ream",
        "supplier": "Staples Direct",
        "unit_price": 240.0
    })
    paper_sup_b = extract_product_attributes({
        "product_name": "Office Paper A4 75 GSM 500 Sheets",
        "category": "Paper Supplies",
        "description": "Multipurpose office copy paper A4 75 GSM 500 sheets",
        "supplier": "OfficeMax Corp",
        "unit_price": 280.0
    })

    result = compute_product_similarity(paper_sup_a, paper_sup_b)
    assert result["similarity_score"] >= 80.0
    assert result["classification"] in ["NEAR IDENTICAL", "HIGHLY COMPARABLE", "HIGHLY_COMPARABLE"]
    assert result["supplier_a"] != result["supplier_b"]
    assert "supplier" in [d.lower() for d in result["different_attributes"]] or result["supplier_a"] != result["supplier_b"]


def test_custom_configurable_weights():
    """Requirement 10: Weights must be configurable."""
    item_a = extract_product_attributes({
        "product_name": "Ergonomic Mesh Chair Grade A 5-year warranty",
        "category": "Furniture",
        "description": "Ergonomic mesh chair with lumbar support Grade A 5-Year warranty",
        "unit_price": 8000.0
    })
    item_b = extract_product_attributes({
        "product_name": "Basic Office Chair Grade B 1-year warranty",
        "category": "Furniture",
        "description": "Standard office desk chair Grade B 1-Year warranty",
        "unit_price": 8000.0
    })

    # Default weights
    sim_default = compute_product_similarity(item_a, item_b)

    # Custom weights emphasizing quality to 50%
    custom_weights = {
        "category": 0.10,
        "description": 0.10,
        "specifications": 0.10,
        "unit_pack_size": 0.10,
        "brand_model": 0.10,
        "quality": 0.50,
        "reviews": 0.00
    }
    sim_custom = compute_product_similarity(item_a, item_b, custom_weights=custom_weights)

    # Quality difference pulls score down even more with higher quality weight
    assert sim_custom["similarity_score"] < sim_default["similarity_score"]


def test_analyze_product_intelligence_pipeline():
    """Requirement 14, 15, 20: Full analysis on DataFrame producing KPIs, matrix, groups, and findings."""
    df = pd.DataFrame([
        {
            "product_name": "USB-C Cable 60W 1m",
            "category": "Electronics",
            "description": "USB-C cable 1m 60W fast charging",
            "unit_price": 800.0,
            "quantity": 10,
            "supplier": "Vendor A"
        },
        {
            "product_name": "USB-C Cable 100W 3m",
            "category": "Electronics",
            "description": "USB-C cable 3m 100W high power",
            "unit_price": 800.0,  # Equal price, different spec!
            "quantity": 10,
            "supplier": "Vendor B"
        },
        {
            "product_name": "Printer Paper A4 75 GSM",
            "category": "Office",
            "description": "A4 copy paper 75 GSM 500 sheets",
            "unit_price": 250.0,
            "quantity": 20,
            "supplier": "Vendor C"
        },
        {
            "product_name": "Office Paper A4 75 GSM",
            "category": "Office",
            "description": "A4 copy paper 75 GSM 500 sheets",
            "unit_price": 290.0,
            "quantity": 20,
            "supplier": "Vendor D"
        }
    ])

    report = analyze_product_intelligence(df)

    assert "summary_kpis" in report
    kpis = report["summary_kpis"]
    assert kpis["total_products"] >= 2
    assert "comparisons" in report
    assert "findings" in report
    assert "comparable_groups" in report

    # Check that finding types exist
    finding_types = [f["type"] for f in report["findings"]]
    assert any("EQUAL_PRICE_DIFFERENT_SPECIFICATION" in ft or "SPECIFICATION_DIFFERENCE" in ft or "PRODUCT_SIMILARITY" in ft for ft in finding_types)
