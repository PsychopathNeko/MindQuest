/**
 * fix-interpretations.js
 *
 * Fixes 3 issues introduced by the enhance-interpretations script:
 * 1. Wellbeing description reversal (22 scales x 2 languages)
 * 2. ProQOL compassion_satisfaction wrong domain (2 files)
 * 3. Typo in .zh.json files
 */

const fs = require("fs");
const path = require("path");

const zhDesc = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "zh-descriptions.json"), "utf8"));
const enDesc = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "en-descriptions.json"), "utf8"));
const zhSugg = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "zh-suggestions.json"), "utf8"));
const enSugg = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "en-suggestions.json"), "utf8"));

const WELLBEING_SCALE_IDS = [
  "who-5", "swls", "wemwbs", "swemwbs", "mhc-sf", "fs",
  "lot-r", "gq-6", "grit-s", "maas", "brs", "cd-risc-2",
  "perma", "gse", "mlq", "ahs", "shs", "brcs",
  "cd-risc-10", "rs-14", "spane", "pwi"
];

const DATA_DIRS = [
  path.join(__dirname, "..", "src", "scales-data-a"),
  path.join(__dirname, "..", "src", "scales-data-b"),
  path.join(__dirname, "..", "src", "scales-data-c"),
];

const SEVERITY_KEYS = ["normal", "mild", "moderate", "severe"];
const SEVERITY_ORDER = { normal: 0, mild: 1, moderate: 2, severe: 3 };
function normalizeSeverity(level) {
  if (!level) return "mild";
  const l = level.toLowerCase();
  if (["normal", "minimal", "none", "no", "low", "very_low", "not_significant"].includes(l)) return "normal";
  if (["mild", "low_moderate", "slight", "subthreshold"].includes(l)) return "mild";
  if (["moderate", "medium", "clinical"].includes(l)) return "moderate";
  if (["severe", "high", "very_high", "extremely_severe", "extreme", "critical", "moderately_severe"].includes(l)) return "severe";
  if (l.includes("severe") || l.includes("high") || l.includes("extreme")) return "severe";
  if (l.includes("moderate") || l.includes("medium")) return "moderate";
  if (l.includes("mild") || l.includes("slight") || l.includes("light")) return "mild";
  if (l.includes("normal") || l.includes("minimal") || l.includes("none") || l.includes("low")) return "normal";
  return "mild";
}

function getPositionSeverity(rangeIndex, totalRanges) {
  if (totalRanges <= 1) return "moderate";
  const fraction = rangeIndex / (totalRanges - 1);
  return SEVERITY_KEYS[Math.round(fraction * 3)];
}

function shouldFix(usedSev, positionSev) {
  return Math.abs(SEVERITY_ORDER[usedSev] - SEVERITY_ORDER[positionSev]) >= 2;
}

