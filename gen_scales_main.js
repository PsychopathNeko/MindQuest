const fs = require("fs");
const DIR = "C:/Users/23583/testweb/public/data/scales";
function w(n,d){fs.writeFileSync(DIR+"/"+n,JSON.stringify(d,null,2));console.log(n);}

// Load remaining scale definitions from JSON data file
const data = JSON.parse(fs.readFileSync("C:/Users/23583/testweb/scale_data.json","utf8"));
for (const [name, content] of Object.entries(data)) { w(name, content); }
console.log("All scales written.");