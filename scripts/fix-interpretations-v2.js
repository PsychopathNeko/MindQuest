const fs = require("fs");
const path = require("path");
const zhDescriptions = require("./data/zh-descriptions.json");
const enDescriptions = require("./data/en-descriptions.json");
const zhSuggestions = require("./data/zh-suggestions.json");
const enSuggestions = require("./data/en-suggestions.json");
const scaleDirs = [
  path.resolve(__dirname, "..", "src", "scales-data-a"),
  path.resolve(__dirname, "..", "src", "scales-data-b"),
  path.resolve(__dirname, "..", "src", "scales-data-c"),
];
let totalChanges = 0;
function findScaleFile(scaleId, lang) {
  const filename = scaleId + "." + lang + ".json";
  for (const dir of scaleDirs) {
    const fp = path.join(dir, filename);
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}
function fixSuggestions(cur, removePool, addPool, maxTotal) {
  let filtered = cur.filter(function(s) { return !removePool.includes(s); });
  for (const s of addPool) {
    if (!filtered.includes(s) && filtered.length < maxTotal) filtered.push(s);
  }
  return filtered;
}
const issue1Scales = ["who-5", "swemwbs", "brs", "brcs", "cd-risc-10", "rs-14", "spane", "pwi"];
function fixIssue1() {
  console.log("\n========== ISSUE 1: Moderate/Mild middle-tier swap ==========\n");
  for (const scaleId of issue1Scales) {
    for (const lang of ["zh", "en"]) {
      const filePath = findScaleFile(scaleId, lang);
      if (!filePath) { console.log("[SKIP] " + scaleId + "." + lang + " not found"); continue; }
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const ranges = data.interpretation.ranges;
      ranges.sort(function(a, b) { return a.min - b.min; });
      if (ranges.length !== 4) {
        console.log("[SKIP] " + scaleId + "." + lang + ": " + ranges.length + " ranges, expected 4");
        continue;
      }
      if (ranges[1].level !== "moderate" || ranges[2].level !== "mild") {
        console.log("[SKIP] " + scaleId + "." + lang + ": pos1,2=" + ranges[1].level + "," + ranges[2].level);
        continue;
      }
      const descs = lang === "zh" ? zhDescriptions : enDescriptions;
      const suggs = lang === "zh" ? zhSuggestions : enSuggestions;
      const wMildD = descs.wellbeing.mild;
      const wModD = descs.wellbeing.moderate;
      const wMildS = suggs.wellbeing.mild;
      const wModS = suggs.wellbeing.moderate;
      let changed = false;
      var pos1 = ranges[1];
      if (pos1.description.includes(wModD)) {
        pos1.description = pos1.description.replace(wModD, wMildD);
        pos1.suggestions = fixSuggestions(pos1.suggestions, wModS, wMildS, 5);
        console.log("[FIX] " + scaleId + "." + lang + ": pos1 moderate->mild desc+sugg");
        changed = true; totalChanges++;
      } else {
        console.log("[NO-MATCH] " + scaleId + "." + lang + ": pos1 no moderate desc");
      }
      var pos2 = ranges[2];
      if (pos2.description.includes(wMildD)) {
        pos2.description = pos2.description.replace(wMildD, wModD);
        pos2.suggestions = fixSuggestions(pos2.suggestions, wMildS, wModS, 5);
        console.log("[FIX] " + scaleId + "." + lang + ": pos2 mild->moderate desc+sugg");
        changed = true; totalChanges++;
      } else {
        console.log("[NO-MATCH] " + scaleId + "." + lang + ": pos2 no mild desc");
      }
      if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
        console.log("[SAVED] " + filePath);
      }
    }
  }
}
function fixIssue2() {
  console.log("\n========== ISSUE 2: PERMA reverse-scored subscales ==========\n");
  var reverseSubscales = ["negative_emotion", "loneliness"];
  for (const lang of ["zh", "en"]) {
    const filePath = findScaleFile("perma", lang);
    if (!filePath) { console.log("[SKIP] perma." + lang + " not found"); continue; }
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const subscaleRanges = data.interpretation.subscaleRanges;
    const descs = lang === "zh" ? zhDescriptions : enDescriptions;
    const suggs = lang === "zh" ? zhSuggestions : enSuggestions;
    const wNormD = descs.wellbeing.normal;
    const wSevD = descs.wellbeing.severe;
    const wNormS = suggs.wellbeing.normal;
    const wSevS = suggs.wellbeing.severe;
    let changed = false;
    for (const subscaleId of reverseSubscales) {
      const ranges = subscaleRanges[subscaleId];
      if (!ranges) { console.log("[SKIP] perma." + lang + ": " + subscaleId + " not found"); continue; }
      for (const range of ranges) {
        if (range.level === "low") {
          if (range.description.includes(wNormD)) {
            range.description = range.description.replace(wNormD, wSevD);
            range.suggestions = fixSuggestions(range.suggestions, wNormS, wSevS, 5);
            console.log("[FIX] perma." + lang + ": " + subscaleId + " low: normal->severe (low=good)");
            changed = true; totalChanges++;
          } else {
            console.log("[NO-MATCH] perma." + lang + ": " + subscaleId + " low no normal desc");
          }
        } else if (range.level === "high") {
          if (range.description.includes(wSevD)) {
            range.description = range.description.replace(wSevD, wNormD);
            range.suggestions = fixSuggestions(range.suggestions, wSevS, wNormS, 5);
            console.log("[FIX] perma." + lang + ": " + subscaleId + " high: severe->normal (high=bad)");
            changed = true; totalChanges++;
          } else {
            console.log("[NO-MATCH] perma." + lang + ": " + subscaleId + " high no severe desc");
          }
        }
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
      console.log("[SAVED] " + filePath);
    }
  }
}
console.log("=== fix-interpretations-v2.js ===");
console.log("Running from: " + process.cwd());
console.log("Script dir:   " + __dirname);
fixIssue1();
fixIssue2();
console.log("\n========== SUMMARY ==========");
console.log("Total changes made: " + totalChanges);
console.log("Issue 1: " + issue1Scales.length + " scales x 2 langs");
console.log("Issue 2: PERMA x 2 langs, 2 subscales x 2 levels");
console.log("Done.");