function findScaleFile(scaleId, lang) {
  for (const dir of DATA_DIRS) {
    const filePath = path.join(dir, scaleId + "." + lang + ".json");
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}
// Fix 1: Wellbeing description reversal
let fix1Count = 0;
let fix1RangeCount = 0;

for (const scaleId of WELLBEING_SCALE_IDS) {
  for (const lang of ["zh", "en"]) {
    const filePath = findScaleFile(scaleId, lang);
    if (!filePath) {
      console.warn("[WARN] Scale file not found: " + scaleId + "." + lang + ".json");
      continue;
    }

    const descMap = lang === "zh" ? zhDesc : enDesc;
    const suggMap = lang === "zh" ? zhSugg : enSugg;
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let fileChanged = false;

    // Helper to fix a single ranges array
    function fixRangesArr(rangesArr, label) {
      const sorted = [...rangesArr].sort((a, b) => a.min - b.min);
      const total = sorted.length;
      for (let i = 0; i < total; i++) {
        const range = sorted[i];
        const usedSev = normalizeSeverity(range.level);
        const positionSev = getPositionSeverity(i, total);
        if (!shouldFix(usedSev, positionSev)) continue;
        const wrongDesc = descMap.wellbeing[usedSev];
        const correctDesc = descMap.wellbeing[positionSev];
        if (range.description && wrongDesc && range.description.includes(wrongDesc)) {
          range.description = range.description.replace(" " + wrongDesc, "");
          range.description = range.description + " " + correctDesc;
          fileChanged = true;
          fix1RangeCount++;
          console.log("    " + label + "[" + i + "] level=" + range.level + ": " + usedSev + " -> " + positionSev);
        }
        const wrongSuggs = suggMap.wellbeing[usedSev] || [];
        const correctSuggs = suggMap.wellbeing[positionSev] || [];
        if (range.suggestions && Array.isArray(range.suggestions)) {
          const correctSet = new Set(correctSuggs);
          const wrongSet = new Set(wrongSuggs);
          range.suggestions = range.suggestions.filter(s => !wrongSet.has(s) || correctSet.has(s));
          for (const s of correctSuggs) {
            if (range.suggestions.length >= 5) break;
            if (!range.suggestions.includes(s)) range.suggestions.push(s);
          }
        }
      }
    }

    // Fix main ranges
    const ranges = data.interpretation && data.interpretation.ranges;
    if (ranges && ranges.length > 0) {
      fixRangesArr(ranges, path.basename(filePath) + " ranges");
    }

    // Fix subscaleRanges
    if (data.interpretation && data.interpretation.subscaleRanges) {
      for (const subId of Object.keys(data.interpretation.subscaleRanges)) {
        const subRanges = data.interpretation.subscaleRanges[subId];
        if (subRanges && subRanges.length > 0) {
          fixRangesArr(subRanges, path.basename(filePath) + " subscaleRanges." + subId);
        }
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      fix1Count++;
      console.log("[FIX1] Fixed wellbeing reversal: " + path.basename(filePath));
    }
  }
}

console.log("");
console.log("=== Fix 1 Summary: Fixed " + fix1RangeCount + " ranges across " + fix1Count + " files ===");
console.log("");
// Fix 2: ProQOL compassion_satisfaction wrong domain
let fix2Count = 0;

for (const lang of ["zh", "en"]) {
  const filePath = findScaleFile("proqol", lang);
  if (!filePath) {
    console.warn("[WARN] proqol." + lang + ".json not found");
    continue;
  }

  const descMap = lang === "zh" ? zhDesc : enDesc;
  const suggMap = lang === "zh" ? zhSugg : enSugg;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const csRanges = data.interpretation && data.interpretation.subscaleRanges
    && data.interpretation.subscaleRanges.compassion_satisfaction;
  if (!csRanges) {
    console.warn("[WARN] No compassion_satisfaction subscaleRanges in proqol." + lang + ".json");
    continue;
  }

  let fileChanged = false;

  for (const range of csRanges) {
    const sev = normalizeSeverity(range.level);

    const stressDesc = descMap.stress[sev];
    const wellbeingDesc = descMap.wellbeing[sev];

    if (range.description && stressDesc && range.description.includes(stressDesc)) {
      range.description = range.description.replace(" " + stressDesc, "");
      range.description = range.description + " " + wellbeingDesc;
      fileChanged = true;
    }

    const stressSuggs = suggMap.stress[sev] || [];
    const wellbeingSuggs = suggMap.wellbeing[sev] || [];

    if (range.suggestions && Array.isArray(range.suggestions)) {
      const stressSet = new Set(stressSuggs);
      const wellbeingSet = new Set(wellbeingSuggs);
      range.suggestions = range.suggestions.filter(s => !stressSet.has(s) || wellbeingSet.has(s));
      for (const s of wellbeingSuggs) {
        if (range.suggestions.length >= 5) break;
        if (!range.suggestions.includes(s)) {
          range.suggestions.push(s);
        }
      }
    }
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    fix2Count++;
    console.log("[FIX2] Fixed ProQOL compassion_satisfaction: " + path.basename(filePath));
  }
}

console.log("");
console.log("=== Fix 2 Summary: Fixed " + fix2Count + " ProQOL files ===");
console.log("");
// Fix 3: typo
let fix3Count = 0;
const WRONG_TYPO = "正念冐想";
const CORRECT_TEXT = "正念冥想";

for (const dir of DATA_DIRS) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".zh.json"));
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf8");
    if (content.includes(WRONG_TYPO)) {
      content = content.split(WRONG_TYPO).join(CORRECT_TEXT);
      fs.writeFileSync(filePath, content, "utf8");
      fix3Count++;
      console.log("[FIX3] Fixed typo in: " + file);
    }
  }
}

const zhSuggPath = path.join(__dirname, "data", "zh-suggestions.json");
let zhSuggContent = fs.readFileSync(zhSuggPath, "utf8");
if (zhSuggContent.includes(WRONG_TYPO)) {
  zhSuggContent = zhSuggContent.split(WRONG_TYPO).join(CORRECT_TEXT);
  fs.writeFileSync(zhSuggPath, zhSuggContent, "utf8");
  fix3Count++;
  console.log("[FIX3] Fixed typo in: zh-suggestions.json");
}

console.log("");
console.log("=== Fix 3 Summary: Fixed typo in " + fix3Count + " files ===");
console.log("");
console.log("All fixes applied successfully.");