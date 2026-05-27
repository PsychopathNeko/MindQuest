#!/usr/bin/env python3
"""
validate_scales.py — Structural validation for MindQuest scale JSON files.

Checks:
1. Score range continuity: ranges cover min_possible to maxTotal with no gaps
2. Non-empty description and suggestions in every range
3. crisisConfig questionIndex within questions array bounds
4. EN/ZH structural consistency (range count, min/max values)
5. Subscale range coverage matches subscale maxScore
6. Required fields present in every scale
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

SCALES_DIR = Path(__file__).resolve().parent.parent / "public" / "data" / "scales"


class ValidationError:
    def __init__(self, scale_id, lang, category, message):
        self.scale_id = scale_id
        self.lang = lang
        self.category = category
        self.message = message

    def __str__(self):
        return f"[{self.category}] {self.scale_id}.{self.lang}: {self.message}"


def load_scale(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def get_min_possible_score(scale):
    """Determine the minimum possible total score for a scale."""
    scoring = scale.get("scoring", {})
    method = scoring.get("method", "sum")
    questions = scale.get("questions", [])
    common_choices = scale.get("commonChoices")

    if common_choices is None:
        min_total = 0
        for q in questions:
            choices = q.get("choices", [])
            if choices:
                min_total += min(c["value"] for c in choices)
        return min_total

    min_item = min(c["value"] for c in common_choices) if common_choices else 0

    if method in ("subscale", "subscale_with_reverse"):
        subscales = scoring.get("subscales", [])
        if subscales:
            n_items = sum(len(s["items"]) for s in subscales)
        else:
            n_items = len(questions)
    elif method == "domain_max":
        groups = scoring.get("domainGroups", [])
        return min_item * len(groups)
    elif method == "special_aq10":
        return 0
    elif method == "mean_subscale":
        return 0
    else:
        scored_items = scoring.get("scoredItems")
        n_items = len(scored_items) if scored_items else len(questions)

    return min_item * n_items


def validate_ranges(scale, lang):
    errors = []
    scale_id = scale["meta"]["id"]
    interpretation = scale.get("interpretation", {})
    ranges = interpretation.get("ranges")
    scoring = scale.get("scoring", {})
    max_total = scoring.get("maxTotal")

    if ranges is None:
        if max_total is not None:
            errors.append(ValidationError(scale_id, lang, "RANGES", "Missing interpretation.ranges"))
        return errors

    if len(ranges) == 0:
        errors.append(ValidationError(scale_id, lang, "RANGES", "Empty interpretation.ranges array"))
        return errors

    for i, r in enumerate(ranges):
        if not r.get("description"):
            errors.append(ValidationError(scale_id, lang, "CONTENT", f"Range {i} ({r.get('label','?')}): empty description"))
        if not r.get("suggestions") or len(r.get("suggestions", [])) == 0:
            errors.append(ValidationError(scale_id, lang, "CONTENT", f"Range {i} ({r.get('label','?')}): empty or missing suggestions"))
        if "level" not in r:
            errors.append(ValidationError(scale_id, lang, "STRUCTURE", f"Range {i}: missing 'level' field"))
        if "label" not in r:
            errors.append(ValidationError(scale_id, lang, "STRUCTURE", f"Range {i}: missing 'label' field"))

    sorted_ranges = sorted(ranges, key=lambda r: r["min"])
    min_possible = get_min_possible_score(scale)

    if sorted_ranges[0]["min"] > min_possible:
        errors.append(ValidationError(
            scale_id, lang, "GAP",
            f"First range starts at {sorted_ranges[0]['min']} but min possible score is {min_possible}"
        ))

    if max_total is not None:
        if sorted_ranges[-1]["max"] < max_total:
            errors.append(ValidationError(
                scale_id, lang, "GAP",
                f"Last range ends at {sorted_ranges[-1]['max']} but maxTotal is {max_total}"
            ))

    for i in range(len(sorted_ranges) - 1):
        current_max = sorted_ranges[i]["max"]
        next_min = sorted_ranges[i + 1]["min"]
        if next_min > current_max + 1:
            errors.append(ValidationError(
                scale_id, lang, "GAP",
                f"Gap between ranges: {current_max} -> {next_min}"
            ))
        elif next_min <= current_max:
            errors.append(ValidationError(
                scale_id, lang, "OVERLAP",
                f"Overlapping ranges: range ending at {current_max} overlaps with range starting at {next_min}"
            ))

    return errors


def validate_subscale_ranges(scale, lang):
    errors = []
    scale_id = scale["meta"]["id"]
    interpretation = scale.get("interpretation", {})
    subscale_ranges = interpretation.get("subscaleRanges")
    scoring = scale.get("scoring", {})
    subscales = scoring.get("subscales")

    if not subscale_ranges or not subscales:
        return errors

    if not isinstance(subscale_ranges, dict):
        return errors

    subscale_map = {s["id"]: s for s in subscales}

    for sub_id, ranges in subscale_ranges.items():
        if sub_id not in subscale_map:
            errors.append(ValidationError(
                scale_id, lang, "SUBSCALE",
                f"subscaleRanges has '{sub_id}' not found in scoring.subscales"
            ))
            continue

        sub = subscale_map[sub_id]
        max_score = sub.get("maxScore", 0)

        if not ranges:
            errors.append(ValidationError(scale_id, lang, "SUBSCALE", f"Empty ranges for subscale '{sub_id}'"))
            continue

        sorted_ranges = sorted(ranges, key=lambda r: r["min"])

        if sorted_ranges[0]["min"] > 0:
            errors.append(ValidationError(
                scale_id, lang, "SUBSCALE_GAP",
                f"Subscale '{sub_id}': first range starts at {sorted_ranges[0]['min']}, expected 0"
            ))

        if sorted_ranges[-1]["max"] < max_score:
            errors.append(ValidationError(
                scale_id, lang, "SUBSCALE_GAP",
                f"Subscale '{sub_id}': last range ends at {sorted_ranges[-1]['max']}, maxScore is {max_score}"
            ))

        for i in range(len(sorted_ranges) - 1):
            if sorted_ranges[i + 1]["min"] > sorted_ranges[i]["max"] + 1:
                errors.append(ValidationError(
                    scale_id, lang, "SUBSCALE_GAP",
                    f"Subscale '{sub_id}': gap {sorted_ranges[i]['max']} -> {sorted_ranges[i+1]['min']}"
                ))

        for i, r in enumerate(ranges):
            if not r.get("description"):
                errors.append(ValidationError(
                    scale_id, lang, "SUBSCALE_CONTENT",
                    f"Subscale '{sub_id}' range {i} ({r.get('label','?')}): empty description"
                ))

    return errors


def validate_crisis_config(scale, lang):
    errors = []
    scale_id = scale["meta"]["id"]
    crisis = scale.get("crisisConfig")

    if not crisis:
        return errors

    crisis_type = crisis.get("type")
    questions = scale.get("questions", [])
    max_index = len(questions) - 1

    if crisis_type == "item":
        items = crisis.get("items", [])
        if not items:
            errors.append(ValidationError(scale_id, lang, "CRISIS", "type='item' but no items array"))
        for item in items:
            qi = item.get("questionIndex")
            if qi is None:
                errors.append(ValidationError(scale_id, lang, "CRISIS", "item missing questionIndex"))
            elif qi < 0 or qi > max_index:
                errors.append(ValidationError(
                    scale_id, lang, "CRISIS",
                    f"questionIndex {qi} out of bounds (0-{max_index})"
                ))
            if "threshold" not in item:
                errors.append(ValidationError(scale_id, lang, "CRISIS", f"item questionIndex={qi} missing threshold"))

    elif crisis_type == "level":
        threshold = crisis.get("levelThreshold")
        if not threshold:
            errors.append(ValidationError(scale_id, lang, "CRISIS", "type='level' but no levelThreshold"))
        else:
            ranges = scale.get("interpretation", {}).get("ranges", [])
            levels = {r.get("level") for r in ranges}
            if threshold not in levels:
                errors.append(ValidationError(
                    scale_id, lang, "CRISIS",
                    f"levelThreshold '{threshold}' not found in ranges. Available: {levels}"
                ))
    else:
        errors.append(ValidationError(scale_id, lang, "CRISIS", f"Unknown crisis type: '{crisis_type}'"))

    return errors


def validate_en_zh_consistency(en_scale, zh_scale):
    errors = []
    scale_id = en_scale["meta"]["id"]

    en_ranges = en_scale.get("interpretation", {}).get("ranges") or []
    zh_ranges = zh_scale.get("interpretation", {}).get("ranges") or []

    if len(en_ranges) != len(zh_ranges):
        errors.append(ValidationError(
            scale_id, "en/zh", "CONSISTENCY",
            f"Range count mismatch: EN={len(en_ranges)}, ZH={len(zh_ranges)}"
        ))
    else:
        for i, (en_r, zh_r) in enumerate(zip(en_ranges, zh_ranges)):
            if en_r["min"] != zh_r["min"] or en_r["max"] != zh_r["max"]:
                errors.append(ValidationError(
                    scale_id, "en/zh", "CONSISTENCY",
                    f"Range {i} min/max mismatch: EN=[{en_r['min']},{en_r['max']}] ZH=[{zh_r['min']},{zh_r['max']}]"
                ))
            if en_r.get("level") != zh_r.get("level"):
                errors.append(ValidationError(
                    scale_id, "en/zh", "CONSISTENCY",
                    f"Range {i} level mismatch: EN='{en_r.get('level')}' ZH='{zh_r.get('level')}'"
                ))

    en_crisis = en_scale.get("crisisConfig")
    zh_crisis = zh_scale.get("crisisConfig")
    if bool(en_crisis) != bool(zh_crisis):
        errors.append(ValidationError(
            scale_id, "en/zh", "CONSISTENCY",
            f"crisisConfig presence mismatch: EN={'yes' if en_crisis else 'no'}, ZH={'yes' if zh_crisis else 'no'}"
        ))

    en_sub = en_scale.get("interpretation", {}).get("subscaleRanges") or {}
    zh_sub = zh_scale.get("interpretation", {}).get("subscaleRanges") or {}
    en_keys = set(en_sub.keys()) if isinstance(en_sub, dict) else set()
    zh_keys = set(zh_sub.keys()) if isinstance(zh_sub, dict) else set()
    if en_keys != zh_keys:
        errors.append(ValidationError(
            scale_id, "en/zh", "CONSISTENCY",
            f"subscaleRanges keys mismatch: EN={en_keys}, ZH={zh_keys}"
        ))

    en_q = len(en_scale.get("questions", []))
    zh_q = len(zh_scale.get("questions", []))
    if en_q != zh_q:
        errors.append(ValidationError(
            scale_id, "en/zh", "CONSISTENCY",
            f"Question count mismatch: EN={en_q}, ZH={zh_q}"
        ))

    return errors


def validate_required_fields(scale, lang):
    errors = []
    scale_id = scale.get("meta", {}).get("id", "unknown")

    for field in ["id", "name", "fullName", "description", "instruction"]:
        if not scale.get("meta", {}).get(field):
            errors.append(ValidationError(scale_id, lang, "REQUIRED", f"Missing meta.{field}"))

    if not scale.get("questions") or len(scale.get("questions", [])) == 0:
        errors.append(ValidationError(scale_id, lang, "REQUIRED", "Missing or empty questions array"))

    if not scale.get("scoring"):
        errors.append(ValidationError(scale_id, lang, "REQUIRED", "Missing scoring config"))
    elif not scale["scoring"].get("method"):
        errors.append(ValidationError(scale_id, lang, "REQUIRED", "Missing scoring.method"))

    return errors


def run_validation(scales_dir=None):
    if scales_dir is None:
        scales_dir = SCALES_DIR

    all_errors = []
    scale_count = 0
    en_files = sorted(scales_dir.glob("*.en.json"))

    for en_path in en_files:
        scale_id = en_path.name.replace(".en.json", "")
        zh_path = scales_dir / f"{scale_id}.zh.json"

        try:
            en_scale = load_scale(en_path)
        except Exception as e:
            all_errors.append(ValidationError(scale_id, "en", "PARSE", f"Failed to parse: {e}"))
            continue

        scale_count += 1

        all_errors.extend(validate_required_fields(en_scale, "en"))
        all_errors.extend(validate_ranges(en_scale, "en"))
        all_errors.extend(validate_subscale_ranges(en_scale, "en"))
        all_errors.extend(validate_crisis_config(en_scale, "en"))

        if zh_path.exists():
            try:
                zh_scale = load_scale(zh_path)
                all_errors.extend(validate_required_fields(zh_scale, "zh"))
                all_errors.extend(validate_ranges(zh_scale, "zh"))
                all_errors.extend(validate_subscale_ranges(zh_scale, "zh"))
                all_errors.extend(validate_crisis_config(zh_scale, "zh"))
                all_errors.extend(validate_en_zh_consistency(en_scale, zh_scale))
            except Exception as e:
                all_errors.append(ValidationError(scale_id, "zh", "PARSE", f"Failed to parse: {e}"))
        else:
            all_errors.append(ValidationError(scale_id, "zh", "MISSING", "Chinese version not found"))

    sep = '=' * 60
    print(f"\n{sep}")
    print(f"MindQuest Scale Validation Report")
    print(f"{sep}")
    print(f"Scales validated: {scale_count}")
    print(f"Total issues found: {len(all_errors)}")

    if all_errors:
        by_category = defaultdict(list)
        for err in all_errors:
            by_category[err.category].append(err)

        print(f"\nIssues by category:")
        for cat in sorted(by_category.keys()):
            errs = by_category[cat]
            print(f"\n  [{cat}] ({len(errs)} issues)")
            for err in errs:
                print(f"    - {err}")
    else:
        print("\nAll scales passed validation!")

    return all_errors


if __name__ == "__main__":
    errors = run_validation()
    sys.exit(1 if errors else 0)
