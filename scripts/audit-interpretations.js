const fs=require("fs"),path=require("path");
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,"_audit_cfg.json"),"utf-8"));
const DIRS=[path.join(__dirname,"..","src","scales-data-a"),path.join(__dirname,"..","src","scales-data-b"),path.join(__dirname,"..","src","scales-data-c")];
const NEG_D=cfg.negDescZH.split("|").concat(cfg.negDescEN.split("|"));
const POS_D=cfg.posDescZH.split("|").concat(cfg.posDescEN.split("|"));
const CRISIS_KW=cfg.crisisZH.split("|").concat(cfg.crisisEN.split("|"));
var NEG_C=["anxiety","depression","stress","distress","burnout","fatigue","exhaustion","trauma","avoidance","avoidant","fear","pain","loneliness","lonely","insomnia","sleepiness","risk","anger","aggression","hostility","impulsivity","dissociation","compulsion","obsession","paranoia","psychosis","mania","suicid","harm","dysfunction","disorder","impair","deficit","problem","complaint","difficult","negative feel","negative emotion","worry","rumination","experiential avoidance","negative evaluation","social anxiety","health anxiety","alexithymia","compassion fatigue","secondary trauma","dysfunctional","gap","obstacle","barrier","conflict","tension","concern","exposure","somatic","somatiz","abnormal","absence","abandon","abuse","adversity","insecure","unstable","unsafe",
"焦虑","抑郁","压力","困扰","倦怠","疒劳","衰竭","枯竭","创伤","回避","恐惧","痛苦","孤独","失眠","风险","愤怒","攻击","敌意","冲动","解离","强迫","偏执","躁狂","自杀","伤害","障碍","缺陷","问题","消极","担忧","反刍","经验性回避","负面评价","社交焦虑","健康焦虑","同情疒劳","功能失调","差距","危险","异常","不良","不足","缺乏","失调","紫乱","不安全","不稳定","退缩","冷漠","低落","悲伤","焦虑敏感","阴性","阳性"];
var POS_C=["well-being","wellbeing","happiness","satisfaction","flourish","resilience","meaning","purpose","hope","gratitude","optimism","self-esteem","self-efficacy","self-compassion","mindfulness","acceptance","flexibility","engagement","vigor","dedication","absorption","compassion satisfaction","growth","secure","stable","harmony","confidence","adaptive","functional","coping","regulation","tolerance","positive feel","positive emotion","emotional intelligence","empathy","social support","life satisfaction","mental health","self-care","coherence","vitality",
"幸福","满意","繁荣","韧性","意义","目的","希望","感恩","乐观","自尊","自效","自慈","正念","接纳","灵活","投入","活力","奉献","专注","同情满足","成长","安全","稳定","和谐","自信","适应","功能","应对","调节","容忍","积极","共情","生活满意","心理健康","自我关爱","健康","良好"];
function hits(t,p){if(t==null||t==="")return[];var l=t.toLowerCase();return p.filter(function(x){return l.includes(x.toLowerCase());});}
function hasNegC(s){return hits(s,NEG_C).length>0;}
function hasPosC(s){return hits(s,POS_C).length>0;}
var HI_ZH=["高","重度","严重","极","非常"];
var LO_ZH=["低","不足","缺乏","偏低","较低","偏","少"];
var OK_ZH=["正常","良好","优","优秀"];
var PS_ZH=["好","优","良好","充足","健康","坚韧","蓬勃","繁荣"];
var NS_ZH=["差","危险","异常"];
function labelValence(lb){
  if(lb==null||lb==="")return"neutral";
  var l=lb.toLowerCase();
  var nC=hasNegC(l),pC=hasPosC(l);
  var hi=l.includes("high")||l.includes("severe")||l.includes("very high")||l.includes("extreme")||HI_ZH.some(function(x){return l.includes(x);});
  var lo=l.includes("low")||l.includes("poor")||l.includes("deficit")||l.includes("lack")||l.includes("very low")||l.includes("below")||LO_ZH.some(function(x){return l.includes(x);});
  var ok=l.includes("normal")||l.includes("good")||l.includes("excellent")||OK_ZH.some(function(x){return l.includes(x);});
  if(hi&&nC&&(pC===false))return"negative";
  if(lo&&pC&&(nC===false))return"negative";
  if(hi&&pC&&(nC===false))return"positive";
  if(lo&&nC&&(pC===false))return"positive";
  if(ok&&(nC===false))return"positive";
  if(pC&&(nC===false)&&(lo===false))return"positive";
  if(nC&&(pC===false)&&(hi===false))return"negative";
  if(pC&&nC)return"ambiguous";
  var PS=["good","excellent","strong","optimal","adequate","healthy","secure","stable","resilient","flexible","thriving","flourishing"].concat(PS_ZH);
  var NS=["poor","impaired","severe","critical","abnormal","danger"].concat(NS_ZH);
  if(hits(l,PS).length>0&&hits(l,NS).length===0)return"positive";
  if(hits(l,NS).length>0&&hits(l,PS).length===0)return"negative";
  return"neutral";
}
var C=[],tF=0,tR=0;
function auditR(r,fp,ctx){
  tR++;var lb=r.label||"",de=r.description||"",su=r.suggestions||[],lv=r.level||"";
  var st=Array.isArray(su)?su.join(" "):"";
  var val=labelValence(lb);
  if(val==="positive"){
    var nd=hits(de,NEG_D);if(nd.length)C.push({f:fp,ctx:ctx,r:{min:r.min,max:r.max,lv:lv,lb:lb},t:"POS_LABEL+NEG_DESC",p:"Label:"+lb,n:nd.map(function(x){return"["+x+"]";}).join(","),s:de.substring(0,250)});
    var ch=hits(st,CRISIS_KW);if(ch.length)C.push({f:fp,ctx:ctx,r:{min:r.min,max:r.max,lv:lv,lb:lb},t:"POS_LABEL+CRISIS_SUG",p:"Label:"+lb,n:ch.map(function(x){return"["+x+"]";}).join(","),s:st.substring(0,250)});
    var ns=hits(st,NEG_D).filter(function(h){return ch.indexOf(h)<0;});if(ns.length)C.push({f:fp,ctx:ctx,r:{min:r.min,max:r.max,lv:lv,lb:lb},t:"POS_LABEL+NEG_SUG",p:"Label:"+lb,n:ns.map(function(x){return"["+x+"]";}).join(","),s:st.substring(0,250)});
  }
  if(val==="negative"){
    var pd=hits(de,POS_D);if(pd.length)C.push({f:fp,ctx:ctx,r:{min:r.min,max:r.max,lv:lv,lb:lb},t:"NEG_LABEL+POS_DESC",n:"Label:"+lb,p:pd.map(function(x){return"["+x+"]";}).join(","),s:de.substring(0,250)});
  }
}
function auditF(fp){
  tF++;var d;try{d=JSON.parse(fs.readFileSync(fp,"utf-8"));}catch(e){return;}
  var i=d.interpretation;if(i==null)return;
  if(i.ranges&&Array.isArray(i.ranges)){for(var j=0;j<i.ranges.length;j++)auditR(i.ranges[j],fp,"main");}
  if(i.subscaleRanges&&typeof i.subscaleRanges==="object"){var ks=Object.keys(i.subscaleRanges);for(var j=0;j<ks.length;j++){var v=i.subscaleRanges[ks[j]];if(Array.isArray(v)){for(var k=0;k<v.length;k++)auditR(v[k],fp,"sub:"+ks[j]);}}}
}
console.log("=".repeat(80));
console.log("MINDQUEST SCALE INTERPRETATION CONTRADICTION AUDIT (v2 - Semantic)");
console.log("=".repeat(80));
console.log("Date: "+new Date().toISOString());console.log("");
for(var di=0;di<DIRS.length;di++){
  var dir=DIRS[di];
  if(fs.existsSync(dir)===false){console.log("[WARN] Missing: "+dir);continue;}
  var ff=fs.readdirSync(dir).filter(function(x){return x.endsWith(".json");});
  console.log("Scanning "+path.basename(dir)+"/ ("+ff.length+" JSON files)...");
  for(var fi=0;fi<ff.length;fi++)auditF(path.join(dir,ff[fi]));
}
console.log("");console.log("=".repeat(80));console.log("CONTRADICTIONS FOUND");console.log("=".repeat(80));
if(C.length===0){console.log("No contradictions detected.");}
else{
  var byF={};for(var ci=0;ci<C.length;ci++){var c=C[ci];if(byF[c.f]===undefined)byF[c.f]=[];byF[c.f].push(c);}
  var idx=0;var fks=Object.keys(byF);
  for(var fi=0;fi<fks.length;fi++){
    var file=fks[fi];var issues=byF[file];
    var rel=file.replace(/.*mindquest-mp[/\\]/,"");
    console.log("");console.log("-".repeat(80));console.log("FILE: "+rel);console.log("-".repeat(80));
    for(var ii=0;ii<issues.length;ii++){
      var c=issues[ii];idx++;
      console.log("");console.log("  [#"+idx+"] "+c.t);
      console.log("    Context: "+c.ctx);
      console.log("    Range: ["+c.r.min+"-"+c.r.max+"] level="+c.r.lv+" label="+c.r.lb);
      console.log("    Positive: "+c.p);
      console.log("    Negative: "+c.n);
      console.log("    Snippet: "+c.s);
    }
  }
}
console.log("");console.log("=".repeat(80));console.log("SUMMARY");console.log("=".repeat(80));
console.log("Total files scanned:        "+tF);
console.log("Total ranges scanned:       "+tR);
console.log("Total contradictions found: "+C.length);
console.log("Files with contradictions:  "+new Set(C.map(function(c){return c.f;})).size);
console.log("");
var byT={};for(var ci=0;ci<C.length;ci++){var t=C[ci].t;byT[t]=(byT[t]||0)+1;}
console.log("Breakdown by type:");var tks=Object.keys(byT);for(var ti=0;ti<tks.length;ti++)console.log("  "+tks[ti]+": "+byT[tks[ti]]);
console.log("");console.log("=".repeat(80));console.log("AUDIT COMPLETE");console.log("=".repeat(80));