/**
 * fix-interpretations-v4.js
 * Fixes remaining positive-scale / reverse-scored subscale issues.
 */
const fs = require("fs");
const path = require("path");
const zhDesc = require("./data/zh-descriptions.json");
const enDesc = require("./data/en-descriptions.json");
const zhSugg = require("./data/zh-suggestions.json");
const enSugg = require("./data/en-suggestions.json");

function normalizeSeverity(level) {
  if (!level) return "mild";
  const l = level.toLowerCase();
  if (["normal","minimal","none","no","low","very_low","not_significant"].includes(l)) return "normal";
  if (["mild","low_moderate","slight","subthreshold"].includes(l)) return "mild";
  if (["moderate","medium","clinical"].includes(l)) return "moderate";
  if (["severe","high","very_high","extremely_severe","extreme","critical","moderately_severe"].includes(l)) return "severe";
  if (l.indexOf("severe")>=0||l.indexOf("high")>=0||l.indexOf("extreme")>=0) return "severe";
  if (l.indexOf("moderate")>=0||l.indexOf("medium")>=0) return "moderate";
  if (l.indexOf("mild")>=0||l.indexOf("slight")>=0||l.indexOf("light")>=0) return "mild";
  if (l.indexOf("normal")>=0||l.indexOf("minimal")>=0||l.indexOf("none")>=0||l.indexOf("low")>=0) return "normal";
  return "mild";
}

let totalChanges = 0;
function log(msg) { console.log(msg); }
function readJson(fp) { return JSON.parse(fs.readFileSync(fp, "utf-8")); }
function writeJson(fp, d) { fs.writeFileSync(fp, JSON.stringify(d, null, 2) + "\n", "utf-8"); }

function replaceDescription(range, wrongDomain, wrongSev, correctDomain, correctSev, lang) {
  const descMap = lang === "zh" ? zhDesc : enDesc;
  const wrongDesc = descMap[wrongDomain][wrongSev];
  const correctDesc = descMap[correctDomain][correctSev];
  if (!wrongDesc || !correctDesc) return false;
  if (wrongDesc === correctDesc) return false;
  if (range.description && range.description.indexOf(wrongDesc) >= 0) {
    range.description = range.description.replace(wrongDesc, correctDesc);
    return true;
  }
  return false;
}

function replaceSuggestions(range, wrongDomain, wrongSev, correctDomain, correctSev, lang) {
  const suggMap = lang === "zh" ? zhSugg : enSugg;
  const wrongPool = suggMap[wrongDomain][wrongSev] || [];
  const correctPool = suggMap[correctDomain][correctSev] || [];
  if (!range.suggestions || !Array.isArray(range.suggestions)) return false;
  const wrongSet = new Set(wrongPool);
  const scaleSpecific = [];
  let removedCount = 0;
  for (const s of range.suggestions) {
    if (wrongSet.has(s)) { removedCount++; } else { scaleSpecific.push(s); }
  }
  if (removedCount === 0) return false;
  const needed = Math.min(5, scaleSpecific.length + correctPool.length) - scaleSpecific.length;
  const toAdd = correctPool.filter(s => !scaleSpecific.includes(s)).slice(0, Math.max(needed, removedCount));
  range.suggestions = [...scaleSpecific, ...toAdd].slice(0, Math.max(5, scaleSpecific.length + toAdd.length));
  return true;
}

function fixRange(range, wrongDomain, correctDomain, lang, context, forceCorrectSev) {
  const normSev = normalizeSeverity(range.level);
  const wrongSev = normSev;
  const correctSev = forceCorrectSev || normSev;
  let changed = false;
  if (replaceDescription(range, wrongDomain, wrongSev, correctDomain, correctSev, lang)) {
    log("  [" + lang + "] " + context + " level=" + range.level + ": desc " + wrongDomain + "[" + wrongSev + "] -> " + correctDomain + "[" + correctSev + "]");
    changed = true; totalChanges++;
  }
  if (replaceSuggestions(range, wrongDomain, wrongSev, correctDomain, correctSev, lang)) {
    log("  [" + lang + "] " + context + " level=" + range.level + ": sugg " + wrongDomain + "[" + wrongSev + "] -> " + correctDomain + "[" + correctSev + "]");
    changed = true; totalChanges++;
  }
  return changed;
}

function scaleFile(dir, name, lang) {
  return path.join(__dirname, "..", "src", dir, name + "." + lang + ".json");
}

// Fix 1: RQ secure subscale (general -> wellbeing)
function fixRQ() {
  log("\n=== Fix 1: RQ secure subscale (general -> wellbeing) ===");
  ["zh", "en"].forEach(function(lang) {
    const fp = scaleFile("scales-data-c", "rq", lang);
    const data = readJson(fp);
    const secureRanges = data.interpretation.subscaleRanges.secure;
    if (!secureRanges) { log("  WARNING: no secure subscaleRanges"); return; }
    for (const r of secureRanges) fixRange(r, "general", "wellbeing", lang, "RQ.secure");
    writeJson(fp, data);
    log("  [" + lang + "] RQ written.");
  });
}

