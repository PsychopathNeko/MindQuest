const fs = require("fs");
const DIR = "C:/Users/23583/testweb/public/data/scales";
function w(name, data) { fs.writeFileSync(DIR + "/" + name, JSON.stringify(data, null, 2)); console.log(name + " done"); }
