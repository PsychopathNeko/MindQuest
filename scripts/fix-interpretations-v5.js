// fix-interpretations-v5.js
// Fixes inverted wellbeing descriptions in positive scales and Brief-COPE domain issues.
// Loads domain text data from scripts/_v5_data.json

var fs = require("fs");
var path = require("path");

var BASE = path.resolve(__dirname, "..");
var DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "_v5_data.json"), "utf8"));
var descriptions = DATA.descriptions;
var suggestions = DATA.suggestions;

function buildSuggestionSet(lang, domain) {
  var set = new Set();
  ["normal","mild","moderate","severe"].forEach(function(sev) {
    if (suggestions[lang][domain] && suggestions[lang][domain][sev]) {
      suggestions[lang][domain][sev].forEach(function(s) { set.add(s); });
    }
  });
  return set;
}
function buildDescriptionSet(lang, domain) {
  var set = new Set();
  ["normal","mild","moderate","severe"].forEach(function(sev) {
    if (descriptions[lang][domain] && descriptions[lang][domain][sev]) {
      set.add(descriptions[lang][domain][sev]);
    }
  });
  return set;
}

function positionToSeverity(posIndex, totalPositions) {
  var severities = ["normal","mild","moderate","severe"];
  if (totalPositions === 2) return posIndex === 0 ? "normal" : "severe";
  if (totalPositions === 3) return ["normal","mild","severe"][posIndex];
  if (totalPositions === 4) return severities[posIndex];
  var idx = Math.round(posIndex * 3 / (totalPositions - 1));
  return severities[Math.min(idx, 3)];
}

function replaceAppendedDescription(desc, newAppendedText, lang) {
  var domains = ["wellbeing","general"];
  for (var d = 0; d < domains.length; d++) {
    var descSet = buildDescriptionSet(lang, domains[d]);
    for (var knownDesc of descSet) {
      var idx = desc.indexOf(knownDesc);
      if (idx !== -1) return desc.substring(0, idx) + newAppendedText;
    }
  }
  console.log("    WARNING: no appended text found");
  return desc;
}

function replaceSuggestions(currentSuggestions, newSuggestions, lang) {
  var wellbSet = buildSuggestionSet(lang, "wellbeing");
  var generalSet = buildSuggestionSet(lang, "general");
  var originals = currentSuggestions.filter(function(s) {
    return !wellbSet.has(s) && !generalSet.has(s);
  });
  var result = originals.slice();
  newSuggestions.forEach(function(s) {
    if (result.indexOf(s) === -1) result.push(s);
  });
  return result;
}
var totalChanges = 0;
var filesModified = 0;

function processFile(filePath, lang, config) {
  if (!fs.existsSync(filePath)) { console.log("  SKIP: " + filePath); return; }
  var data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  var fileChanges = 0;

  if (config.mainRanges && data.interpretation && data.interpretation.ranges) {
    var sorted = data.interpretation.ranges.slice().sort(function(a,b){return a.min-b.min});
    var N = sorted.length;
    for (var i = 0; i < N; i++) {
      var range = sorted[i];
      var severity = config.mainRangeMapping ? config.mainRangeMapping(i, N) : positionToSeverity(i, N);
      var domain = config.mainDomain || "wellbeing";
      var newDesc = descriptions[lang][domain][severity];
      var newSugs = suggestions[lang][domain][severity];
      var oldDesc = range.description;
      var oldSugs = JSON.stringify(range.suggestions);
      range.description = replaceAppendedDescription(range.description, newDesc, lang);
      range.suggestions = replaceSuggestions(range.suggestions || [], newSugs, lang);
      if (range.description !== oldDesc || JSON.stringify(range.suggestions) !== oldSugs) fileChanges++;
    }
  }

  if (data.interpretation && data.interpretation.subscaleRanges) {
    Object.keys(data.interpretation.subscaleRanges).forEach(function(subId) {
      var subRanges = data.interpretation.subscaleRanges[subId];
      if (!subRanges) return;
      var subConfig = config.subscaleConfig ? config.subscaleConfig(subId) : null;
      if (subConfig === null || (subConfig && subConfig.skip)) return;
      var sorted = subRanges.slice().sort(function(a,b){return a.min-b.min});
      var N = sorted.length;
      for (var i = 0; i < N; i++) {
        var range = sorted[i];
        var severity = subConfig.mapping ? subConfig.mapping(i, N) : positionToSeverity(i, N);
        var domain = subConfig.domain || "wellbeing";
        var newDesc = descriptions[lang][domain][severity];
        var newSugs = suggestions[lang][domain][severity];
        var oldDesc = range.description;
        var oldSugs = JSON.stringify(range.suggestions);
        range.description = replaceAppendedDescription(range.description, newDesc, lang);
        range.suggestions = replaceSuggestions(range.suggestions || [], newSugs, lang);
        if (range.description !== oldDesc || JSON.stringify(range.suggestions) !== oldSugs) fileChanges++;
      }
    });
  }

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    filesModified++;
    totalChanges += fileChanges;
    console.log("  " + path.basename(filePath) + ": " + fileChanges + " range(s) changed");
  } else {
    console.log("  " + path.basename(filePath) + ": no changes needed");
  }
}
// Group 1: Reverse wellbeing descriptions
console.log("\n=== Group 1: Reverse wellbeing descriptions ===");

