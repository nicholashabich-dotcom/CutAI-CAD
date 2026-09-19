(()=>{
"use strict";
const NUMBER="-?\\d+(?:[.,]\\d+)?";
const WORD_NUM={ein:1,eine:1,einen:1,eins:1,zwei:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10};
const ALLOWED=new Set(["set_sheet","set_material","add_rect","add_circle","corner_holes","select_all","clear_selection","move","duplicate","delete","assign_station","set_technology_reference","assign_tool","set_bevel","set_edge_bevel","set_lead_in","set_lead_out","auto_order","set_view","fit_view","validate"]);
function n(v){const x=Number(String(v??"").replace(",","."));return Number.isFinite(x)?x:null}
function wordN(v){const s=String(v||"").toLowerCase();return WORD_NUM[s]??n(s)}
function lower(s){return String(s||"").toLowerCase().replace(/×/g,"x").replace(/–|—/g,"-")}
function action(type,params,label,target="selection_or_created"){return{type,params:params||{},label:label||type,target}}
function dimMatch(s,lead){const r=new RegExp(lead+`[^\\d-]{0,25}(${NUMBER})\\s*(?:x|mal)\\s*(${NUMBER})`,"i");const m=s.match(r);return m?{a:n(m[1]),b:n(m[2])}:null}
function coordPair(fragment){let m=fragment.match(new RegExp(`x\\s*[=:]?\\s*(${NUMBER})[^\\d-]{0,20}y\\s*[=:]?\\s*(${NUMBER})`,"i"));if(m)return{x:n(m[1]),y:n(m[2])};m=fragment.match(new RegExp(`(?:bei|ab|position)\\s*(${NUMBER})\\s*[,;/ ]\\s*(${NUMBER})`,"i"));return m?{x:n(m[1]),y:n(m[2])}:null}
function extractAngle(s,key){const r=new RegExp(`${key}[^\\d-]{0,12}(${NUMBER})\\s*(?:°|grad)?`,"i"),m=s.match(r);return m?n(m[1]):null}
function materialCode(v){const x=String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"");const map={S235:"MST",S235JR:"MST",S355:"MST",S355JR:"MST",STAHL:"MST",BAUSTAHL:"MST",MST:"MST",EDELSTAHL:"SST",INOX:"SST",SST:"SST",ALU:"AL",ALUMINIUM:"AL",ALUMINUM:"AL",AL:"AL"};return map[x]||x}
function technologyCandidates(ctx,q={}){let xs=Array.isArray(ctx?.machinePackage?.technologies)?ctx.machinePackage.technologies:[];if(q.stationId)xs=xs.filter(x=>x.stationId===q.stationId);if(q.process)xs=xs.filter(x=>x.process===q.process);if(q.manufacturer)xs=xs.filter(x=>String(x.manufacturer||"").toLowerCase().includes(String(q.manufacturer).toLowerCase()));if(q.material)xs=xs.filter(x=>materialCode(x.material)===materialCode(q.material));if(q.thicknessMm!=null)xs=xs.filter(x=>x.thicknessMm!=null&&Math.abs(Number(x.thicknessMm)-Number(q.thicknessMm))<.001);if(q.currentA!=null)xs=xs.filter(x=>x.currentA!=null&&Math.abs(Number(x.currentA)-Number(q.currentA))<.001);return xs}
function parse(prompt,ctx={}){
 const raw=String(prompt||"").trim(),s=lower(raw),actions=[],warnings=[],notes=[],questions=[];
 const push=(...x)=>actions.push(action(...x));
 if(!raw)return{version:"cutai-ai-plan/0.8",source:"local",prompt:raw,summary:"Keine Eingabe",actions,warnings:["Bitte einen Arbeitsauftrag eingeben."],notes,questions,intent:{}};

 // Sheet / material context
 let dm=dimMatch(s,"(?:tafel|blechgröße|blechmass|blechmaß|plattenmaß|plattengröße|arbeitsbereich)");
 if(dm&&dm.a>0&&dm.b>0)push("set_sheet",{widthMm:dm.a,heightMm:dm.b},`Tafel ${dm.a} × ${dm.b} mm setzen`,"project");
 let thickness=extractAngle(s,"(?:materialstärke|materialstaerke|dicke|stärke|staerke)");
 let mat=null;const known=["s235jr","s235","s355jr","s355","edelstahl","aluminium","alu","mst","sst"];
 for(const k of known)if(s.includes(k)){mat=k.toUpperCase().replace("ALU","Aluminium").replace("EDELSTAHL","Edelstahl");break}
 if(thickness==null&&mat){const tm=s.match(new RegExp(`(?:s235jr|s235|s355jr|s355|edelstahl|aluminium|alu|mst|sst)\\s*[-,:]?\\s*(${NUMBER})\\s*mm\\b`,"i"));if(tm)thickness=n(tm[1])}
 let mm=s.match(/material\s*[:=]?\s*([a-z0-9._+-]+)/i);if(mm&&!/stärke|staerke/i.test(mm[1]))mat=mm[1].toUpperCase();
 if(mat||thickness!=null)push("set_material",{name:mat,thicknessMm:thickness},`Material${mat?` ${mat}`:""}${thickness!=null?` · ${thickness} mm`:""} setzen`,"project");

 // Geometry
 const rectRe=new RegExp(`(?:rechteck|bauteil)\\s*(?:mit\\s*)?(${NUMBER})\\s*(?:x|mal)\\s*(${NUMBER})([^.;\\n]*)`,`ig`);let m;
 while((m=rectRe.exec(raw))){const w=n(m[1]),h=n(m[2]),p=coordPair(m[3]||"")||{x:0,y:0};if(w>0&&h>0)push("add_rect",{widthMm:w,heightMm:h,x:p.x,y:p.y},`Rechteck ${w} × ${h} mm bei X ${p.x}, Y ${p.y}`,"new")}
 // Circle commands, but not generic plural holes
 const circleRe=new RegExp(`(?:kreis|loch)\\s*(?:mit\\s*)?(?:ø|⌀|durchmesser|d)?\\s*(${NUMBER})([^.;\\n]*)`,`ig`);
 while((m=circleRe.exec(raw))){if(/löcher|bohrungen/i.test(m[0]))continue;const d=n(m[1]),p=coordPair(m[2]||"");if(d>0&&p)push("add_circle",{diameterMm:d,x:p.x,y:p.y},`Kreis Ø${d} mm bei X ${p.x}, Y ${p.y}`,"new")}
 // Corner-hole pattern
 const holes=s.match(new RegExp(`(?:(\\d+|ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht)\\s*)?(?:bohrungen|löcher|loecher)[^.;\\n]{0,60}?(?:ø|⌀|durchmesser)\\s*(${NUMBER})([^.;\\n]{0,100})`,"i"));
 if(holes){const count=wordN(holes[1]||"4")||4,d=n(holes[2]),tail=holes[3]||"",om=tail.match(new RegExp(`(${NUMBER})\\s*mm[^.;\\n]{0,35}(?:ecken|ecke|rand|abstand)|(?:ecken|ecke|rand|abstand)[^\\d-]{0,20}(${NUMBER})`,"i")),off=om?n(om[1]??om[2]):null;if(off!=null){push("corner_holes",{count,diameterMm:d,offsetMm:off},`${count} Ecklöcher Ø${d} mm · Abstand ${off} mm`,"last_rect_or_selection");if(count!==4)warnings.push("Der lokale Planer verteilt Ecklöcher derzeit auf maximal vier Rechteckecken; für andere Lochbilder ist eine präzisere Angabe nötig.")}else warnings.push("Bohrungen erkannt, aber kein eindeutiger Rand-/Eckabstand. Das Lochbild wird deshalb nicht automatisch erzeugt.")}

 // Selection / editing
 if(/(?:alles|alle konturen|alle abschnitte)\s+(?:auswählen|markieren)/i.test(s)||/alles auswählen/.test(s))push("select_all",{},"Alle Konturen auswählen","project");
 if(/auswahl\s+(?:aufheben|löschen)|nichts auswählen/.test(s))push("clear_selection",{},"Auswahl aufheben","project");
 if(/(?:auswahl|kontur|abschnitt)[^.;\n]{0,20}(?:kopieren|duplizieren)/.test(s))push("duplicate",{dx:10,dy:10},"Auswahl duplizieren","selection");
 if(/(?:auswahl|kontur|abschnitt)[^.;\n]{0,20}löschen/.test(s))push("delete",{},"Auswahl löschen","selection");
 let dx=0,dy=0,hasMove=false,mmv;
 mmv=s.match(new RegExp(`(?:verschieb|bewege)[^.;\\n]{0,100}?dx\\s*[=:]?\\s*(${NUMBER})[^.;\\n]{0,30}?dy\\s*[=:]?\\s*(${NUMBER})`,"i"));
 if(mmv){dx=n(mmv[1]);dy=n(mmv[2]);hasMove=true}else if(/verschieb|bewege/.test(s)){
   let q=s.match(new RegExp(`(${NUMBER})\\s*mm\\s*nach\\s*rechts`,"i"));if(q){dx+=n(q[1]);hasMove=true}q=s.match(new RegExp(`(${NUMBER})\\s*mm\\s*nach\\s*links`,"i"));if(q){dx-=n(q[1]);hasMove=true}q=s.match(new RegExp(`(${NUMBER})\\s*mm\\s*nach\\s*(?:oben|hoch)`,"i"));if(q){dy-=n(q[1]);hasMove=true}q=s.match(new RegExp(`(${NUMBER})\\s*mm\\s*nach\\s*(?:unten|runter)`,"i"));if(q){dy+=n(q[1]);hasMove=true}
 }
 if(hasMove)push("move",{dx,dy},`Auswahl um ΔX ${dx}, ΔY ${dy} mm verschieben`,"selection");

 // Machine station / process intent
 const createsGeometry=actions.some(x=>x.type==="add_rect"||x.type==="add_circle"||x.type==="corner_holes");
 const proc=s.includes("wasserstrahl")?"waterjet":s.includes("autogen")||s.includes("oxy")?"oxyfuel":s.includes("bohren")||s.includes("bohrspindel")?"drill":s.includes("laser")||s.includes("ipg")||s.includes("raycus")?"laser":s.includes("plasma")||s.includes("hypertherm")||s.includes("kjellberg")?"plasma":null;
 const manufacturer=s.includes("hypertherm")?"Hypertherm":s.includes("kjellberg")?"Kjellberg":s.includes("raycus")?"Raycus":s.includes("ipg")?"IPG":null;
 const mode=/rotator|bevel|fasenkopf|\bfase\b|\bfasen\b/.test(s)?(proc==="laser"?"bevel":"rotator_bevel"):/senkrecht|gerade/.test(s)?"vertical":proc==="drill"?"spindle":null;
 let model=null;const mo=raw.match(/\b(XPR\s*(?:170|300|460)|SmartFL|HiFocus\s*\d+|HiFocus|FineFocus\s*\d+|CutFire\s*\w+)\b/i);if(mo)model=mo[1].replace(/\s+/g," ");else if(/\bXPR\b/i.test(raw))model="XPR";
 const stationCandidates=(ctx.stations||[]).filter(st=>(!proc||st.process===proc)&&(!manufacturer||String(st.manufacturer).toLowerCase().includes(manufacturer.toLowerCase()))&&(!model||String(st.model||"").toLowerCase().includes(String(model).toLowerCase()))&&(!mode||st.mode===mode));
 const prefStation=ctx.preferences?.stationId;let stationMatch=(prefStation&&stationCandidates.find(x=>x.id===prefStation))||stationCandidates[0]||null;
 if((proc||manufacturer||mode||model)&&stationCandidates.length>1&&!prefStation){questions.push({id:"stationId",kind:"station",text:"Mehrere aktive Stationen passen. Welche soll verwendet werden?",options:stationCandidates.slice(0,10).map(st=>({value:st.id,label:st.label||st.id}))});stationMatch=null}
 if(proc||manufacturer||mode||model){if(ctx.machinePackage&&!stationMatch&&!stationCandidates.length)warnings.push(`Die geladene Maschine besitzt keine passende aktive Station für ${[proc,manufacturer,model,mode].filter(Boolean).join(" / ")}. CutAI legt deshalb keine erfundene Station an.`);else if(stationMatch)push("assign_station",{process:proc||stationMatch.process,manufacturer:manufacturer||stationMatch.manufacturer,mode:mode||stationMatch.mode,model:model||stationMatch.model,stationId:stationMatch.id},`Station zuweisen: ${stationMatch.label||[proc,manufacturer,mode,model].filter(Boolean).join(" · ")}`,createsGeometry?"created_all_or_selection":"selection_or_created")}
 // Exact machine technology reference, only when the loaded package supports it.
 const currentMatch=s.match(new RegExp(`(${NUMBER})\\s*a(?:mpere)?\\b`,"i")),currentA=currentMatch?n(currentMatch[1]):null,techMaterial=materialCode(mat||ctx.project?.material?.name||""),techThickness=thickness??ctx.project?.material?.thicknessMm??null;
 const techIntent=Boolean(proc||manufacturer||model||currentA!=null||/technologie|prozess|schneiddaten/.test(s));
 if(ctx.machinePackage&&techIntent&&stationMatch){
   const q={stationId:stationMatch.id,process:proc||stationMatch.process||null,manufacturer:manufacturer||stationMatch.manufacturer||null,material:techMaterial||null,thicknessMm:techThickness,currentA};let tc=technologyCandidates(ctx,q);const prefTech=ctx.preferences?.technologyId;if(prefTech){const exact=tc.find(x=>x.id===prefTech)||technologyCandidates(ctx,{stationId:stationMatch.id}).find(x=>x.id===prefTech);if(exact)tc=[exact]}
   if(tc.length===1){const t=tc[0];push("set_technology_reference",{id:t.id,stationId:t.stationId},`Maschinentechnologie: ${t.fileName||t.id}`,"project")}
   else if(tc.length>1){questions.push({id:"technologyId",kind:"technology",text:`${tc.length} Maschinen-Technologien passen zu ${techMaterial||"Material"} ${techThickness!=null?techThickness+" mm":""}. Welche soll verwendet werden?`,options:tc.slice(0,12).map(x=>({value:x.id,label:[x.currentA!=null?x.currentA+" A":null,x.gases?.length?x.gases.join("+"):null,x.fileName||x.id].filter(Boolean).join(" · ")}))})}
   else if((mat||thickness!=null||currentA!=null)&&(ctx.machinePackage.technologies||[]).length)warnings.push("Für die genannten Material-/Stromdaten wurde im geladenen Maschinenpaket keine exakte Technologiedatei gefunden. Es wird keine Technologie erfunden.")
 }

 // Tool intent
 let tool=null;
 if(/quality\s*hole|tht/.test(s))tool={code:"T611",role:"cut"};
 else if(/plasma.?körn|koern|körnen/.test(s))tool={code:"T511",role:"punch"};
 else if(/markieren|markierung/.test(s))tool={role:"mark"};
 else if(/bohrwerkzeug|mit bohrer|bohren/.test(s))tool={role:"drill"};
 else if(/autogen/.test(s))tool={code:"T12",role:"cut"};
 else if(/fase\s*(?:oben|positiv)|schrägschneiden\s*oben/.test(s))tool={code:"T211",role:"cut"};
 else if(/fase\s*(?:unten|negativ)|schrägschneiden\s*unten/.test(s))tool={code:"T311",role:"cut"};
 else if(/senkrecht|gerades schneiden|gerade schneiden/.test(s))tool={code:"T111",role:"cut"};
 if(tool){const toolTarget=/außenkontur|aussenkontur|außenkante|aussenkante/.test(s)?"outer_or_selection":/innenkontur|löcher|loecher|bohrungen/.test(s)?"inside_or_selection":createsGeometry&&/fase|schräg/.test(s)?"outer_or_selection":createsGeometry?"created_all_or_selection":"selection_or_created";push("assign_tool",tool,`Werkzeug ${tool.code||tool.role} zuweisen`,toolTarget);}

 // Bevel
 let bt=ctx.preferences?.bevelType||null;if(!bt){if(/k[- ]?fase|\bk\s*30|fasentyp\s*k/.test(s))bt="K";else if(/x[- ]?fase|fasentyp\s*x/.test(s))bt="X";else if(/y[- ]?fase[^.;\n]*(unten|negativ)|y unten/.test(s))bt="Y_BOTTOM";else if(/y[- ]?fase|y oben/.test(s))bt="Y_TOP";else if(/v[- ]?fase[^.;\n]*(unten|negativ)|v unten/.test(s))bt="V_BOTTOM";else if(/v[- ]?fase|v oben|fase oben|fase positiv/.test(s))bt="V_TOP";else if(/fase unten|fase negativ/.test(s))bt="V_BOTTOM"}
 const bevelIntent=/\bfase\b|fasenschnitt|schrägschnitt|schraegschnitt/.test(s)&&!/fase\s+(?:aus|entfernen|löschen)|ohne fase/.test(s);
 if(!bt&&bevelIntent)questions.push({id:"bevelType",kind:"bevel",text:"Welcher Fasentyp soll verwendet werden?",options:[{value:"V_TOP",label:"V oben (positiv)"},{value:"V_BOTTOM",label:"V unten (negativ)"},{value:"Y_TOP",label:"Y oben"},{value:"Y_BOTTOM",label:"Y unten"},{value:"X",label:"X-Fase"},{value:"K",label:"K-Fase"}]});
 if(bt){let a1=extractAngle(s,"(?:alfa1|alpha1|winkel|fase|oben)"),a2=extractAngle(s,"(?:alfa2|alpha2|unten)");const before=s.match(new RegExp(`(${NUMBER})\\s*(?:°|grad)?\\s*(?:(?:v|y|x|k)[- ]?)?fase`,"i"));if(a1==null&&before)a1=n(before[1]);if(a1==null)a1=30;if(a2==null)a2=a1;const slash=s.match(new RegExp(`(${NUMBER})\\s*(?:°|grad)?\\s*[/\\-]\\s*(${NUMBER})\\s*(?:°|grad)?`));if(slash){a1=n(slash[1]);a2=n(slash[2])}const tp=extractAngle(s,"\\btp")??0,tn=extractAngle(s,"\\btn")??0,edge=/linke(?:n|r|s)?\s+(?:außen)?kante|linke\s+seite/.test(s)?"left":/rechte(?:n|r|s)?\s+(?:außen)?kante|rechte\s+seite/.test(s)?"right":/obere(?:n|r|s)?\s+(?:außen)?kante|obere\s+seite/.test(s)?"top":/untere(?:n|r|s)?\s+(?:außen)?kante|untere\s+seite/.test(s)?"bottom":null,bp={profileType:bt,alpha1Deg:a1,alpha2Deg:a2,topHeightMm:tp,landMm:tn,variable:/variabel/.test(s),constantSlope:/gleichbleibende schräge|gleichbleibend/.test(s)};if(edge)push("set_edge_bevel",{side:edge,bevel:bp},`${edge==="left"?"Linke":edge==="right"?"Rechte":edge==="top"?"Obere":"Untere"} Kante · ${bt}-Fase · α1 ${a1}°`,createsGeometry?"outer_or_selection":"selection_or_created");else push("set_bevel",bp,`${bt}-Fase · α1 ${a1}° · α2 ${a2}° · TP ${tp} · TN ${tn}`,createsGeometry?"outer_or_selection":"selection_or_created")}
 if(/fase\s+(?:aus|entfernen|löschen)|ohne fase/.test(s))push("set_bevel",{enabled:false},"Fase entfernen",createsGeometry?"outer_or_selection":"selection_or_created");

 // Leads
 let lead=s.match(new RegExp(`anlauf[^.;\\n]{0,70}?(${NUMBER})\\s*mm([^.;\\n]*)`,`i`));if(lead){const tail=lead[2]||"",ang=extractAngle(tail,"(?:winkel|mit|unter)")??0;push("set_lead_in",{type:/bogen|arc/.test(tail)?"arc":"line",lengthMm:n(lead[1]),angleDeg:ang,radiusMm:extractAngle(tail,"radius")??0},`Anlauf ${n(lead[1])} mm`,bt&&createsGeometry?"outer_or_selection":"selection_or_created")}
 lead=s.match(new RegExp(`auslauf[^.;\\n]{0,70}?(${NUMBER})\\s*mm([^.;\\n]*)`,`i`));if(lead){const tail=lead[2]||"",ang=extractAngle(tail,"(?:winkel|mit|unter)")??0;push("set_lead_out",{type:/bogen|arc/.test(tail)?"arc":"line",lengthMm:n(lead[1]),angleDeg:ang,radiusMm:extractAngle(tail,"radius")??0},`Auslauf ${n(lead[1])} mm`,bt&&createsGeometry?"outer_or_selection":"selection_or_created")}
 if(/anlauf\s+(?:aus|entfernen|löschen)/.test(s))push("set_lead_in",{type:"none",lengthMm:0},"Anlauf entfernen","selection_or_created");
 if(/auslauf\s+(?:aus|entfernen|löschen)/.test(s))push("set_lead_out",{type:"none",lengthMm:0},"Auslauf entfernen","selection_or_created");

 // Workflow
 if(/schneidfolge[^.;\n]{0,20}automatisch|automatische schneidfolge|automatisch ordnen/.test(s))push("auto_order",{},"Schneidfolge automatisch berechnen","project");
 if(/cam\s*prüfen|cam\s*pruefen|projekt\s*prüfen|projekt\s*pruefen|validier/.test(s))push("validate",{},"CAM prüfen","project");
 if(/alles anzeigen|einpassen|fit all/.test(s))push("fit_view",{},"Alles anzeigen","project");
 let vm=null;if(/ansicht[^.;\n]*werkzeug/.test(s))vm="tool";else if(/ansicht[^.;\n]*fase/.test(s))vm="bevel";else if(/ansicht[^.;\n]*schneidfolge/.test(s))vm="order";else if(/ansicht[^.;\n]*normal/.test(s))vm="normal";if(vm)push("set_view",{mode:vm},`Ansicht ${vm}`,"project");

 if(!actions.length&&!questions.length)warnings.push("Der lokale Planer hat noch keine eindeutig ausführbare CAD/CAM-Aktion erkannt. Formuliere Maße und Aktion konkreter oder nutze später den Online-KI-Endpunkt.");
 const summary=questions.length?`${actions.length} Aktion(en) vorbereitet · ${questions.length} Rückfrage(n) offen`:actions.length?`${actions.length} Aktion${actions.length===1?"":"en"} erkannt`:"Keine sichere Aktion erkannt";
 const intent={material:mat||null,materialCode:techMaterial||null,thicknessMm:techThickness,process:proc,manufacturer,model,mode,currentA,stationId:stationMatch?.id||null};
 return{version:"cutai-ai-plan/0.8",source:"local",prompt:raw,summary,actions,warnings,notes,questions,intent,contextHint:{selectionCount:ctx.selectionCount||0,contourCount:ctx.contourCount||0}};
}
function sanitizePlan(plan){
 const p=plan&&typeof plan==="object"?JSON.parse(JSON.stringify(plan)):{actions:[]};p.version="cutai-ai-plan/0.8";p.source=String(p.source||"remote");p.prompt=String(p.prompt||"");p.summary=String(p.summary||"");p.actions=Array.isArray(p.actions)?p.actions.filter(a=>a&&ALLOWED.has(a.type)).slice(0,100).map(a=>({type:a.type,params:a.params&&typeof a.params==="object"?a.params:{},label:String(a.label||a.type),target:String(a.target||"selection_or_created")})):[];p.warnings=Array.isArray(p.warnings)?p.warnings.map(String).slice(0,30):[];p.notes=Array.isArray(p.notes)?p.notes.map(String).slice(0,30):[];p.questions=Array.isArray(p.questions)?p.questions.slice(0,10).map(q=>({id:String(q.id||"question"),kind:String(q.kind||"choice"),text:String(q.text||"Auswahl erforderlich"),options:Array.isArray(q.options)?q.options.slice(0,20).map(o=>({value:String(o.value??""),label:String(o.label??o.value??"")})):[]})):[];p.intent=p.intent&&typeof p.intent==="object"?p.intent:{};return p
}
function actionText(a){return a?.label||a?.type||"Aktion"}
window.CutAIAI={version:"0.8",parse,sanitizePlan,actionText,allowed:[...ALLOWED]};
})();
