#!/usr/bin/env python3
"""Enhance MindQuest psychological scale JSON files with clinical data.

Usage:
    python scripts/enhance_scales.py              # apply all enhancements
    python scripts/enhance_scales.py --dry-run    # preview changes without writing
    python scripts/enhance_scales.py --crisis-only # only add crisisConfig entries
"""

import json
import sys
from pathlib import Path

SCALES_DIR = Path(__file__).resolve().parent.parent / "public" / "data" / "scales"
ENHANCEMENTS_DIR = Path(__file__).resolve().parent / "enhancements"

# ============================================================
# CRISIS CONFIG — new crisisConfig entries to add
# ============================================================
CRISIS_CONFIG = {
    "dass-21": {
        "type": "item",
        "items": [{"questionIndex": 20, "threshold": 2}]
    },
    "gds-15": {"type": "level", "levelThreshold": "severe"},
    "k10": {"type": "level", "levelThreshold": "severe"},
    "k6": {"type": "level", "levelThreshold": "severe"},
    "smfq": {"type": "level", "levelThreshold": "significant"},
    "pcl-5": {"type": "level", "levelThreshold": "severe"},
    "ies-r": {"type": "level", "levelThreshold": "severe"},
    "ces-d": {"type": "level", "levelThreshold": "severe"},
    "eat-26": {"type": "level", "levelThreshold": "severe"},
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def load_enhancements():
    """Load all enhancement data from scripts/enhancements/*.json files.

    Returns two dicts: en_data[scale_id] and zh_data[scale_id], each containing
    optional keys: 'ranges', 'subscaleRanges'.
    """
    en_data = {}
    zh_data = {}

    if not ENHANCEMENTS_DIR.exists():
        return en_data, zh_data

    for fpath in sorted(ENHANCEMENTS_DIR.glob("*.json")):
        name = fpath.stem  # e.g. "batch1.en" or "batch1.zh"
        parts = name.rsplit(".", 1)
        if len(parts) != 2 or parts[1] not in ("en", "zh"):
            print(f"  [SKIP] {fpath.name} — expected format: batchN.en.json or batchN.zh.json")
            continue

        lang = parts[1]
        batch_data = load_json(fpath)
        target = en_data if lang == "en" else zh_data

        for scale_id, enh in batch_data.items():
            if scale_id in target:
                print(f"  [WARN] Duplicate enhancement for {scale_id}.{lang}, overwriting")
            target[scale_id] = enh

    return en_data, zh_data


def apply_crisis_config(scale_id, data):
    """Add crisisConfig to a scale if it doesn't already have one."""
    if scale_id in CRISIS_CONFIG and "crisisConfig" not in data:
        data["crisisConfig"] = CRISIS_CONFIG[scale_id]
        return True
    return False


def apply_enhancements(data, enhancements):
    """Merge enhancement data into a scale's interpretation section.

    enhancements may contain:
      - ranges: replaces interpretation.ranges entirely
      - subscaleRanges: replaces interpretation.subscaleRanges entirely
    """
    if not enhancements:
        return False

    changed = False
    interp = data.get("interpretation")
    if not interp:
        return False

    if "ranges" in enhancements:
        interp["ranges"] = enhancements["ranges"]
        changed = True

    if "subscaleRanges" in enhancements:
        interp["subscaleRanges"] = enhancements["subscaleRanges"]
        changed = True

    return changed


def main():
    dry_run = "--dry-run" in sys.argv
    crisis_only = "--crisis-only" in sys.argv

    if dry_run:
        print("=== DRY RUN — no files will be modified ===\n")

    # Load enhancement data
    en_data, zh_data = load_enhancements()
    print(f"Loaded enhancements: {len(en_data)} EN, {len(zh_data)} ZH scales\n")

    # Gather all scale IDs from .en.json files
    en_files = sorted(SCALES_DIR.glob("*.en.json"))
    stats = {"crisis_added": 0, "en_enhanced": 0, "zh_enhanced": 0, "skipped": 0}

    for en_file in en_files:
        scale_id = en_file.stem.replace(".en", "")
        zh_file = SCALES_DIR / f"{scale_id}.zh.json"

        # Process EN file
        en_scale = load_json(en_file)
        en_changed = False

        # Apply crisisConfig
        if apply_crisis_config(scale_id, en_scale):
            en_changed = True
            stats["crisis_added"] += 1
            print(f"  [CRISIS] {scale_id} — added crisisConfig")

        # Apply content enhancements
        if not crisis_only and scale_id in en_data:
            if apply_enhancements(en_scale, en_data[scale_id]):
                en_changed = True
                stats["en_enhanced"] += 1
                print(f"  [EN] {scale_id} — enhanced interpretation")

        if en_changed and not dry_run:
            save_json(en_file, en_scale)

        # Process ZH file
        if zh_file.exists():
            zh_scale = load_json(zh_file)
            zh_changed = False

            # Apply same crisisConfig (structure is language-independent)
            if apply_crisis_config(scale_id, zh_scale):
                zh_changed = True

            if not crisis_only and scale_id in zh_data:
                if apply_enhancements(zh_scale, zh_data[scale_id]):
                    zh_changed = True
                    stats["zh_enhanced"] += 1
                    print(f"  [ZH] {scale_id} — enhanced interpretation")

            if zh_changed and not dry_run:
                save_json(zh_file, zh_scale)

    print(f"\n=== Summary ===")
    print(f"  Crisis configs added: {stats['crisis_added']}")
    print(f"  EN interpretations enhanced: {stats['en_enhanced']}")
    print(f"  ZH interpretations enhanced: {stats['zh_enhanced']}")
    if dry_run:
        print("  (dry run — no files were written)")


if __name__ == "__main__":
    main()