// Fix 2: SDQ abnormal level bug
function fixSDQ() {
  log("\n=== Fix 2: SDQ abnormal level bug ===");
  ["zh", "en"].forEach(function(lang) {
    const fp = scaleFile("scales-data-c", "sdq", lang);
    const data = readJson(fp);
    for (const r of data.interpretation.ranges) {
      if (r.level === "abnormal") fixRange(r, "general", "general", lang, "SDQ.main", "severe");
    }
    for (const [subId, ranges] of Object.entries(data.interpretation.subscaleRanges)) {
      for (const r of ranges) {
        if (r.level === "abnormal") {
          let wd;
          if (subId === "hyperactivity") wd = "behavioral";
          else if (subId === "prosocial") wd = "social";
          else wd = "general";
          fixRange(r, wd, wd, lang, "SDQ." + subId, "severe");
        }
      }
    }
    writeJson(fp, data);
    log("  [" + lang + "] SDQ written.");
  });
}

// Fix 3: Brief-COPE (stress -> wellbeing)
function fixBriefCOPE() {
  log("\n=== Fix 3: Brief-COPE (stress -> wellbeing) ===");
  ["zh", "en"].forEach(function(lang) {
    const fp = scaleFile("scales-data-a", "brief-cope", lang);
    const data = readJson(fp);
    for (const r of data.interpretation.ranges) fixRange(r, "stress", "wellbeing", lang, "Brief-COPE.main");
    if (data.interpretation.subscaleRanges) {
      for (const [subId, ranges] of Object.entries(data.interpretation.subscaleRanges)) {
        for (const r of ranges) {
          let wd;
          if (subId === "emotional_support") wd = "general";
          else if (subId === "behavioral_disengagement") wd = "behavioral";
          else wd = "stress";
          fixRange(r, wd, "wellbeing", lang, "Brief-COPE." + subId);
        }
      }
    }
    writeJson(fp, data);
    log("  [" + lang + "] Brief-COPE written.");
  });
}

// Fix 4: ESSI (general -> wellbeing)
function fixESSI() {
  log("\n=== Fix 4: ESSI (general -> wellbeing) ===");
  ["zh", "en"].forEach(function(lang) {
    const fp = scaleFile("scales-data-a", "essi", lang);
    const data = readJson(fp);
    for (const r of data.interpretation.ranges) fixRange(r, "general", "wellbeing", lang, "ESSI.main");
    writeJson(fp, data);
    log("  [" + lang + "] ESSI written.");
  });
}

// Fix 5: FFMQ-15 (general -> wellbeing)
function fixFFMQ15() {
  log("\n=== Fix 5: FFMQ-15 (general -> wellbeing) ===");
  ["zh", "en"].forEach(function(lang) {
    const fp = scaleFile("scales-data-a", "ffmq-15", lang);
    const data = readJson(fp);
    for (const r of data.interpretation.ranges) fixRange(r, "general", "wellbeing", lang, "FFMQ-15.main");
    if (data.interpretation.subscaleRanges) {
      for (const [subId, ranges] of Object.entries(data.interpretation.subscaleRanges)) {
        for (const r of ranges) fixRange(r, "general", "wellbeing", lang, "FFMQ-15." + subId);
      }
    }
    writeJson(fp, data);
    log("  [" + lang + "] FFMQ-15 written.");
  });
}

// Fix 6: FMI-14 (general -> wellbeing)
function fixFMI14() {
  log("\n=== Fix 6: FMI-14 (general -> wellbeing) ===");
  ["zh", "en"].forEach(function(lang) {
    const fp = scaleFile("scales-data-a", "fmi-14", lang);
    const data = readJson(fp);
    for (const r of data.interpretation.ranges) fixRange(r, "general", "wellbeing", lang, "FMI-14.main");
    writeJson(fp, data);
    log("  [" + lang + "] FMI-14 written.");
  });
}

// Fix 7: PANAS positive_affect (general -> wellbeing)
function fixPANAS() {
  log("\n=== Fix 7: PANAS positive_affect (general -> wellbeing) ===");
  ["zh", "en"].forEach(function(lang) {
    const fp = scaleFile("scales-data-b", "panas", lang);
    const data = readJson(fp);
    const paRanges = data.interpretation.subscaleRanges.positive_affect;
    if (!paRanges) { log("  WARNING: no positive_affect"); return; }
    for (const r of paRanges) fixRange(r, "general", "wellbeing", lang, "PANAS.positive_affect");
    writeJson(fp, data);
    log("  [" + lang + "] PANAS written.");
  });
}

// Fix 8: PSQI good range (sleep[mild] -> sleep[normal])
function fixPSQI() {
  log("\n=== Fix 8: PSQI good range ===");
  ["zh", "en"].forEach(function(lang) {
    const fp = scaleFile("scales-data-b", "psqi", lang);
    const data = readJson(fp);
    for (const r of data.interpretation.ranges) {
      if (r.level === "good") fixRange(r, "sleep", "sleep", lang, "PSQI.main", "normal");
    }
    writeJson(fp, data);
    log("  [" + lang + "] PSQI written.");
  });
}

// Main
function main() {
  log("=== fix-interpretations-v4.js ===");
  log("Started at " + new Date().toISOString());
  fixRQ();
  fixSDQ();
  fixBriefCOPE();
  fixESSI();
  fixFFMQ15();
  fixFMI14();
  fixPANAS();
  fixPSQI();
  log("\n=== Summary ===");
  log("Total changes: " + totalChanges);
  log("Files modified: 16 (8 scales x 2 languages)");
  log("Done.");
}

main();