["zh","en"].forEach(function(lang) {
  var fp = path.join(BASE, "src/scales-data-a/ffmq-15." + lang + ".json");
  console.log("Processing " + path.basename(fp) + "...");
  processFile(fp, lang, {
    mainRanges: true, mainDomain: "wellbeing",
    subscaleConfig: function() { return { domain: "wellbeing" }; }
  });
});

["zh","en"].forEach(function(lang) {
  var fp = path.join(BASE, "src/scales-data-a/fmi-14." + lang + ".json");
  console.log("Processing " + path.basename(fp) + "...");
  processFile(fp, lang, { mainRanges: true, mainDomain: "wellbeing" });
});

["zh","en"].forEach(function(lang) {
  var fp = path.join(BASE, "src/scales-data-a/essi." + lang + ".json");
  console.log("Processing " + path.basename(fp) + "...");
  processFile(fp, lang, { mainRanges: true, mainDomain: "wellbeing" });
});

["zh","en"].forEach(function(lang) {
  var fp = path.join(BASE, "src/scales-data-b/panas." + lang + ".json");
  console.log("Processing " + path.basename(fp) + "...");
  processFile(fp, lang, {
    mainRanges: false,
    subscaleConfig: function(subId) {
      if (subId === "positive_affect") return { domain: "wellbeing" };
      return { skip: true };
    }
  });
});

// Group 2: Brief-COPE rework
console.log("\n=== Group 2: Brief-COPE rework ===");

var MALADAPTIVE = ["substance_use","denial","behavioral_disengagement","self_blame"];
var ADAPTIVE = ["active_coping","planning","positive_reframing","emotional_support","instrumental_support"];

["zh","en"].forEach(function(lang) {
  var fp = path.join(BASE, "src/scales-data-a/brief-cope." + lang + ".json");
  console.log("Processing " + path.basename(fp) + "...");
  processFile(fp, lang, {
    mainRanges: true, mainDomain: "general",
    mainRangeMapping: function(i) { return i === 0 ? "mild" : "normal"; },
    subscaleConfig: function(subId) {
      if (MALADAPTIVE.indexOf(subId) !== -1) {
        return { domain: "general", mapping: function(i,N) { return positionToSeverity(i,N); } };
      }
      if (ADAPTIVE.indexOf(subId) !== -1) {
        return { domain: "general", mapping: function(i) { return i === 0 ? "mild" : "normal"; } };
      }
      return { domain: "general", mapping: function() { return "normal"; } };
    }
  });
});

console.log("\n=== Summary ===");
console.log("Total: " + totalChanges + " range(s) changed across " + filesModified + " file(s)\n");
