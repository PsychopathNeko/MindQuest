/**
 * enhance-interpretations.js
 * Expands interpretation content in all scale JSON files.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX_PATH = path.join(ROOT, "src/static/scales/_index.json");
const DATA_DIRS = [
  path.join(ROOT, "src/scales-data-a"),
  path.join(ROOT, "src/scales-data-b"),
  path.join(ROOT, "src/scales-data-c"),
];

const ZH_DESCRIPTIONS = require("./data/zh-descriptions.json");
const EN_DESCRIPTIONS = require("./data/en-descriptions.json");
const ZH_EXTRA_SUGGESTIONS = require("./data/zh-suggestions.json");
const EN_EXTRA_SUGGESTIONS = require("./data/en-suggestions.json");
const DOMAIN_TAG_MAP = require("./data/domain-tags.json");

function detectDomain(tags) {
  if (!tags || !Array.isArray(tags)) return "general";
  const lowerTags = tags.map(t => t.toLowerCase());
  for (const [domain, keywords] of Object.entries(DOMAIN_TAG_MAP)) {
    for (const kw of keywords) {
      if (lowerTags.some(t => t.includes(kw))) return domain;
    }
  }
  return "general";
}

function detectSubscaleDomain(subscaleId) {
  const map = {
    depression:"depression",anxiety:"anxiety",stress:"stress",
    somatic:"somatic",social:"social",interpersonal:"social",
    cognitive:"general",behavioral:"behavioral",emotional:"general",
    obsessive:"anxiety",compulsive:"anxiety",phobic:"anxiety",
    paranoid:"personality",psychotic:"general",hostility:"behavioral",
    avoidance:"trauma",intrusion:"trauma",hyperarousal:"trauma",
    reexperiencing:"trauma",numbness:"trauma",
    inattention:"behavioral",hyperactivity:"behavioral",impulsivity:"behavioral"
  };
  if (!subscaleId) return null;
  const lower = subscaleId.toLowerCase();
  for (const [key, domain] of Object.entries(map)) {
    if (lower.includes(key)) return domain;
  }
  return null;
}

function normalizeSeverity(level) {
  if (!level) return "mild";
  const l = level.toLowerCase();
  if (["normal","minimal","none","no","low","very_low","not_significant"].includes(l)) return "normal";
  if (["mild","low_moderate","slight","subthreshold"].includes(l)) return "mild";
  if (["moderate","medium","clinical"].includes(l)) return "moderate";
  if (["severe","high","very_high","extremely_severe","extreme","critical","moderately_severe"].includes(l)) return "severe";
  if (l.includes("severe")||l.includes("high")||l.includes("extreme")) return "severe";
  if (l.includes("moderate")||l.includes("medium")) return "moderate";
  if (l.includes("mild")||l.includes("slight")||l.includes("light")) return "mild";
  if (l.includes("normal")||l.includes("minimal")||l.includes("none")||l.includes("low")) return "normal";
  return "mild";
}

const REVERSED_DOMAINS = new Set(["wellbeing"]);
function isLangZh(fp) { return fp.endsWith(".zh.json"); }
function getDescMap(fp) { return isLangZh(fp) ? ZH_DESCRIPTIONS : EN_DESCRIPTIONS; }
function getSuggMap(fp) { return isLangZh(fp) ? ZH_EXTRA_SUGGESTIONS : EN_EXTRA_SUGGESTIONS; }

function descriptionIsShort(desc, fp) {
  if (!desc) return true;
  return desc.length < (isLangZh(fp) ? 80 : 150);
}

function appendDescription(existing, extra, fp) {
  if (!extra) return existing;
  if (!existing) return extra;
  let base = existing.trim();
  if (!base.endsWith(".") && !base.endsWith("。")) {
    base += isLangZh(fp) ? "。" : ".";
  }
  return base + " " + extra;
}

function addSuggestions(existing, pool, max) {
  if (!pool || pool.length === 0) return existing;
  const arr = existing || [];
  const set = new Set(arr.map(s => s.trim()));
  const result = [...arr];
  for (const s of pool) {
    if (result.length >= max) break;
    if (!set.has(s.trim())) { result.push(s); set.add(s.trim()); }
  }
  return result;
}

function processRange(range, domain, fp) {
  const descMap = getDescMap(fp);
  const suggMap = getSuggMap(fp);
  const severity = normalizeSeverity(range.level);
  const domainDescs = descMap[domain] || descMap.general;
  const domainSuggs = suggMap[domain] || suggMap.general;
  if (descriptionIsShort(range.description, fp)) {
    const extra = domainDescs[severity];
    if (extra) range.description = appendDescription(range.description, extra, fp);
  }
  if (!range.suggestions || range.suggestions.length < 5) {
    const pool = domainSuggs[severity];
    if (pool) range.suggestions = addSuggestions(range.suggestions, pool, 5);
  }
}

function processFile(filePath, domain) {
  const raw = fs.readFileSync(filePath, "utf8");
  let data;
  try { data = JSON.parse(raw); } catch(e) { console.warn("  [SKIP] Invalid JSON:", filePath); return false; }
  if (!data.interpretation) { console.warn("  [SKIP] No interpretation:", filePath); return false; }
  let modified = false;
  if (data.interpretation.ranges && Array.isArray(data.interpretation.ranges)) {
    for (const r of data.interpretation.ranges) {
      const bd = r.description, bs = r.suggestions ? [...r.suggestions] : null;
      processRange(r, domain, filePath);
      if (r.description !== bd || JSON.stringify(r.suggestions) !== JSON.stringify(bs)) modified = true;
    }
  }
  if (data.interpretation.subscaleRanges && typeof data.interpretation.subscaleRanges === "object") {
    for (const [sid, ranges] of Object.entries(data.interpretation.subscaleRanges)) {
      if (!Array.isArray(ranges)) continue;
      const subDomain = detectSubscaleDomain(sid) || domain;
      for (const r of ranges) {
        const bd = r.description, bs = r.suggestions ? [...r.suggestions] : null;
        processRange(r, subDomain, filePath);
        if (r.description !== bd || JSON.stringify(r.suggestions) !== JSON.stringify(bs)) modified = true;
      }
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + String.fromCharCode(10), "utf8");
    return true;
  }
  return false;
}

function main() {
  console.log("=== enhance-interpretations.js ===");
  const indexRaw = fs.readFileSync(INDEX_PATH, "utf8");
  const index = JSON.parse(indexRaw);
  const scaleTagMap = {};
  for (const s of index.scales) scaleTagMap[s.id] = s.tags || [];
  console.log("Found", Object.keys(scaleTagMap).length, "scales in index.");
  const allFiles = [];
  for (const dir of DATA_DIRS) {
    if (!fs.existsSync(dir)) { console.warn("Dir not found:", dir); continue; }
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json"))) {
      allFiles.push(path.join(dir, f));
    }
  }
  console.log("Found", allFiles.length, "JSON files.");
  let processed = 0, modified = 0, skipped = 0;
  const domainStats = {};
  for (const fp of allFiles) {
    const m = path.basename(fp).match(/^(.+?)[.](zh|en)[.]json$/);
    if (!m) { skipped++; continue; }
    const domain = detectDomain(scaleTagMap[m[1]] || []);
    domainStats[domain] = (domainStats[domain] || 0) + 1;
    if (processFile(fp, domain)) modified++;
    processed++;
  }
  console.log("");
  console.log("=== Summary ===");
  console.log("Processed:", processed, "| Modified:", modified, "| Skipped:", skipped);
  console.log("Domain distribution:");
  for (const [d, c] of Object.entries(domainStats).sort((a,b) => b[1]-a[1]))
    console.log("  " + d + ": " + c);
  console.log("Done!");
}

main();
