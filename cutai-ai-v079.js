(()=>{
"use strict";
const NUMBER="-?\\d+(?:[.,]\\d+)?";
const WORD_NUM={ein:1,eine:1,einen:1,eins:1,zwei:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10};
const ALLOWED=new Set(["set_sheet","set_material","add_rect","add_circle","corner_holes","select_all","clear_selection","move","duplicate","delete","assign_station","set_technology_reference","set_template_reference","assign_tool","set_bevel","set_lead_in","set_lead_out","apply_reference_metadata","import_reference_geometry","compare_reference","auto_order","set_view","fit_view","validate"]);
function n(v){const x=Number(String(v??"").replace(",","."));return Number.isFinite(x)?x:null}
function wordN(v){const s=String(v||"").toLowerCase();return WORD_NUM[s]??n(s)}
function lower(s){return String(s||"").toLowerCase().replace(/×/g,"x").replace(/–|—/g,"-")}
function action(type,params,label,target="selection_or_created"){return{type,params:params||{},label:label||type,target}}
function dimMatch(s,lead){const r=new RegExp(lead+`[^\\d-]{0,25}(${NUMBER})\\s*(?:x|mal)\\s*(${NUMBER})`,"i");const m=s.match(r);return m?{a:n(m[1]),b:n(m[2])}:null}
function coordPair(fragment){let m=fragment.match(new RegExp(`x\\s*[=:]?\\s*(${NUMBER})[^\\d-]{0,20}y\\s*[=:]?\\s*(${NUMBER})`,"i"));if(m)return{x:n(m[1]),y:n(m[2])};m=fragment.match(new RegExp(`(?:bei|ab|position)\\s*(${NUMBER})\\s*[,;/ ]\\s*(${NUMBER})`,"i"));return m?{x:n(m[1]),y:n(m[2])}:null}
function extractAngle(s,key){const r=new RegExp(`${key}[^\\d-]{0,12}(${NUMBER})\\s*(?:°|grad)?`,"i"),m=s.match(r);return m?n(m[1]):null}
function materialCode(v){const x=String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"");const map={S235:"MST",S235JR:"MST",S355:"MST",S355JR:"MST",STAHL:"MST",BAUSTAHL:"MST",MST:"MST",EDELSTAHL:"SST",INOX:"SST",SST:"SST",ALU:"AL",ALUMINIUM:"AL",ALUMINUM:"AL",AL:"AL"};return map[x]||x}
function technologyCandidates(ctx,q={}){let xs=Array.isArray(ctx?.machinePackage?.technologies)?ctx.machinePackage.technologies:[];if(q.stationId)xs=xs.filter(x=>x.stationId===q.stationId);if(q.process)xs=xs.filter(x=>x.process===q.process);if(q.manufacturer)xs=xs.filter(x=>String(x.manufacturer||"").toLowerCase().includes(String(q.manufacturer).toLowerCase()));if(q.material)xs=xs.filter(x=>materialCode(x.material)===materialCode(q.material));if(q.thicknessMm!=null)xs=xs.filter(x=>x.thicknessMm!=null&&Math.abs(Number(x.thicknessMm)-Number(q.thicknessMm))<.001);if(q.currentA!=null)xs=xs.filter(x=>x.currentA!=null&&Math.abs(Number(x.currentA)-Number(q.currentA))<.001);return xs}
function templateCandidates(ctx,q={}){let xs=Array.isArray(ctx?.templateLibrary?.templates)?ctx.templateLibrary.templates:[];if(q.material)xs=xs.filter(x=>x.material===materialCode(q.material));if(q.grade)xs=xs.filter(x=>String(x.grade||"").toLowerCase()===String(q.grade).toLowerCase());if(q.thicknessMm!=null)xs=xs.filter(x=>x.thicknessMm!=null&&Math.abs(Number(x.thicknessMm)-Number(q.thicknessMm))<.001);if(q.profile)xs=xs.filter(x=>String(x.profile||"").toLowerCase()===String(q.profile).toLowerCase());if(q.name){const n=String(q.name).toLowerCase();xs=xs.filter(x=>String(x.fileName||"").toLowerCase().includes(n)||String(x.path||"").toLowerCase().includes(n))}return xs}
function parse(prompt,ctx={}){
 const raw=String(prompt||"").trim(),s=lower(raw),actions=[],warnings=[],notes=[];
 const push=(...x)=>actions.push(action(...x));
 if(!raw)return{version:"cutai-ai-plan/0.7.9",source:"local",prompt:raw,summary:"Keine Eingabe",actions,warnings:["Bitte einen Arbeitsauftrag eingeben."],notes};

 // Sheet / material context
 let dm=dimMatch(s,"(?:tafel|blechgröße|blechmass|blechmaß|plattenmaß|plattengröße|arbeitsbereich)");
 if(dm&&dm.a>0&&dm.b>0)push("set_sheet",{widthMm:dm.a,heightMm:dm.b},`Tafel ${dm.a} × ${dm.b} mm setzen`,"project");
 let thickness=extractAngle(s,"(?:materialstärke|materialstaerke|dicke|stärke|staerke)");
 let mat=null;const known=["s235jr","s235","s355jr","s355","edelstahl","aluminium","alu","mst","sst"];
 for(const k of known)if(s.includes(k)){mat=k.toUpperCase().replace("ALU","Aluminium").replace("EDELSTAHL","Edelstahl");break}
 if(thickness==null&&mat){const tm=s.match(new RegExp(`(?:s235jr|s235|s355jr|s355|edelstahl|aluminium|alu|mst|sst)\\s*[-,:]?\\s*(${NUMBER})\\s*mm\\b`,"i"));if(tm)thickness=n(tm[1])}
 let mm=s.match(/material\s*[:=]?\s*([a-z0-9._+-]+)/i);if(mm&&!/^(?:und|aus|von|wie|dicke|stärke|staerke)$/i.test(mm[1]))mat=mm[1].toUpperCase();
 if(mat||thickness!=null)push("set_material",{name:mat,thicknessMm:thickness},`Material${mat?` ${mat}`:""}${thickness!=null?` · ${thickness} mm`:""} setzen`,"project");
 const tplFileMatch=raw.match(/schablone\s+["']?([^;\n"']+?\.(?:cfg|plb))\b/i),tplNameMatch=tplFileMatch||raw.match(/schablone\s+["']?([^.;\n"']{3,80})/i);if(ctx.templateLibrary){let tc=[];const currentProfile=String(ctx.machineProfile?.id||ctx.machineProfile?.name||ctx.fileReference?.profiles?.[0]||"");if(tplNameMatch)tc=templateCandidates(ctx,{name:tplNameMatch[1].trim()});else if(mat&&thickness!=null){const grade=(raw.match(/\b(S235JR|S235|S355JR|S355|1[.-]4301)\b/i)||[])[1]?.replace("-",".")||null;tc=templateCandidates(ctx,{material:materialCode(mat),grade,thicknessMm:thickness});if(!tc.length&&grade)tc=templateCandidates(ctx,{material:materialCode(mat),thicknessMm:thickness});if(currentProfile){const exact=tc.filter(x=>String(x.profile||"").toLowerCase()===currentProfile.toLowerCase());if(exact.length)tc=exact}}if(tc.length===1)push("set_template_reference",{id:tc[0].id},`ASPER-Schablone: ${tc[0].fileName}${tc[0].profile?` · ${tc[0].profile}`:""}`,"project");else if(tc.length>1)warnings.push(`Für die Material-/Dickenangabe passen ${tc.length} ASPER-Schablonen${currentProfile?` (Profil ${currentProfile} nicht eindeutig)`:""}. Bitte Profil oder Schablonenname genauer nennen: ${tc.slice(0,5).map(x=>`${x.fileName}${x.profile?` [${x.profile}]`:""}`).join(" | ")}`)}

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
 let model=null;const mo=raw.match(/\b(XPR\s*\d+|SmartFL|HiFocus\s*\d+|HiFocus|FineFocus\s*\d+|CutFire\s*\w+)\b/i);if(mo)model=mo[1].replace(/\s+/g," ");
 const stationMatch=(ctx.stations||[]).find(st=>(!proc||st.process===proc)&&(!manufacturer||String(st.manufacturer).toLowerCase().includes(manufacturer.toLowerCase()))&&(!model||String(st.model||"").toLowerCase().includes(String(model).toLowerCase()))&&(!mode||st.mode===mode));
 if(proc||manufacturer||mode){if(ctx.machinePackage&&!stationMatch)warnings.push(`Die geladene Maschine besitzt keine passende aktive Station für ${[proc,manufacturer,model,mode].filter(Boolean).join(" / ")}. CutAI legt deshalb keine erfundene Station an.`);else push("assign_station",{process:proc,manufacturer,mode,model,stationId:stationMatch?.id||null},`Station zuweisen: ${stationMatch?.label||[proc,manufacturer,mode,model].filter(Boolean).join(" · ")}`,createsGeometry?"created_all_or_selection":"selection_or_created")}
 // Exact machine technology reference, only when the loaded package supports it.
 const currentMatch=s.match(new RegExp(`(${NUMBER})\\s*a(?:mpere)?\\b`,"i")),currentA=currentMatch?n(currentMatch[1]):null,techMaterial=materialCode(mat||ctx.project?.material?.name||""),techThickness=thickness??ctx.project?.material?.thicknessMm??null;
 if(ctx.machinePackage&&(proc||manufacturer||currentA!=null||mat||thickness!=null)){
   const q={stationId:stationMatch?.id||null,process:proc||stationMatch?.process||null,manufacturer:manufacturer||stationMatch?.manufacturer||null,material:techMaterial||null,thicknessMm:techThickness,currentA};const tc=technologyCandidates(ctx,q);
   if(tc.length===1){const t=tc[0];push("set_technology_reference",{id:t.id,stationId:t.stationId},`Maschinentechnologie: ${t.fileName||t.id}`,"project")}
   else if(tc.length>1){warnings.push(`Für ${techMaterial||"das Material"} ${techThickness!=null?techThickness+" mm":""} passen ${tc.length} Maschinen-Technologien. Bitte Strom/Quelle genauer angeben: ${tc.slice(0,4).map(x=>x.currentA!=null?x.currentA+" A · "+(x.fileName||x.id):(x.fileName||x.id)).join(" | ")}`)}
   else if((mat||thickness!=null||currentA!=null)&&(ctx.machinePackage.technologies||[]).length)warnings.push("Für die genannten Material-/Stromdaten wurde im geladenen Maschinenpaket keine exakte Technologiedatei gefunden. Es wird keine Technologie erfunden.")
 }

 // Tool intent: semantic roles first. Concrete T-codes are resolved against the active machine/template context.
 let tool=null;
 if(/quality\s*hole|true\s*hole|tht|contour\s*cut|contourcut/.test(s))tool={semanticRole:"quality"};
 else if(/plasma.?körn|koern|körnen/.test(s))tool={semanticRole:"punch"};
 else if(/markieren|markierung/.test(s))tool={semanticRole:"mark"};
 else if(/bohrwerkzeug|mit bohrer|bohren/.test(s))tool={semanticRole:"drill"};
 else if(/autogen|oxy/.test(s))tool={semanticRole:"oxyfuel"};
 else if(/fase\s*(?:oben|positiv)|schrägschneiden\s*oben|schraegschneiden\s*oben/.test(s))tool={semanticRole:"bevel_top"};
 else if(/fase\s*(?:unten|negativ)|schrägschneiden\s*unten|schraegschneiden\s*unten/.test(s))tool={semanticRole:"bevel_bottom"};
 else if(/senkrecht|gerades schneiden|gerade schneiden/.test(s))tool={semanticRole:"cut"};
 if(tool){const toolTarget=/außenkontur|aussenkontur|außenkante|aussenkante/.test(s)?"outer_or_selection":/innenkontur|löcher|loecher|bohrungen/.test(s)?"inside_or_selection":createsGeometry&&/fase|schräg/.test(s)?"outer_or_selection":createsGeometry?"created_all_or_selection":"selection_or_created";push("assign_tool",tool,`Werkzeugrolle ${tool.semanticRole} zuweisen`,toolTarget);}

 // Bevel
 let bt=null;if(/k[- ]?fase|\bk\s*30|fasentyp\s*k/.test(s))bt="K";else if(/x[- ]?fase|fasentyp\s*x/.test(s))bt="X";else if(/y[- ]?fase[^.;\n]*(unten|negativ)|y unten/.test(s))bt="Y_BOTTOM";else if(/y[- ]?fase|y oben/.test(s))bt="Y_TOP";else if(/v[- ]?fase[^.;\n]*(unten|negativ)|v unten/.test(s))bt="V_BOTTOM";else if(/v[- ]?fase|v oben|fase oben|fase positiv/.test(s))bt="V_TOP";else if(/fase unten|fase negativ/.test(s))bt="V_BOTTOM";
 if(!bt&&/\bfase\b|fasenschnitt|schrägschnitt|schraegschnitt/.test(s)&&!/fase\s+(?:aus|entfernen|löschen)|ohne fase/.test(s))warnings.push("Fase erkannt, aber der Fasentyp ist nicht eindeutig. Bitte V-oben, V-unten, Y-oben, Y-unten, X oder K angeben. CutAI rät den Typ nicht.");
 if(bt){let a1=extractAngle(s,"(?:alfa1|alpha1|winkel|fase|oben)")??30,a2=extractAngle(s,"(?:alfa2|alpha2|unten)")??a1;const slash=s.match(new RegExp(`(${NUMBER})\\s*(?:°|grad)?\\s*[/\\-]\\s*(${NUMBER})\\s*(?:°|grad)?`));if(slash){a1=n(slash[1]);a2=n(slash[2])}const tp=extractAngle(s,"\\btp")??0,tn=extractAngle(s,"\\btn")??0;push("set_bevel",{profileType:bt,alpha1Deg:a1,alpha2Deg:a2,topHeightMm:tp,landMm:tn,variable:/variabel/.test(s),constantSlope:/gleichbleibende schräge|gleichbleibend/.test(s)},`${bt}-Fase · α1 ${a1}° · α2 ${a2}° · TP ${tp} · TN ${tn}`,createsGeometry?"outer_or_selection":"selection_or_created")}
 if(/fase\s+(?:aus|entfernen|löschen)|ohne fase/.test(s))push("set_bevel",{enabled:false},"Fase entfernen",createsGeometry?"outer_or_selection":"selection_or_created");

 // Leads
 let lead=s.match(new RegExp(`anlauf[^.;\\n]{0,70}?(${NUMBER})\\s*mm([^.;\\n]*)`,`i`));if(lead){const tail=lead[2]||"",ang=extractAngle(tail,"(?:winkel|mit|unter)")??0;push("set_lead_in",{type:/bogen|arc/.test(tail)?"arc":"line",lengthMm:n(lead[1]),angleDeg:ang,radiusMm:extractAngle(tail,"radius")??0},`Anlauf ${n(lead[1])} mm`,bt&&createsGeometry?"outer_or_selection":"selection_or_created")}
 lead=s.match(new RegExp(`auslauf[^.;\\n]{0,70}?(${NUMBER})\\s*mm([^.;\\n]*)`,`i`));if(lead){const tail=lead[2]||"",ang=extractAngle(tail,"(?:winkel|mit|unter)")??0;push("set_lead_out",{type:/bogen|arc/.test(tail)?"arc":"line",lengthMm:n(lead[1]),angleDeg:ang,radiusMm:extractAngle(tail,"radius")??0},`Auslauf ${n(lead[1])} mm`,bt&&createsGeometry?"outer_or_selection":"selection_or_created")}
 if(/anlauf\s+(?:aus|entfernen|löschen)/.test(s))push("set_lead_in",{type:"none",lengthMm:0},"Anlauf entfernen","selection_or_created");
 if(/auslauf\s+(?:aus|entfernen|löschen)/.test(s))push("set_lead_out",{type:"none",lengthMm:0},"Auslauf entfernen","selection_or_created");

 // Loaded CNC/PLA reference
 if(ctx.fileReference){
   if(/(?:material|dicke|tafel|werkstoff)[^.;\n]{0,40}(?:aus|von|wie)[^.;\n]{0,25}(?:referenz|cnc|pla)|referenzdaten[^.;\n]{0,25}(?:übernehmen|uebernehmen)/.test(s))push("apply_reference_metadata",{},"Material-/Tafeldaten aus Referenz übernehmen","project");
   if(ctx.fileReference.kind==="cnc"&&/(?:importier|übernimm|uebernimm)[^.;\n]{0,50}(?:cnc[- ]?)?referenz(?:geometrie|kontur)|(?:cnc|referenz)[^.;\n]{0,35}(?:geometrie|kontur)[^.;\n]{0,25}(?:übernehmen|uebernehmen|importieren)|(?:wie|aus)\s+(?:der\s+)?(?:cnc-)?referenz[^.;\n]{0,30}(?:erstellen|übernehmen|uebernehmen)/.test(s))push("import_reference_geometry",{},"CNC-Referenzgeometrie übernehmen","project");
   if(/(?:mit|gegen)[^.;\n]{0,20}(?:referenz|cnc|pla)[^.;\n]{0,25}(?:vergleichen|prüfen|pruefen)|referenz[^.;\n]{0,20}vergleich/.test(s))push("compare_reference",{},"Projekt mit Referenz vergleichen","project");
 }

 // Workflow
 if(/schneidfolge[^.;\n]{0,20}automatisch|automatische schneidfolge|automatisch ordnen/.test(s))push("auto_order",{},"Schneidfolge automatisch berechnen","project");
 if(/cam\s*prüfen|cam\s*pruefen|projekt\s*prüfen|projekt\s*pruefen|validier/.test(s))push("validate",{},"CAM prüfen","project");
 if(/alles anzeigen|einpassen|fit all/.test(s))push("fit_view",{},"Alles anzeigen","project");
 let vm=null;if(/ansicht[^.;\n]*werkzeug/.test(s))vm="tool";else if(/ansicht[^.;\n]*fase/.test(s))vm="bevel";else if(/ansicht[^.;\n]*schneidfolge/.test(s))vm="order";else if(/ansicht[^.;\n]*normal/.test(s))vm="normal";if(vm)push("set_view",{mode:vm},`Ansicht ${vm}`,"project");

 if(!actions.length)warnings.push("Der lokale Planer hat noch keine eindeutig ausführbare CAD/CAM-Aktion erkannt. Formuliere Maße und Aktion konkreter oder nutze später den Online-KI-Endpunkt.");
 const summary=actions.length?`${actions.length} Aktion${actions.length===1?"":"en"} erkannt`:"Keine sichere Aktion erkannt";
 return{version:"cutai-ai-plan/0.7.9",source:"local",prompt:raw,summary,actions,warnings,notes,contextHint:{selectionCount:ctx.selectionCount||0,contourCount:ctx.contourCount||0}};
}
function sanitizePlan(plan){
 const p=plan&&typeof plan==="object"?JSON.parse(JSON.stringify(plan)):{actions:[]};p.version="cutai-ai-plan/0.7.9";p.source=String(p.source||"remote");p.prompt=String(p.prompt||"");p.summary=String(p.summary||"");p.actions=Array.isArray(p.actions)?p.actions.filter(a=>a&&ALLOWED.has(a.type)).slice(0,100).map(a=>({type:a.type,params:a.params&&typeof a.params==="object"?a.params:{},label:String(a.label||a.type),target:String(a.target||"selection_or_created")})):[];p.warnings=Array.isArray(p.warnings)?p.warnings.map(String).slice(0,30):[];p.notes=Array.isArray(p.notes)?p.notes.map(String).slice(0,30):[];return p
}
function actionText(a){return a?.label||a?.type||"Aktion"}
window.CutAIAI={version:"0.7.9",parse,sanitizePlan,actionText,allowed:[...ALLOWED]};
})();
