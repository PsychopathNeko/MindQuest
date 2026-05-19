const fs = require("fs");
const DIR = "C:/Users/23583/testweb/public/data/scales";
function w(n,d){fs.writeFileSync(DIR+"/"+n,JSON.stringify(d,null,2));console.log(n);}

// ========== IES-R EN ==========
w("ies-r.en.json", {
  meta: {id:"ies-r",name:"IES-R Impact of Event Scale - Revised",fullName:"Impact of Event Scale - Revised",description:"The IES-R is a 22-item self-report measure that assesses subjective distress caused by traumatic events. It measures three dimensions of post-traumatic stress: intrusion, avoidance, and hyperarousal.",author:"Weiss & Marmar (1997)",license:"Free to use",reference:"Weiss DS, Marmar CR. The Impact of Event Scale-Revised. In: Wilson JP, Keane TM, eds. Assessing Psychological Trauma and PTSD. New York: Guilford Press; 1997:399-411.",instruction:"Below is a list of difficulties people sometimes have after stressful life events. Please read each item and then indicate how distressing each difficulty has been for you during the past 7 days with respect to the event you experienced."},
  commonChoices:[{value:0,label:"Not at all"},{value:1,label:"A little bit"},{value:2,label:"Moderately"},{value:3,label:"Quite a bit"},{value:4,label:"Extremely"}],
  questions:[
    {index:0,text:"Any reminder brought back feelings about it",type:"likert"},
    {index:1,text:"I had trouble staying asleep",type:"likert"},
    {index:2,text:"Other things kept making me think about it",type:"likert"},
    {index:3,text:"I felt irritable and angry",type:"likert"},
    {index:4,text:"I avoided letting myself get upset when I thought about it or was reminded of it",type:"likert"},
    {index:5,text:"I thought about it when I did not mean to",type:"likert"},
    {index:6,text:"I felt as if it had not happened or was not real",type:"likert"},
    {index:7,text:"I stayed away from reminders about it",type:"likert"},
    {index:8,text:"Pictures about it popped into my mind",type:"likert"},
    {index:9,text:"I was jumpy and easily startled",type:"likert"},
    {index:10,text:"I tried not to think about it",type:"likert"},
    {index:11,text:"I was aware that I still had a lot of feelings about it, but I did not deal with them",type:"likert"},
    {index:12,text:"My feelings about it were kind of numb",type:"likert"},
    {index:13,text:"I found myself acting or feeling like I was back at that time",type:"likert"},
    {index:14,text:"I had trouble falling asleep",type:"likert"},
    {index:15,text:"I had waves of strong feelings about it",type:"likert"},
    {index:16,text:"I tried to remove it from my memory",type:"likert"},
    {index:17,text:"I had trouble concentrating",type:"likert"},
    {index:18,text:"Reminders of it caused me to have physical reactions, such as sweating, trouble breathing, nausea, or a pounding heart",type:"likert"},
    {index:19,text:"I had dreams about it",type:"likert"},
    {index:20,text:"I felt watchful and on guard",type:"likert"},
    {index:21,text:"I tried not to talk about it",type:"likert"}
  ],
  scoring:{method:"subscale",maxTotal:88,maxItemScore:4,subscales:[
    {id:"intrusion",name:"Intrusion",items:[0,1,2,5,8,13,15,19],maxScore:32},
    {id:"avoidance",name:"Avoidance",items:[4,6,7,10,11,12,16,21],maxScore:32},
    {id:"hyperarousal",name:"Hyperarousal",items:[3,9,14,17,18,20],maxScore:24}
  ]},
  interpretation:{
    ranges:[
      {min:0,max:23,level:"normal",label:"Normal Range",description:"Your score is within the normal range, suggesting that the event has not caused significant ongoing psychological distress.",suggestions:["Continue maintaining healthy coping strategies","Allow yourself to process the experience at your own pace","Stay connected with supportive people in your life"]},
      {min:24,max:32,level:"mild",label:"Mild Impact",description:"Your score suggests some degree of post-traumatic distress that may warrant attention.",suggestions:["Monitor your symptoms over the coming weeks","Practice stress management and self-care routines","Talk to someone you trust about your experiences","Consider consulting a mental health professional if symptoms persist"]},
      {min:33,max:36,level:"moderate",label:"Moderate Impact",description:"Your score indicates moderate post-traumatic distress. The event is having a notable impact on your well-being.",suggestions:["Seek support from a mental health professional","Practice grounding and relaxation techniques","Maintain regular routines for sleep and daily activities","Avoid isolating yourself; stay connected with others"]},
      {min:37,max:88,level:"severe",label:"Severe Impact",description:"Your score indicates severe post-traumatic distress significantly affecting your psychological well-being and daily functioning.",suggestions:["Please seek professional help from a trauma-specialized therapist","If you are in crisis, contact a crisis helpline (e.g., 988 Suicide & Crisis Lifeline)","Create a safety plan for managing intense distress","Follow professional treatment recommendations closely"]}
    ],
    subscaleRanges:{
      intrusion:[{min:0,max:8,level:"normal",label:"Low",description:"Intrusion symptoms are within the normal range."},{min:9,max:16,level:"mild",label:"Mild",description:"Some intrusive thoughts, memories, or dreams related to the event."},{min:17,max:24,level:"moderate",label:"Moderate",description:"Notable intrusive symptoms that may disrupt daily life."},{min:25,max:32,level:"severe",label:"Severe",description:"Severe intrusion symptoms significantly impacting functioning."}],
      avoidance:[{min:0,max:8,level:"normal",label:"Low",description:"Avoidance symptoms are within the normal range."},{min:9,max:16,level:"mild",label:"Mild",description:"Some avoidance of reminders related to the event."},{min:17,max:24,level:"moderate",label:"Moderate",description:"Notable avoidance patterns that may limit activities."},{min:25,max:32,level:"severe",label:"Severe",description:"Severe avoidance significantly restricting daily life."}],
      hyperarousal:[{min:0,max:6,level:"normal",label:"Low",description:"Hyperarousal symptoms are within the normal range."},{min:7,max:12,level:"mild",label:"Mild",description:"Some hyperarousal symptoms such as difficulty sleeping or irritability."},{min:13,max:18,level:"moderate",label:"Moderate",description:"Notable hyperarousal affecting daily functioning."},{min:19,max:24,level:"severe",label:"Severe",description:"Severe hyperarousal symptoms."}]
    }
  },
  report:{charts:["gauge","bar","radar"],gaugeConfig:{min:0,max:88},barConfig:{subscaleIds:["intrusion","avoidance","hyperarousal"],maxDisplayScore:32},radarConfig:{indicators:[{name:"Intrusion",max:32},{name:"Avoidance",max:32},{name:"Hyperarousal",max:24}]}}
});

console.log("IES-R EN done");
