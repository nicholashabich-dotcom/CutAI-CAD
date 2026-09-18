(()=>{
"use strict";
window.CutAIMachineArchitecture={
 version:"0.7.5",
 controllers:[
  {id:"imsnc",name:"MicroStep iMSNC",recommendedPost:"microstep-din",family:"MicroStep"},
  {id:"eckelmann",name:"Eckelmann",recommendedPost:"eckelmann",family:"Eckelmann"},
  {id:"neutral",name:"Neutral / noch nicht festgelegt",recommendedPost:"neutral",family:"Neutral"}
 ],
 processes:[
  {id:"plasma",name:"Plasma",manufacturers:["Hypertherm","Kjellberg","Andere / generisch"],modes:[["vertical","Senkrecht"],["rotator_bevel","Rotator / Bevel"]]},
  {id:"laser",name:"Laser",manufacturers:["IPG","Raycus","Andere / generisch"],modes:[["vertical","Senkrecht"],["bevel","Bevel-Kopf"]]},
  {id:"oxyfuel",name:"Autogen",manufacturers:["Generisch"],modes:[["vertical","Senkrecht"]]},
  {id:"drill",name:"Bohren",manufacturers:["Generisch"],modes:[["spindle","Bohrspindel"]]},
  {id:"waterjet",name:"Wasserstrahl",manufacturers:["Generisch"],modes:[["vertical","Senkrecht"],["rotator_bevel","Rotator / Bevel"]]}
 ],
 defaultStations:[
  {id:"plasma-hypertherm-bevel",label:"Plasma · Hypertherm · Rotator/Bevel",process:"plasma",manufacturer:"Hypertherm",model:"XPR300",mode:"rotator_bevel",enabled:true},
  {id:"oxyfuel-1",label:"Autogen · senkrecht",process:"oxyfuel",manufacturer:"Generisch",model:"",mode:"vertical",enabled:true},
  {id:"drill-1",label:"Bohren",process:"drill",manufacturer:"Generisch",model:"",mode:"spindle",enabled:true}
 ],
 toolTemplates:{
  plasma:{
   vertical:[
    {code:"T111",name:"Plasma senkrecht",role:"cut"},
    {code:"T411",name:"Plasmamarkieren",role:"mark"},
    {code:"T511",name:"Plasmakörnen",role:"punch",canPunch:true},
    {code:"T611",name:"Quality Hole / THT",role:"cut",supportsTHT:true}
   ],
   rotator_bevel:[
    {code:"T111",name:"Plasma senkrecht",role:"cut"},
    {code:"T211",name:"Plasma Fase positiv / oben",role:"cut",rotationType:5,canVariableBevel:true},
    {code:"T311",name:"Plasma Fase negativ / unten",role:"cut",rotationType:5,canVariableBevel:true},
    {code:"T411",name:"Plasmamarkieren",role:"mark"},
    {code:"T511",name:"Plasmakörnen",role:"punch",canPunch:true},
    {code:"T611",name:"Quality Hole / THT",role:"cut",supportsTHT:true}
   ]
  },
  laser:{
   vertical:[
    {code:"T111",name:"Laser schneiden",role:"cut"},
    {code:"T411",name:"Lasermarkieren",role:"mark"}
   ],
   bevel:[
    {code:"T111",name:"Laser senkrecht",role:"cut"},
    {code:"T211",name:"Laser Fase positiv / oben",role:"cut",rotationType:5,canVariableBevel:true},
    {code:"T311",name:"Laser Fase negativ / unten",role:"cut",rotationType:5,canVariableBevel:true},
    {code:"T411",name:"Lasermarkieren",role:"mark"}
   ]
  },
  oxyfuel:{vertical:[{code:"T12",name:"Autogen schneiden",role:"cut"}]},
  drill:{spindle:[{code:"T%d15",name:"Bohren",role:"drill"}]},
  waterjet:{
   vertical:[{code:"T111",name:"Wasserstrahl senkrecht",role:"cut"}],
   rotator_bevel:[
    {code:"T111",name:"Wasserstrahl senkrecht",role:"cut"},
    {code:"T211",name:"Wasserstrahl Fase positiv / oben",role:"cut",rotationType:5,canVariableBevel:true},
    {code:"T311",name:"Wasserstrahl Fase negativ / unten",role:"cut",rotationType:5,canVariableBevel:true}
   ]
  }
 },
 colors:{
  plasma:"#38bdf8", laser:"#a855f7", oxyfuel:"#f59e0b", drill:"#14b8a6", waterjet:"#06b6d4",
  bevelTop:"#fb923c", bevelBottom:"#ef4444", mark:"#22c55e", punch:"#eab308", none:"#64748b"
 }
};
})();