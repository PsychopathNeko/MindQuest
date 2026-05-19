import json, os

OUT = "C:/Users/23583/testweb/public/data/scales"

def w(name, data):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  {name}")

print("Generating scale files...")

# ===== WEMWBS EN =====
w("wemwbs.en.json", {
  "meta": {"id":"wemwbs","name":"WEMWBS Warwick-Edinburgh Mental Well-Being Scale","fullName":"Warwick-Edinburgh Mental Well-Being Scale","description":"The WEMWBS is a 14-item scale measuring positive mental well-being, covering subjective well-being and psychological functioning.","author":"Tennant et al. (2007)","license":"Free to use","reference":"Tennant R, et al. The Warwick-Edinburgh Mental Well-being Scale (WEMWBS). Health Qual Life Outcomes. 2007;5:63.","instruction":"Below are some statements about feelings and thoughts. Please select the option that best describes your experience over the past 2 weeks."},
  "commonChoices": [{"value":1,"label":"None of the time"},{"value":2,"label":"Rarely"},{"value":3,"label":"Some of the time"},{"value":4,"label":"Often"},{"value":5,"label":"All of the time"}],
  "questions": [{"index":i,"text":t,"type":"likert"} for i,t in enumerate([
    "I have been feeling optimistic about the future","I have been feeling useful","I have been feeling relaxed","I have been feeling interested in other people","I have had energy to spare","I have been dealing with problems well","I have been thinking clearly","I have been feeling good about myself","I have been feeling close to other people","I have been feeling confident","I have been able to make up my own mind about things","I have been feeling loved","I have been interested in new things","I have been feeling cheerful"
  ])],
  "scoring": {"method":"sum","maxTotal":70,"maxItemScore":5,"subscales":None},
  "interpretation": {"ranges":[
    {"min":14,"max":31,"level":"severe","label":"Very Low Well-Being","description":"Your mental well-being score is very low.","suggestions":["Consider seeking professional support","Focus on basic self-care","Reach out to trusted people","Small daily activities can help"]},
    {"min":32,"max":40,"level":"mild","label":"Below Average","description":"Your mental well-being is below average.","suggestions":["Identify joyful activities","Strengthen social connections","Practice gratitude","Consider counseling"]},
    {"min":41,"max":44,"level":"normal","label":"Average","description":"Your mental well-being is average.","suggestions":["Continue positive habits","Stay connected","Keep engaging in meaningful activities"]},
    {"min":45,"max":70,"level":"minimal","label":"Above Average","description":"Your mental well-being is above average.","suggestions":["Continue current practices","Share strategies with others","Stay engaged in purposeful activities"]}
  ],"subscaleRanges":None},
  "report": {"charts":["gauge"],"gaugeConfig":{"min":14,"max":70}}
})

