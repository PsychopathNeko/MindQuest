const fs=require("fs"),path=require("path");
const O="C:/Users/23583/testweb/public/data/scales";
function w(n,d){fs.writeFileSync(path.join(O,n),JSON.stringify(d,null,2),"utf-8");console.log("  "+n);}
