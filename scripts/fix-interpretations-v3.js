/**
 * fix-interpretations-v3.js
 * Fixes 3 remaining directionality issues found in final review:
 * Issue 1: UWES-9 (Work Engagement) - positive scale wrongly got general domain
 * Issue 2: SPANE negative subscale - reverse-scored subscale wrongly got wellbeing
 * Issue 3: MLQ search subscale - neutral scale wrongly got wellbeing
 */

const fs = require("fs");
const path = require("path");

const zhDesc = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "zh-descriptions.json"), "utf8"));
const enDesc = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "en-descriptions.json"), "utf8"));
const zhSugg = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "zh-suggestions.json"), "utf8"));
const enSugg = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "en-suggestions.json"), "utf8"));

let changeCount = 0;
function log(msg) { console.log(msg); }

function normalizeSeverity(level) {
  const l = level.toLowerCase();
  if (["minimal", "low", "none", "normal"].includes(l)) return "normal";
  if (["mild", "slight"].includes(l)) return "mild";
  if (["moderate", "medium"].includes(l)) return "moderate";
  if (["severe", "high", "significant", "very_high"].includes(l)) return "severe";
  return l;
}

function replaceDescription(range, oldText, newText, context) {
  const oldDesc = range.description;
  if (!oldDesc.includes(oldText)) {
    const trimmed = oldText.trim();
    if (oldDesc.includes(trimmed)) {
      log("  [INFO] " + context + ": Found trimmed version, proceeding");
      range.description = oldDesc.replace(trimmed, "").replace(/\s+$/, "") + " " + newText;
      changeCount++;
      log("  [FIX] " + context + ": Replaced description");
      return true;
    }
    log("  [WARN] " + context + ": Could not find old description text to remove");
    return false;
  }
  const cleaned = oldDesc.replace(oldText, "").replace(/\s+$/, "");
  range.description = cleaned + " " + newText;
  changeCount++;
  log("  [FIX] " + context + ": Replaced description");
  log("    OLD: " + oldDesc.substring(0, 90) + "...");
  log("    NEW: " + range.description.substring(0, 90) + "...");
  return true;
}

function replaceSuggestions(range, oldPool, newPool, context) {
  const before = range.suggestions.length;
  const filtered = range.suggestions.filter(s => !oldPool.includes(s));
  const removed = before - filtered.length;
  if (removed === 0) {
    log("  [WARN] " + context + ": No old suggestion pool entries found to remove");
    return false;
  }
  const slotsAvailable = Math.max(0, 5 - filtered.length);
  const toAdd = newPool.slice(0, slotsAvailable);
  range.suggestions = [...filtered, ...toAdd];
  changeCount++;
  log("  [FIX] " + context + ": Removed " + removed + " old, added " + toAdd.length + " new (total: " + range.suggestions.length + ")");
  return true;
}