# ===== WEMWBS ZH =====
w("wemwbs.zh.json", {
  "meta": {"id":"wemwbs","name":"WEMWBS \u534e\u5a01\u7231\u4e01\u5821\u5fc3\u7406\u5e78\u798f\u611f\u91cf\u8868","fullName":"Warwick-Edinburgh Mental Well-Being Scale","description":"WEMWBS \u662f\u4e00\u4efd\u5305\u542b 14 \u4e2a\u6761\u76ee\u7684\u91cf\u8868\uff0c\u8bc4\u4f30\u79ef\u6781\u5fc3\u7406\u5e78\u798f\u611f\u3002","author":"Tennant et al. (2007)","license":"Free to use","reference":"Tennant R, et al. Health Qual Life Outcomes. 2007;5:63.","instruction":"\u4ee5\u4e0b\u662f\u4e00\u4e9b\u5173\u4e8e\u611f\u53d7\u548c\u60f3\u6cd5\u7684\u63cf\u8ff0\uff0c\u8bf7\u9009\u62e9\u6700\u7b26\u5408\u60a8\u8fc7\u53bb\u4e24\u5468\u4f53\u9a8c\u7684\u9009\u9879\u3002"},
  "commonChoices": [{"value":1,"label":"\u6ca1\u6709"},{"value":2,"label":"\u5f88\u5c11"},{"value":3,"label":"\u6709\u4e9b\u65f6\u5019"},{"value":4,"label":"\u7ecf\u5e38"},{"value":5,"label":"\u603b\u662f"}],
  "questions": [{"index":i,"text":t,"type":"likert"} for i,t in enumerate([
    "\u6211\u4e00\u76f4\u5bf9\u672a\u6765\u611f\u5230\u4e50\u89c2","\u6211\u4e00\u76f4\u89c9\u5f97\u81ea\u5df1\u6709\u7528","\u6211\u4e00\u76f4\u611f\u89c9\u653e\u677e","\u6211\u4e00\u76f4\u5bf9\u4ed6\u4eba\u611f\u5174\u8da3","\u6211\u4e00\u76f4\u7cbe\u529b\u5145\u6c9b","\u6211\u4e00\u76f4\u80fd\u5f88\u597d\u5730\u5904\u7406\u95ee\u9898","\u6211\u4e00\u76f4\u601d\u8def\u6e05\u6670","\u6211\u4e00\u76f4\u5bf9\u81ea\u5df1\u611f\u89c9\u826f\u597d","\u6211\u4e00\u76f4\u89c9\u5f97\u4e0e\u4ed6\u4eba\u4eb2\u8fd1","\u6211\u4e00\u76f4\u611f\u5230\u81ea\u4fe1","\u6211\u4e00\u76f4\u80fd\u81ea\u5df1\u505a\u51b3\u5b9a","\u6211\u4e00\u76f4\u611f\u5230\u88ab\u7231","\u6211\u4e00\u76f4\u5bf9\u65b0\u4e8b\u7269\u611f\u5174\u8da3","\u6211\u4e00\u76f4\u611f\u5230\u6109\u5feb"
  ])],
  "scoring": {"method":"sum","maxTotal":70,"maxItemScore":5,"subscales":None},
  "interpretation": {"ranges":[
    {"min":14,"max":31,"level":"severe","label":"\u5e78\u798f\u611f\u5f88\u4f4e","description":"\u60a8\u7684\u5fc3\u7406\u5e78\u798f\u611f\u5f97\u5206\u5f88\u4f4e\u3002","suggestions":["\u8003\u8651\u5bfb\u6c42\u4e13\u4e1a\u652f\u6301","\u5173\u6ce8\u57fa\u672c\u81ea\u6211\u7167\u987e","\u5411\u4fe1\u4efb\u7684\u4eba\u503e\u8bc9","\u65e5\u5e38\u5c0f\u6d3b\u52a8\u53ef\u9010\u6b65\u6539\u5584"]},
    {"min":32,"max":40,"level":"mild","label":"\u5e78\u798f\u611f\u504f\u4f4e","description":"\u60a8\u7684\u5fc3\u7406\u5e78\u798f\u611f\u4f4e\u4e8e\u5e73\u5747\u6c34\u5e73\u3002","suggestions":["\u627e\u5230\u5e26\u6765\u5feb\u4e50\u7684\u6d3b\u52a8","\u52a0\u5f3a\u793e\u4ea4\u8054\u7cfb","\u7ec3\u4e60\u611f\u6069","\u8003\u8651\u5fc3\u7406\u54a8\u8be2"]},
    {"min":41,"max":44,"level":"normal","label":"\u5e78\u798f\u611f\u4e2d\u7b49","description":"\u60a8\u7684\u5fc3\u7406\u5e78\u798f\u611f\u5904\u4e8e\u5e73\u5747\u8303\u56f4\u3002","suggestions":["\u7ee7\u7eed\u4fdd\u6301\u79ef\u6781\u4e60\u60ef","\u4e0e\u4ed6\u4eba\u4fdd\u6301\u8054\u7cfb","\u53c2\u4e0e\u6709\u610f\u4e49\u7684\u6d3b\u52a8"]},
    {"min":45,"max":70,"level":"minimal","label":"\u5e78\u798f\u611f\u826f\u597d","description":"\u60a8\u7684\u5fc3\u7406\u5e78\u798f\u611f\u9ad8\u4e8e\u5e73\u5747\u6c34\u5e73\u3002","suggestions":["\u7ee7\u7eed\u5f53\u524d\u7684\u79ef\u6781\u505a\u6cd5","\u4e0e\u4ed6\u4eba\u5206\u4eab\u5e78\u798f\u7b56\u7565","\u4fdd\u6301\u53c2\u4e0e\u6709\u610f\u4e49\u7684\u6d3b\u52a8"]}
  ],"subscaleRanges":None},
  "report": {"charts":["gauge"],"gaugeConfig":{"min":14,"max":70}}
})

print("Batch 1 done")