// ISSUE 1: UWES-9 - Replace general with wellbeing
function fixUWES9(lang) {
  const filePath = lang === "zh"
    ? path.resolve(__dirname, "..", "src", "scales-data-c", "uwes-9.zh.json")
    : path.resolve(__dirname, "..", "src", "scales-data-c", "uwes-9.en.json");
  const desc = lang === "zh" ? zhDesc : enDesc;
  const sugg = lang === "zh" ? zhSugg : enSugg;

  log("\n=== ISSUE 1: UWES-9 (" + lang + ") ===");
  log("File: " + filePath);

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const levelMap = { "low": "normal", "moderate": "moderate", "high": "severe" };

  log("\n  --- Main ranges ---");
  for (const range of data.interpretation.ranges) {
    const sevKey = levelMap[range.level];
    if (!sevKey) { log("  [SKIP] Unknown level: " + range.level); continue; }
    replaceDescription(range, desc.general[sevKey], desc.wellbeing[sevKey], "main/" + range.level);
    replaceSuggestions(range, sugg.general[sevKey], sugg.wellbeing[sevKey], "main/" + range.level);
  }

  for (const subId of ["vigor", "dedication", "absorption"]) {
    log("\n  --- Subscale: " + subId + " ---");
    const subRanges = data.interpretation.subscaleRanges[subId];
    if (!subRanges) { log("  [WARN] No subscaleRanges for " + subId); continue; }
    for (const range of subRanges) {
      const sevKey = levelMap[range.level];
      if (!sevKey) { log("  [SKIP] Unknown level: " + range.level); continue; }
      replaceDescription(range, desc.general[sevKey], desc.wellbeing[sevKey], subId + "/" + range.level);
      replaceSuggestions(range, sugg.general[sevKey], sugg.wellbeing[sevKey], subId + "/" + range.level);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  log("  [SAVED] " + filePath);
}

// ISSUE 2: SPANE negative subscale - swap wellbeing severity
function fixSPANENegative(lang) {
  const filePath = lang === "zh"
    ? path.resolve(__dirname, "..", "src", "scales-data-c", "spane.zh.json")
    : path.resolve(__dirname, "..", "src", "scales-data-c", "spane.en.json");
  const desc = lang === "zh" ? zhDesc : enDesc;
  const sugg = lang === "zh" ? zhSugg : enSugg;

  log("\n=== ISSUE 2: SPANE Negative Subscale (" + lang + ") ===");
  log("File: " + filePath);

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const fixMap = {
    "minimal": { oldSev: "normal", newSev: "severe" },
    "moderate": { oldSev: "moderate", newSev: "mild" },
    "severe": { oldSev: "severe", newSev: "normal" }
  };

  const negRanges = data.interpretation.subscaleRanges.negative;
  if (!negRanges) { log("  [ERROR] No negative subscaleRanges found"); return; }

  log("\n  --- Negative subscale ranges ---");
  for (const range of negRanges) {
    const fix = fixMap[range.level];
    if (!fix) { log("  [SKIP] Level " + range.level + " - no fix needed"); continue; }
    replaceDescription(range, desc.wellbeing[fix.oldSev], desc.wellbeing[fix.newSev], "negative/" + range.level);
    replaceSuggestions(range, sugg.wellbeing[fix.oldSev], sugg.wellbeing[fix.newSev], "negative/" + range.level);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  log("  [SAVED] " + filePath);
}

// ISSUE 3: MLQ search subscale - replace wellbeing with general
function fixMLQSearch(lang) {
  const filePath = lang === "zh"
    ? path.resolve(__dirname, "..", "src", "scales-data-b", "mlq.zh.json")
    : path.resolve(__dirname, "..", "src", "scales-data-b", "mlq.en.json");
  const desc = lang === "zh" ? zhDesc : enDesc;
  const sugg = lang === "zh" ? zhSugg : enSugg;

  log("\n=== ISSUE 3: MLQ Search Subscale (" + lang + ") ===");
  log("File: " + filePath);

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const searchRanges = data.interpretation.subscaleRanges.search;
  if (!searchRanges) { log("  [ERROR] No search subscaleRanges found"); return; }

  log("\n  --- Search subscale ranges ---");
  for (const range of searchRanges) {
    let foundWellbeingSev = null;
    for (const sev of ["normal", "mild", "moderate", "severe"]) {
      if (range.description.includes(desc.wellbeing[sev])) {
        foundWellbeingSev = sev;
        break;
      }
    }

    if (!foundWellbeingSev) {
      log("  [WARN] " + range.level + ": No wellbeing description text found");
      let foundGeneralSev = null;
      for (const sev of ["normal", "mild", "moderate", "severe"]) {
        if (range.description.includes(desc.general[sev])) {
          foundGeneralSev = sev;
          break;
        }
      }
      if (foundGeneralSev) {
        log("  [INFO] " + range.level + ": Already has general[" + foundGeneralSev + "] - skipping");
      }
      continue;
    }

    const generalSev = normalizeSeverity(range.level);
    log("  Level " + range.level + ": wellbeing[" + foundWellbeingSev + "] -> general[" + generalSev + "]");
    replaceDescription(range, desc.wellbeing[foundWellbeingSev], desc.general[generalSev], "search/" + range.level);

    let foundWellbeingSuggSev = null;
    for (const sev of ["normal", "mild", "moderate", "severe"]) {
      const pool = sugg.wellbeing[sev];
      const matchCount = range.suggestions.filter(s => pool.includes(s)).length;
      if (matchCount > 0) { foundWellbeingSuggSev = sev; break; }
    }

    if (foundWellbeingSuggSev) {
      replaceSuggestions(range, sugg.wellbeing[foundWellbeingSuggSev], sugg.general[generalSev], "search/" + range.level);
    } else {
      log("  [WARN] search/" + range.level + ": No wellbeing suggestion pool entries found");
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  log("  [SAVED] " + filePath);
}

// Main
log("======================================================================");
log("fix-interpretations-v3.js - Fixing 3 directionality issues");
log("======================================================================");

fixUWES9("zh");
fixUWES9("en");
fixSPANENegative("zh");
fixSPANENegative("en");
fixMLQSearch("zh");
fixMLQSearch("en");

log("\n======================================================================");
log("SUMMARY: " + changeCount + " changes applied across 6 files");
log("======================================================================");

// Verification
log("\n--- Verification spot-checks ---");

function spotCheck(fp, keys, expect, label) {
  const d = JSON.parse(fs.readFileSync(fp, "utf8"));
  let obj = d;
  for (const k of keys) obj = obj[k];
  const ok = typeof obj === "string" && obj.includes(expect);
  log("  [" + (ok ? "PASS" : "FAIL") + "] " + label);
  if (!ok && typeof obj === "string") {
    log("    Actual: " + obj.substring(0, 120));
    log("    Expected to contain: " + expect.substring(0, 80));
  }
}

const uwesZh = path.resolve(__dirname, "..", "src", "scales-data-c", "uwes-9.zh.json");
const uwesEn = path.resolve(__dirname, "..", "src", "scales-data-c", "uwes-9.en.json");
const spaneZh = path.resolve(__dirname, "..", "src", "scales-data-c", "spane.zh.json");
const spaneEn = path.resolve(__dirname, "..", "src", "scales-data-c", "spane.en.json");
const mlqZh = path.resolve(__dirname, "..", "src", "scales-data-b", "mlq.zh.json");
const mlqEn = path.resolve(__dirname, "..", "src", "scales-data-b", "mlq.en.json");

spotCheck(uwesZh, ["interpretation", "ranges", 2, "description"], zhDesc.wellbeing.severe, "UWES-9 zh: high has wellbeing[severe]");
spotCheck(uwesZh, ["interpretation", "ranges", 0, "description"], zhDesc.wellbeing.normal, "UWES-9 zh: low has wellbeing[normal]");
spotCheck(uwesEn, ["interpretation", "ranges", 2, "description"], enDesc.wellbeing.severe, "UWES-9 en: high has wellbeing[severe]");
spotCheck(uwesZh, ["interpretation", "subscaleRanges", "vigor", 0, "description"], zhDesc.wellbeing.normal, "UWES-9 zh vigor: low has wellbeing[normal]");
spotCheck(spaneZh, ["interpretation", "subscaleRanges", "negative", 0, "description"], zhDesc.wellbeing.severe, "SPANE zh neg: minimal -> wellbeing[severe] (high wb)");
spotCheck(spaneZh, ["interpretation", "subscaleRanges", "negative", 3, "description"], zhDesc.wellbeing.normal, "SPANE zh neg: severe -> wellbeing[normal] (low wb)");
spotCheck(spaneEn, ["interpretation", "subscaleRanges", "negative", 0, "description"], enDesc.wellbeing.severe, "SPANE en neg: minimal -> wellbeing[severe] (high wb)");
spotCheck(spaneEn, ["interpretation", "subscaleRanges", "negative", 3, "description"], enDesc.wellbeing.normal, "SPANE en neg: severe -> wellbeing[normal] (low wb)");
spotCheck(mlqZh, ["interpretation", "subscaleRanges", "search", 0, "description"], zhDesc.general.normal, "MLQ zh search: minimal has general[normal]");
spotCheck(mlqEn, ["interpretation", "subscaleRanges", "search", 0, "description"], enDesc.general.normal, "MLQ en search: minimal has general[normal]");

// Check no wellbeing remains in MLQ search
const mlqZhData = JSON.parse(fs.readFileSync(mlqZh, "utf8"));
let hasWb = false;
for (const r of mlqZhData.interpretation.subscaleRanges.search) {
  for (const sev of ["normal", "mild", "moderate", "severe"]) {
    if (r.description.includes(zhDesc.wellbeing[sev])) {
      hasWb = true;
      log("  [FAIL] MLQ zh search " + r.level + " still has wellbeing[" + sev + "]");
    }
  }
}
if (!hasWb) log("  [PASS] MLQ zh search: no wellbeing descriptions remain");

log("\nDone.");
