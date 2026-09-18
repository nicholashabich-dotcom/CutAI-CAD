(()=>{
"use strict";
const C=window.CutAICore,R=window.CutAIAsperReference||{},NS="http://www.w3.org/2000/svg",$=id=>document.getElementById(id);
const svg=$("cad"),geometry=$("geometry"),bevelLayer=$("bevelLayer"),dimensions=$("dimensions"),camMarkers=$("camMarkers"),simLayer=$("simLayer"),preview=$("preview"),snapLayer=$("snapLayer"),statusEl=$("status"),coordsEl=$("coords"),properties=$("properties"),geometryFields=$("geometryFields"),propTitle=$("propTitle"),edgeInfo=$("edgeInfo"),contourList=$("contourList"),projectSummary=$("projectSummary"),toolLegend=$("toolLegend");
const uid=()=>"c_"+Math.random().toString(36).slice(2,10),num=v=>Number.parseFloat(v)||0,fmt=v=>(Math.round(v*1000)/1000).toString(),deep=v=>JSON.parse(JSON.stringify(v));
function inferRole(t){
 const n=String(t?.name||"").toLowerCase();
 if(t?.role)return t.role;
 if(n.includes("mark"))return"mark";
 if(n.includes("körn")||t?.canPunch)return"punch";
 if(n.includes("bohr")||/15$/.test(String(t?.code||"")))return"drill";
 if(String(t?.code||"")==="NONE")return"none";
 return"cut";
}
function normalizeTool(t){
 const x={...(t||{})};x.code=String(x.code||"T111");x.name=String(x.name||x.code);x.role=inferRole(x);
 x.rotationType=Number(x.rotationType??x.rotType??0);x.canVariableBevel=Boolean(x.canVariableBevel??x.canVarBev??false);
 x.supportsTHT=Boolean(x.supportsTHT);x.canPunch=Boolean(x.canPunch);x.headCount=Number(x.headCount||1);
 x.bevelCapable=Boolean(x.bevelCapable||x.rotationType===5||/fase|schräg/i.test(x.name));
 return x;
}
const NONE_TOOL=normalizeTool({code:"NONE",name:"Keine Bearbeitung",role:"none"});
const GENERIC_TOOLS=[
 normalizeTool({code:"T%d15",name:"Bohren",role:"drill"}),
 normalizeTool({code:"T18",name:"Markieren",role:"mark"})
];
function normalizeProfile(p){
 p=deep(p||{});p.id=String(p.id||p.name||"profile");p.name=String(p.name||p.id);
 p.tools=(p.tools||[]).map(normalizeTool);p.layerGroups=Array.isArray(p.layerGroups)?p.layerGroups:[];
 p.typeOfNCCode=Number(p.typeOfNCCode??2);return p;
}
const BUILTIN_PROFILE=normalizeProfile(R.defaultProfile||{id:"ASPER-Referenzprofil",name:"ASPER-Referenzprofil",tools:[
 {code:"T111",name:"Gerades / senkrechtes Schneiden",role:"cut"},{code:"T211",name:"Fase positiv / oben",role:"cut",rotationType:5},
 {code:"T311",name:"Fase negativ / unten",role:"cut",rotationType:5},{code:"T411",name:"Plasma markieren",role:"mark"},
 {code:"T511",name:"Plasma körnen",role:"punch",canPunch:true},{code:"T611",name:"Quality Hole",role:"cut",supportsTHT:true},
 {code:"T12",name:"Autogen",role:"cut"}]});
function profileSnapshot(p){
 const q=normalizeProfile(p||BUILTIN_PROFILE);
 return{id:q.id,name:q.name,typeOfNCCode:q.typeOfNCCode,tools:deep(q.tools),layerGroups:deep(q.layerGroups||[]),
  bevelAngleLimitDeg:50,additionalBevelMode:Number(R.asperDefaults?.additionalBevelMode??1),
  sheetShapeInCnc:Number(R.asperDefaults?.sheetShapeInCnc??2),postprocessorTarget:"neutral",dxfLayerGroup:"",configSource:"built-in"};
}
function newProject(){
 return{schema:"cutai-cad/0.7.2",units:"mm",name:"CutAI Projekt",machineProfile:profileSnapshot(BUILTIN_PROFILE),
  material:{name:"S235JR",thicknessMm:10},contours:[]};
}
const state={
 project:newProject(),configProfiles:[BUILTIN_PROFILE],history:[],redo:[],selectedIds:[],tool:"select",multi:false,snapEnabled:true,
 viewBox:{x:0,y:0,w:1200,h:800},pointers:new Map(),pan:null,pinch:null,drag:null,drawing:null,arcStage:null,startPointMode:false,simulation:false,viewMode:"tool"
};
const contours=()=>state.project.contours,find=id=>contours().find(c=>c.id===id),selected=()=>state.selectedIds.map(find).filter(Boolean);
function status(v){statusEl.textContent=v}
function machineTools(){const xs=(state.project.machineProfile?.tools||[]).map(normalizeTool);const map=new Map(xs.map(t=>[t.code,t]));for(const t of GENERIC_TOOLS)if(!map.has(t.code))map.set(t.code,t);map.set("NONE",NONE_TOOL);return[...map.values()]}
function toolByCode(code){const all=machineTools();return all.find(t=>t.code===code)||normalizeTool({code:code||"T111",name:code||"T111",role:"cut"})}
function toolSnapshot(t){t=normalizeTool(t);return deep(t)}
function defaultBevel(){return{enabled:false,profileType:"V",location:"top",landMm:0,azimuthDeg:0,variable:false,faces:[{enabled:true,surface:"top",angleDeg:30,heightMm:0},{enabled:false,surface:"middle",angleDeg:0,heightMm:0},{enabled:false,surface:"bottom",angleDeg:-30,heightMm:0},{enabled:false,surface:"custom",angleDeg:0,heightMm:0}]}}
function defaultCam(order=1){const t=toolByCode("T111");return{tool:toolSnapshot(t),contourType:"auto",direction:"cw",order,kerfMm:0,kerfComp:"auto",leadIn:{type:"line",lengthMm:5},leadOut:{type:"none",lengthMm:0},startPoint:null,bevel:defaultBevel(),sourceRule:null}}
function normalizeContour(c,i=0){
 c=deep(c);if(!c.id)c.id=uid();if(!c.name)c.name=`Kontur ${i+1}`;if(typeof c.closed!=="boolean")c.closed=c.geometry?.kind==="circle";if(!c.sourceLayer)c.sourceLayer="CUTAI";if(!c.cam)c.cam=defaultCam(i+1);
 c.chainId=String(c.chainId||c.id);c.chainName=String(c.chainName||c.name);c.chainClosed=typeof c.chainClosed==="boolean"?c.chainClosed:!!c.closed;c.sectionIndex=Math.max(1,Number(c.sectionIndex)||1);
 const t=toolByCode(c.cam.tool?.code||"T111");c.cam.tool={...toolSnapshot(t),...(c.cam.tool||{}),code:t.code,name:(c.cam.tool?.name||t.name),role:(c.cam.tool?.role||t.role)};
 c.cam.order=Number(c.cam.order)||i+1;c.cam.contourType=c.cam.contourType||"auto";c.cam.direction=c.cam.direction||"cw";
 c.cam.kerfMm=Math.max(0,Number(c.cam.kerfMm)||0);c.cam.kerfComp=c.cam.kerfComp||"auto";
 c.cam.leadIn=c.cam.leadIn||{type:"none",lengthMm:0};c.cam.leadOut=c.cam.leadOut||{type:"none",lengthMm:0};c.cam.bevel={...defaultBevel(),...(c.cam.bevel||{})};
 if(!Array.isArray(c.cam.bevel.faces))c.cam.bevel.faces=defaultBevel().faces;c.cam.bevel.faces=[0,1,2,3].map(k=>({...defaultBevel().faces[k],...(c.cam.bevel.faces[k]||{})}));return c;
}
function projectSnapshot(){return JSON.stringify(state.project)}
function snapshot(){state.history.push(projectSnapshot());if(state.history.length>100)state.history.shift();state.redo=[]}
function restoreProject(obj){state.project=normalizeProject(obj);state.selectedIds=[];hideProperties();fillToolSelect();render();fitAll()}
function undo(){if(!state.history.length)return status("Nichts zum Rückgängigmachen");state.redo.push(projectSnapshot());state.project=normalizeProject(JSON.parse(state.history.pop()));state.selectedIds=[];hideProperties();fillToolSelect();render();status("Rückgängig")}
function redo(){if(!state.redo.length)return status("Nichts zum Wiederholen");state.history.push(projectSnapshot());state.project=normalizeProject(JSON.parse(state.redo.pop()));state.selectedIds=[];hideProperties();fillToolSelect();render();status("Wiederholt")}
function normalizeProject(p){
 if((p?.schema==="cutai-cad/0.7"||p?.schema==="cutai-cad/0.7.1"||p?.schema==="cutai-cad/0.7.2")&&Array.isArray(p.contours)){
  p=deep(p);const def=profileSnapshot(BUILTIN_PROFILE);p.schema="cutai-cad/0.7.2";p.machineProfile={...def,...(p.machineProfile||{})};
  p.machineProfile.tools=(p.machineProfile.tools?.length?p.machineProfile.tools:def.tools).map(normalizeTool);p.machineProfile.layerGroups=Array.isArray(p.machineProfile.layerGroups)?p.machineProfile.layerGroups:[];
  p.material={name:"S235JR",thicknessMm:10,...(p.material||{})};p.contours=p.contours.map(normalizeContour);return p
 }
 if(Array.isArray(p?.shapes))return migrateV06(p);
 throw new Error("Nicht unterstütztes Projektformat");
}
function migrateV06(p){
 const out=newProject();out.name="Migriertes v0.6 Projekt";
 p.shapes.forEach((s,i)=>{let geometry,closed=false;if(s.type==="circle"){geometry={kind:"circle",cx:s.cx,cy:s.cy,r:s.r};closed=true}else if(s.type==="rect"){geometry={kind:"segments",segments:rectSegments(s.x,s.y,s.w,s.h)};closed=true}else if(s.type==="line")geometry={kind:"segments",segments:[{type:"line",x1:s.x1,y1:s.y1,x2:s.x2,y2:s.y2}]};else return;
 const cam=defaultCam(i+1);const map={Autogen:"T12",Markieren:"T411",Bohren:"T%d15",Plasma:"T111",Laser:"T111",Keine:"NONE"};const t=toolByCode(map[s.cam?.technology]||"T111");cam.tool=toolSnapshot(t);cam.contourType=s.cam?.contourType||"auto";cam.direction=s.cam?.direction||"cw";cam.order=s.cam?.order||i+1;cam.startPoint=s.cam?.startPoint||null;cam.leadIn={type:s.cam?.leadIn?"line":"none",lengthMm:Number(s.cam?.leadIn)||0};cam.leadOut={type:s.cam?.leadOut?"line":"none",lengthMm:Number(s.cam?.leadOut)||0};if(s.cam?.bevel?.enabled){cam.bevel.enabled=true;cam.bevel.profileType=s.cam.bevel.type||"V";cam.bevel.landMm=Number(s.cam.bevel.land)||0;cam.bevel.faces[0].enabled=true;cam.bevel.faces[0].angleDeg=C.clamp(Number(s.cam.bevel.angle)||0,-50,50)}
 out.contours.push(normalizeContour({id:s.id||uid(),name:`Kontur ${i+1}`,geometry,closed,sourceLayer:s.sourceLayer||"CUTAI",cam},i))});return out;
}
function rectSegments(x,y,w,h){return[{type:"line",x1:x,y1:y,x2:x+w,y2:y},{type:"line",x1:x+w,y1:y,x2:x+w,y2:y+h},{type:"line",x1:x+w,y1:y+h,x2:x,y2:y+h},{type:"line",x1:x,y1:y+h,x2:x,y2:y}]}
function addContour(c){c=normalizeContour({...c,id:c.id||uid(),name:c.name||`Kontur ${contours().length+1}`,cam:c.cam||defaultCam(contours().length+1)},contours().length);contours().push(c);return c}
function setTool(t){state.tool=t;state.drawing=null;state.arcStage=null;state.startPointMode=false;preview.replaceChildren();document.querySelectorAll(".tool").forEach(b=>b.classList.toggle("active",b.dataset.tool===t));status(t==="arc"?"Bogen: Mittelpunkt antippen":t==="split"?"Abschnitt trennen: ersten Trennpunkt auf der Kontur antippen":`${document.querySelector(`[data-tool="${t}"] small`)?.textContent||t}`)}
function svgPoint(clientX,clientY){const r=svg.getBoundingClientRect();return{x:state.viewBox.x+(clientX-r.left)/r.width*state.viewBox.w,y:state.viewBox.y+(clientY-r.top)/r.height*state.viewBox.h}}
function snapPoint(p,show=true){if(!state.snapEnabled)return p;const grid=10;let best={x:Math.round(p.x/grid)*grid,y:Math.round(p.y/grid)*grid},bd=C.dist(p,best);for(const c of contours()){const pts=[];if(c.geometry.kind==="circle"){pts.push({x:c.geometry.cx,y:c.geometry.cy},{x:c.geometry.cx+c.geometry.r,y:c.geometry.cy},{x:c.geometry.cx-c.geometry.r,y:c.geometry.cy},{x:c.geometry.cx,y:c.geometry.cy+c.geometry.r},{x:c.geometry.cx,y:c.geometry.cy-c.geometry.r})}else for(const s of c.geometry.segments||[])pts.push(C.segStart(s),C.segEnd(s));for(const q of pts){const d=C.dist(p,q);if(d<bd&&d<Math.max(5,state.viewBox.w/150)){best=q;bd=d}}}if(show){snapLayer.replaceChildren();const m=document.createElementNS(NS,"circle");m.setAttribute("cx",best.x);m.setAttribute("cy",best.y);m.setAttribute("r",Math.max(4,state.viewBox.w/250));m.setAttribute("class","snap-marker");snapLayer.appendChild(m)}return best}
function setViewBox(){svg.setAttribute("viewBox",`${state.viewBox.x} ${state.viewBox.y} ${state.viewBox.w} ${state.viewBox.h}`)}
function arcPath(s){const sweep=C.arcSweep(s),large=sweep>Math.PI?1:0,sweepFlag=s.cw?1:0;return`M ${s.sx} ${s.sy} A ${s.r} ${s.r} 0 ${large} ${sweepFlag} ${s.ex} ${s.ey}`}
const TOOL_COLORS={"T111":"#3b82f6","T211":"#f97316","T311":"#ef4444","T411":"#22c55e","T511":"#eab308","T611":"#06b6d4","T12":"#a855f7","T18":"#10b981","T%d15":"#d97706","NONE":"#64748b"};
const TOOL_PALETTE=["#3b82f6","#f97316","#22c55e","#eab308","#a855f7","#06b6d4","#ec4899","#84cc16","#14b8a6","#f43f5e","#8b5cf6","#0ea5e9"];
function toolColor(code){if(TOOL_COLORS[code])return TOOL_COLORS[code];const tools=machineTools(),i=Math.max(0,tools.findIndex(t=>t.code===code));return TOOL_PALETTE[i%TOOL_PALETTE.length]}
function bevelColor(c){const loc=c.cam?.bevel?.location||"top";if(loc==="bottom")return"#f43f5e";if(loc==="both"||c.cam?.bevel?.profileType==="K")return"#f59e0b";return"#22d3ee"}
function contourStroke(c){if(state.viewMode==="tool")return toolColor(c.cam?.tool?.code||"NONE");if(state.viewMode==="bevel")return c.cam?.bevel?.enabled?bevelColor(c):"#64748b";if(c.cam?.tool?.role==="mark")return"#22c55e";return c.cam?.bevel?.enabled?"#fb7185":"#e5e7eb"}
function contourPathD(c){if(c.geometry.kind==="circle")return null;let d="";const segs=c.geometry.segments||[];if(segs.length){const p=C.segStart(segs[0]);d=`M ${p.x} ${p.y}`;for(const s of segs)d+=s.type==="line"?` L ${s.x2} ${s.y2}`:` A ${s.r} ${s.r} 0 ${C.arcSweep(s)>Math.PI?1:0} ${s.cw?1:0} ${s.ex} ${s.ey}`;if(c.closed)d+=" Z"}return d}
function contourEl(c){let el;if(c.geometry.kind==="circle"){el=document.createElementNS(NS,"circle");el.setAttribute("cx",c.geometry.cx);el.setAttribute("cy",c.geometry.cy);el.setAttribute("r",c.geometry.r)}else{el=document.createElementNS(NS,"path");el.setAttribute("d",contourPathD(c)||"")}el.setAttribute("class",`shape ${c.closed||c.chainClosed?"":"open"} ${c.cam?.tool?.role==="mark"?"mark":""} ${state.selectedIds.includes(c.id)?"selected":""}`);el.style.setProperty("--shape-stroke",contourStroke(c));el.dataset.id=c.id;return el}
function representativePoint(c){if(c.geometry.kind==="circle")return{x:c.geometry.cx+c.geometry.r,y:c.geometry.cy};const segs=c.geometry.segments||[];if(!segs.length)return C.contourCentroid(c);const s=segs[Math.floor(segs.length/2)];if(s.type==="line")return{x:(s.x1+s.x2)/2,y:(s.y1+s.y2)/2};return C.arcPoint(s,.5)}
function segmentDirectionAtEnd(s,atStart=true){if(s.type==="line"){const dx=s.x2-s.x1,dy=s.y2-s.y1,l=Math.hypot(dx,dy)||1;return{x:dx/l,y:dy/l}}const p=atStart?C.segStart(s):C.segEnd(s),rx=p.x-s.cx,ry=p.y-s.cy,l=Math.hypot(rx,ry)||1;const sign=s.cw?1:-1;return{x:-ry/l*sign,y:rx/l*sign}}
function drawBreakTick(p,dir,color){const len=Math.max(8,state.viewBox.w/180),nx=-dir.y,ny=dir.x,l=document.createElementNS(NS,"line");l.setAttribute("x1",p.x-nx*len/2);l.setAttribute("y1",p.y-ny*len/2);l.setAttribute("x2",p.x+nx*len/2);l.setAttribute("y2",p.y+ny*len/2);l.setAttribute("class","bevel-tick");l.style.setProperty("--bevel-stroke",color);bevelLayer.appendChild(l)}
function bevelText(c){const b=c.cam?.bevel;if(!b?.enabled)return"";const active=(b.faces||[]).filter(f=>f.enabled&&Math.abs(Number(f.angleDeg)||0)>.0001),angles=active.map(f=>`${fmt(Math.abs(f.angleDeg))}°`);const arrow=b.location==="bottom"?"↓":b.location==="both"?"↕":"↑";let s=`${b.profileType}${arrow}`;if(angles.length)s+=` ${angles.join("/")}`;if(b.profileType==="Y"&&Number(b.landMm)>0)s+=` · Steg ${fmt(b.landMm)}`;return s}
function renderBevel(c){if(!c.cam?.bevel?.enabled)return;const color=bevelColor(c),cls=`bevel-highlight ${(c.cam.bevel.profileType||"V").toLowerCase()}`;let el;if(c.geometry.kind==="circle"){el=document.createElementNS(NS,"circle");el.setAttribute("cx",c.geometry.cx);el.setAttribute("cy",c.geometry.cy);el.setAttribute("r",c.geometry.r)}else{el=document.createElementNS(NS,"path");el.setAttribute("d",contourPathD(c)||"")}el.setAttribute("class",cls);el.style.setProperty("--bevel-stroke",color);bevelLayer.appendChild(el);
 const segs=c.geometry.kind==="circle"?C.circleToSegments(c.geometry):(c.geometry.segments||[]);if(segs.length){drawBreakTick(C.segStart(segs[0]),segmentDirectionAtEnd(segs[0],true),color);drawBreakTick(C.segEnd(segs.at(-1)),segmentDirectionAtEnd(segs.at(-1),false),color)}
 const p=representativePoint(c),t=document.createElementNS(NS,"text");t.setAttribute("x",p.x+Math.max(7,state.viewBox.w/210));t.setAttribute("y",p.y-Math.max(7,state.viewBox.w/210));t.setAttribute("class","bevel-label");t.textContent=bevelText(c);bevelLayer.appendChild(t)
}
function chainMembers(c){return contours().filter(x=>x.chainId===c.chainId)}
function chainMeta(c){const ms=chainMembers(c).sort((a,b)=>(a.sectionIndex||1)-(b.sectionIndex||1)),idx=Math.max(0,ms.findIndex(x=>x.id===c.id));return{count:ms.length,index:idx+1}}
function renderDimensions(c){const b=C.contourBounds(c),w=b.maxX-b.minX,h=b.maxY-b.minY;const t=document.createElementNS(NS,"text");t.setAttribute("x",(b.minX+b.maxX)/2);t.setAttribute("y",b.maxY+Math.max(18,state.viewBox.w/80));t.setAttribute("text-anchor","middle");t.setAttribute("class","dim-text");t.textContent=c.geometry.kind==="circle"?`Ø ${fmt(c.geometry.r*2)} mm`:`${fmt(w)} × ${fmt(h)} mm`;dimensions.appendChild(t)}
function renderMarkers(c){if(c.chainClosed&&!c.closed){const segs=c.geometry.kind==="segments"?c.geometry.segments:[];if(segs.length){const r=Math.max(3,state.viewBox.w/330);for(const p of [C.segStart(segs[0]),C.segEnd(segs.at(-1))]){const m=document.createElementNS(NS,"rect");m.setAttribute("x",p.x-r);m.setAttribute("y",p.y-r);m.setAttribute("width",r*2);m.setAttribute("height",r*2);m.setAttribute("class","section-break");camMarkers.appendChild(m)}}}if(c.cam?.startPoint){const p=c.cam.startPoint,m=document.createElementNS(NS,"circle");m.setAttribute("cx",p.x);m.setAttribute("cy",p.y);m.setAttribute("r",Math.max(4,state.viewBox.w/260));m.setAttribute("class","start-marker");camMarkers.appendChild(m);const txt=document.createElementNS(NS,"text");txt.setAttribute("x",p.x+Math.max(8,state.viewBox.w/170));txt.setAttribute("y",p.y-Math.max(8,state.viewBox.w/170));txt.setAttribute("class","direction-label");txt.textContent=c.cam.direction==="cw"?"↻":"↺";camMarkers.appendChild(txt)}}
function resolvedType(c){if(c.cam.contourType!=="auto")return c.cam.contourType;const r=C.autoClassify(contours()).find(x=>x.id===c.id);return r?.type||"none"}
function renderLegend(){if(!toolLegend)return;const used=[...new Set(contours().map(c=>c.cam?.tool?.code).filter(Boolean))];const codes=used.length?used:machineTools().slice(0,7).map(t=>t.code);toolLegend.innerHTML=codes.map(code=>{const t=toolByCode(code);return`<span class="tool-chip"><span class="tool-swatch" style="background:${toolColor(code)}"></span>${escapeHtml(code)} · ${escapeHtml(t.name)}</span>`}).join("")}
function renderList(){contourList.replaceChildren();const ordered=[...contours()].sort((a,b)=>(a.cam.order||0)-(b.cam.order||0));for(const c of ordered){const d=document.createElement("div");d.className=`contour-item ${state.selectedIds.includes(c.id)?"selected":""}`;const bevel=c.cam.bevel?.enabled?` · ${bevelText(c)}`:"",cm=chainMeta(c),section=cm.count>1||c.chainClosed&&!c.closed?`<div class="contour-meta section-meta">Kette · Abschnitt ${cm.index}/${cm.count}</div>`:"";d.innerHTML=`<div class="contour-title-row"><span class="tool-swatch" style="background:${toolColor(c.cam.tool.code)}"></span><strong>${escapeHtml(c.name)}</strong></div><div class="contour-meta">#${c.cam.order} · ${escapeHtml(c.cam.tool.code)} · ${resolvedType(c)}${bevel}</div>${section}<div class="contour-meta ${c.closed||c.chainClosed?"":"contour-bad"}">${c.closed?"geschlossen":c.chainClosed?"Abschnitt einer geschlossenen Kette":"offen"} · Layer ${escapeHtml(c.sourceLayer||"CUTAI")}</div>`;d.onclick=()=>{if(state.multi){toggleSelection(c.id)}else{state.selectedIds=[c.id];render();showProperties()}};contourList.appendChild(d)}
 projectSummary.textContent=`${state.project.name} · ${state.project.material.name} ${fmt(state.project.material.thicknessMm)} mm · ${state.project.machineProfile.name}`;renderLegend();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function render(){geometry.replaceChildren();bevelLayer.replaceChildren();dimensions.replaceChildren();camMarkers.replaceChildren();simLayer.replaceChildren();for(const c of contours()){geometry.appendChild(contourEl(c));renderBevel(c);if(state.selectedIds.includes(c.id))renderDimensions(c);renderMarkers(c)}if(state.simulation)renderSimulation();renderList();setViewBox()}
function hideProperties(){properties.classList.add("hidden")}
function fillToolSelect(){const el=$("toolCode");if(!el)return;const old=el.value;el.innerHTML=machineTools().map(t=>`<option value="${escapeHtml(t.code)}">${escapeHtml(t.code)} · ${escapeHtml(t.name)}</option>`).join("");if([...el.options].some(o=>o.value===old))el.value=old}
function setFaceRows(bevel){const fg=$("faceGrid");fg.replaceChildren();for(let i=0;i<4;i++){const f=bevel.faces[i];const row=document.createElement("div");row.className="face-row";row.innerHTML=`<label title="Fläche aktiv"><input class="face-enabled" data-i="${i}" type="checkbox" ${f.enabled?"checked":""}></label><div class="field"><label>Fläche</label><select class="face-surface" data-i="${i}"><option value="top">Oben</option><option value="middle">Mitte</option><option value="bottom">Unten</option><option value="custom">Frei</option></select></div><div class="field"><label>Winkel (°)</label><input class="face-angle" data-i="${i}" type="number" min="-50" max="50" step="0.1" value="${f.angleDeg}"></div><div class="field height-field"><label>Höhe/Abschnitt (mm)</label><input class="face-height" data-i="${i}" type="number" min="0" step="0.1" value="${f.heightMm}"></div>`;fg.appendChild(row);row.querySelector(".face-surface").value=f.surface}}
function showProperties(){const ss=selected();if(!ss.length)return hideProperties();const c=ss[0],b=C.contourBounds(c);properties.classList.remove("hidden");propTitle.textContent=ss.length>1?`${ss.length} Konturen ausgewählt`:c.name;geometryFields.innerHTML=`<div class="field"><label>X min (mm)</label><input id="geomX" type="number" step="0.1" value="${fmt(b.minX)}"></div><div class="field"><label>Y min (mm)</label><input id="geomY" type="number" step="0.1" value="${fmt(b.minY)}"></div>${c.geometry.kind==="circle"?`<div class="field"><label>Durchmesser (mm)</label><input id="geomDiameter" type="number" min="0.1" step="0.1" value="${fmt(c.geometry.r*2)}"></div>`:"<div class=\"field\"><label>Geometrie</label><input disabled value=\"Kontur / Segmente\"></div>"}`;
 fillToolSelect();$("toolCode").value=c.cam.tool.code;$("contourType").value=c.cam.contourType;$("direction").value=c.cam.direction;$("cutOrder").value=c.cam.order;$("kerfMm").value=c.cam.kerfMm??0;$("kerfComp").value=c.cam.kerfComp||"auto";$("leadInType").value=c.cam.leadIn.type;$("leadInLen").value=c.cam.leadIn.lengthMm;$("leadOutType").value=c.cam.leadOut.type;$("leadOutLen").value=c.cam.leadOut.lengthMm;const bv=c.cam.bevel;$("bevelEnabled").checked=!!bv.enabled;$("bevelType").value=bv.profileType;$("bevelLocation").value=bv.location;$("bevelLand").value=bv.landMm;$("bevelAzimuth").value=bv.azimuthDeg;$("bevelVariable").checked=!!bv.variable;setFaceRows(bv);const rule=c.cam.sourceRule?`<br>DXF-Regel: ${escapeHtml(c.cam.sourceRule.group||"")} / ${escapeHtml(c.cam.sourceRule.name||"")}`:"";const cm=chainMeta(c);edgeInfo.innerHTML=`<b>${c.closed?"Geschlossene Kontur":c.chainClosed?"Abschnitt einer geschlossenen Kette":"Offene Kontur"}</b> · Länge ${fmt(C.contourLength(c))} mm · ${c.geometry.kind==="circle"?"Kreis":`${c.geometry.segments.length} Segment(e)`}<br>${c.closed?`Fläche ${fmt(C.contourArea(c))} mm² · `:""}Kette ${escapeHtml(c.chainName||c.chainId)} · Abschnitt ${cm.index}/${cm.count}<br>Quelle: ${escapeHtml(c.sourceLayer||"CUTAI")} · CAM-Typ: ${resolvedType(c)} · Werkzeug ${escapeHtml(c.cam.tool.code)}${rule}`}
function readBevelFromUi(){const limit=Math.min(50,Number(state.project.machineProfile.bevelAngleLimitDeg)||50),faces=[];for(let i=0;i<4;i++){faces.push({enabled:document.querySelector(`.face-enabled[data-i="${i}"]`)?.checked||false,surface:document.querySelector(`.face-surface[data-i="${i}"]`)?.value||"custom",angleDeg:C.clamp(num(document.querySelector(`.face-angle[data-i="${i}"]`)?.value),-limit,limit),heightMm:Math.max(0,num(document.querySelector(`.face-height[data-i="${i}"]`)?.value))})}return{enabled:$("bevelEnabled").checked,profileType:$("bevelType").value,location:$("bevelLocation").value,landMm:Math.max(0,num($("bevelLand").value)),azimuthDeg:num($("bevelAzimuth").value),variable:$("bevelVariable").checked,faces}}
function readCamUi(){const t=toolByCode($("toolCode").value);return{tool:toolSnapshot(t),contourType:$("contourType").value,direction:$("direction").value,order:Math.max(1,Math.round(num($("cutOrder").value)||1)),kerfMm:Math.max(0,num($("kerfMm").value)),kerfComp:$("kerfComp").value||"auto",leadIn:{type:$("leadInType").value,lengthMm:Math.max(0,num($("leadInLen").value))},leadOut:{type:$("leadOutType").value,lengthMm:Math.max(0,num($("leadOutLen").value))},bevel:readBevelFromUi()}}
function applyProperties(){const ss=selected();if(!ss.length)return;snapshot();const c=ss[0],b=C.contourBounds(c),nx=num($("geomX")?.value),ny=num($("geomY")?.value),dx=nx-b.minX,dy=ny-b.minY;let moved=C.translateContour(c,dx,dy);if(moved.geometry.kind==="circle"&&$("geomDiameter")){moved.geometry.r=Math.max(.05,num($("geomDiameter").value)/2)}Object.assign(c,moved);const cam=readCamUi(),sp=c.cam.startPoint;c.cam={...c.cam,...cam,startPoint:sp};render();showProperties();status("Eigenschaften übernommen")}
function applyCamToSelection(){const ss=selected();if(!ss.length)return;snapshot();const cam=readCamUi();for(const c of ss){const sp=c.cam.startPoint;c.cam={...c.cam,...deep(cam),startPoint:sp}}render();showProperties();status(`CAM/Fase auf ${ss.length} Kontur(en) übernommen`)}
function moveSelected(dx,dy){if(!state.selectedIds.length)return;snapshot();for(const id of state.selectedIds){const c=find(id),m=C.translateContour(c,dx,dy);Object.assign(c,m)}render();showProperties();status(`Verschoben ΔX ${fmt(dx)} · ΔY ${fmt(dy)}`)}
function toggleSelection(id){const i=state.selectedIds.indexOf(id);if(i>=0)state.selectedIds.splice(i,1);else state.selectedIds.push(id);render();state.selectedIds.length?showProperties():hideProperties()}
function deleteSelected(){if(!state.selectedIds.length)return;snapshot();state.project.contours=contours().filter(c=>!state.selectedIds.includes(c.id));state.selectedIds=[];hideProperties();render();status("Auswahl gelöscht")}
function duplicateSelected(){const ss=selected();if(!ss.length)return;snapshot();const made=[];for(const c of ss){let n=C.translateContour(deep(c),10,10);n.id=uid();n.name=`${c.name} Kopie`;n.cam.order=contours().length+made.length+1;contours().push(n);made.push(n.id)}state.selectedIds=made;render();showProperties();status(`${made.length} Kontur(en) kopiert`)}

function renumberChain(chainId){
 const ms=contours().filter(c=>c.chainId===chainId);ms.forEach((c,i)=>{c.sectionIndex=i+1;c.chainName=c.chainName||`Kette ${chainId.slice(-4)}`;c.name=ms.length>1?`${c.chainName} · Abschnitt ${i+1}`:c.chainName})
}
function camSectionSignature(c){return JSON.stringify({tool:c.cam?.tool?.code,contourType:c.cam?.contourType,direction:c.cam?.direction,kerfMm:c.cam?.kerfMm,kerfComp:c.cam?.kerfComp,leadIn:c.cam?.leadIn,leadOut:c.cam?.leadOut,bevel:c.cam?.bevel})}
function splitSectionAtPoint(c,p){
 if(!c)return status("Keine Kontur am Trennpunkt gefunden");
 const oldType=resolvedType(c),result=C.splitContourGeometryAtPoint(c,p);if(!result)return status("Hier kann nicht getrennt werden. Trennpunkt etwas weiter auf die Kontur setzen.");
 snapshot();const chainId=c.chainId||c.id,chainName=c.chainName||c.name||"Kontur";if(c.cam.contourType==="auto"&&oldType!=="none")c.cam.contourType=oldType;
 if(result.mode==="open-loop"){
  c.geometry=result.parts[0].geometry;c.closed=false;c.chainId=chainId;c.chainName=chainName;c.chainClosed=true;c.sectionIndex=1;c.cam.startPoint=null;renumberChain(chainId);state.selectedIds=[c.id];render();showProperties();status("Erster Trennpunkt gesetzt. Jetzt zweiten Trennpunkt auf derselben Kette setzen.");return
 }
 const idx=contours().findIndex(x=>x.id===c.id),a=normalizeContour({...deep(c),id:uid(),geometry:result.parts[0].geometry,closed:false,chainId,chainName,chainClosed:!!c.chainClosed,cam:{...deep(c.cam),startPoint:null}},idx),b=normalizeContour({...deep(c),id:uid(),geometry:result.parts[1].geometry,closed:false,chainId,chainName,chainClosed:!!c.chainClosed,cam:{...deep(c.cam),startPoint:null}},idx+1);
 state.project.contours.splice(idx,1,a,b);renumberChain(chainId);state.selectedIds=[a.id,b.id];render();showProperties();status(`Abschnitt aufgetrennt · Kette hat ${chainMembers(a).length} Abschnitte`)
}
function mergeSelectedSections(){
 const ss=selected();if(ss.length<2)return status("Mindestens zwei Abschnitte derselben Kette auswählen");const chainId=ss[0].chainId;if(ss.some(c=>c.chainId!==chainId))return status("Nur Abschnitte derselben Kette können verbunden werden");
 const sig=camSectionSignature(ss[0]);if(ss.some(c=>camSectionSignature(c)!==sig))return status("Abschnitte haben unterschiedliche CAM-/Fasenparameter. Erst angleichen, dann verbinden.");
 const segs=ss.flatMap(c=>c.geometry.kind==="circle"?C.circleToSegments(c.geometry):deep(c.geometry.segments||[])),chains=C.chainSegments(segs,.1);if(chains.length!==1)return status("Auswahl ist geometrisch nicht zusammenhängend");
 snapshot();const allMembers=contours().filter(c=>c.chainId===chainId),allSelected=allMembers.every(c=>ss.some(s=>s.id===c.id)),first=deep(ss[0]),ch=chains[0];first.id=uid();first.geometry={kind:"segments",segments:ch.segments};first.closed=!!ch.closed;first.chainClosed=allSelected?!!ch.closed:!!ss[0].chainClosed;first.chainId=first.closed?first.id:chainId;first.chainName=ss[0].chainName||"Kontur";first.cam.startPoint=null;
 const ids=new Set(ss.map(c=>c.id)),at=Math.min(...ss.map(c=>contours().findIndex(x=>x.id===c.id)));state.project.contours=contours().filter(c=>!ids.has(c.id));state.project.contours.splice(at,0,normalizeContour(first,at));renumberChain(first.chainId);state.selectedIds=[first.id];render();showProperties();status("Abschnitte verbunden")
}

function contourDistance(p,c){const q=C.nearestPointOnContour(p,c);return q?q.d:Infinity}
function hitContour(p){const threshold=Math.max(6,state.viewBox.w/120);let best=null,bd=Infinity;for(const c of contours()){const d=contourDistance(p,c);if(d<bd&&d<threshold){best=c;bd=d}}return best}
function down(e){svg.setPointerCapture?.(e.pointerId);state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=svgPoint(e.clientX,e.clientY);if(state.pointers.size===2){state.drawing=null;preview.replaceChildren();const a=[...state.pointers.values()],mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};state.pinch={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),view:deep(state.viewBox),mid,world:svgPoint(mid.x,mid.y)};return}
 if(state.startPointMode){const c=selected()[0];if(!c)return;const q=C.nearestPointOnContour(p,c);if(q){snapshot();c.cam.startPoint={x:q.x,y:q.y,segmentIndex:q.segmentIndex??0};state.startPointMode=false;render();showProperties();status("Startpunkt gesetzt")}return}
 if(state.tool==="split"){const h=hitContour(p);if(!h)return status("Trennpunkt muss auf einer Kontur liegen");state.selectedIds=[h.id];splitSectionAtPoint(h,p);return}
 if(state.tool==="pan"){state.pan={x:e.clientX,y:e.clientY,view:deep(state.viewBox)};return}
 if(state.tool==="select"){const h=hitContour(p);if(h){if(state.multi)toggleSelection(h.id);else if(!state.selectedIds.includes(h.id)){state.selectedIds=[h.id];render();showProperties()}state.drag={x:p.x,y:p.y,originals:selected().map(deep),moved:false}}else if(!state.multi){state.selectedIds=[];hideProperties();render()}return}
 const sp=snapPoint(p);
 if(state.tool==="arc"){if(!state.arcStage){state.arcStage={stage:1,center:sp};status("Bogen: Startpunkt antippen")}else if(state.arcStage.stage===1){const r=C.dist(state.arcStage.center,sp);if(r>.1){state.arcStage={...state.arcStage,stage:2,start:sp,r};status("Bogen: Endpunkt antippen")}}else{const a=Math.atan2(sp.y-state.arcStage.center.y,sp.x-state.arcStage.center.x),end={x:state.arcStage.center.x+state.arcStage.r*Math.cos(a),y:state.arcStage.center.y+state.arcStage.r*Math.sin(a)};snapshot();const c=addContour({geometry:{kind:"segments",segments:[{type:"arc",cx:state.arcStage.center.x,cy:state.arcStage.center.y,r:state.arcStage.r,sx:state.arcStage.start.x,sy:state.arcStage.start.y,ex:end.x,ey:end.y,cw:true}]},closed:false,sourceLayer:"CUTAI"});state.selectedIds=[c.id];state.arcStage=null;preview.replaceChildren();render();showProperties();status("Bogen erstellt")}}else state.drawing={tool:state.tool,start:sp,current:sp};
}
function move(e){if(state.pointers.has(e.pointerId))state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=svgPoint(e.clientX,e.clientY);coordsEl.textContent=`X ${fmt(p.x)} · Y ${fmt(-p.y)} mm`;
 if(state.pointers.size>=2&&state.pinch){const a=[...state.pointers.values()],d=Math.max(20,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)),scale=state.pinch.distance/d;const nw=C.clamp(state.pinch.view.w*scale,20,20000),nh=C.clamp(state.pinch.view.h*scale,20,20000),r=svg.getBoundingClientRect(),fx=(state.pinch.mid.x-r.left)/r.width,fy=(state.pinch.mid.y-r.top)/r.height;state.viewBox={x:state.pinch.world.x-fx*nw,y:state.pinch.world.y-fy*nh,w:nw,h:nh};setViewBox();return}
 if(state.pan){const r=svg.getBoundingClientRect(),dx=(e.clientX-state.pan.x)/r.width*state.pan.view.w,dy=(e.clientY-state.pan.y)/r.height*state.pan.view.h;state.viewBox={...state.pan.view,x:state.pan.view.x-dx,y:state.pan.view.y-dy};setViewBox();return}
 if(state.drag&&state.tool==="select"){const dx=p.x-state.drag.x,dy=p.y-state.drag.y;if(Math.hypot(dx,dy)>.2)state.drag.moved=true;state.drag.originals.forEach(o=>{const c=find(o.id),m=C.translateContour(o,dx,dy);Object.assign(c,m)});render();return}
 if(state.drawing){state.drawing.current=snapPoint(p);drawPreview()}
 else if(state.tool==="arc"&&state.arcStage?.stage===2){const a=Math.atan2(p.y-state.arcStage.center.y,p.x-state.arcStage.center.x),end={x:state.arcStage.center.x+state.arcStage.r*Math.cos(a),y:state.arcStage.center.y+state.arcStage.r*Math.sin(a)};preview.replaceChildren();const path=document.createElementNS(NS,"path"),s={type:"arc",cx:state.arcStage.center.x,cy:state.arcStage.center.y,r:state.arcStage.r,sx:state.arcStage.start.x,sy:state.arcStage.start.y,ex:end.x,ey:end.y,cw:true};path.setAttribute("d",arcPath(s));path.setAttribute("class","preview");preview.appendChild(path)}else snapPoint(p);
}
function up(e){const hadTwo=state.pointers.size>=2;state.pointers.delete(e.pointerId);if(hadTwo){if(state.pointers.size<2)state.pinch=null;return}if(state.pan){state.pan=null;return}if(state.drag){if(state.drag.moved){const finals=state.drag.originals.map(o=>deep(find(o.id)));state.drag.originals.forEach(o=>Object.assign(find(o.id),o));snapshot();finals.forEach(f=>Object.assign(find(f.id),f));render();showProperties();status("Kontur verschoben")}state.drag=null;return}if(!state.drawing)return;const d=state.drawing;state.drawing=null;preview.replaceChildren();const a=d.start,b=d.current||d.start;let c=null;if(d.tool==="line"&&C.dist(a,b)>.2)c={geometry:{kind:"segments",segments:[{type:"line",x1:a.x,y1:a.y,x2:b.x,y2:b.y}]},closed:false,sourceLayer:"CUTAI"};if(d.tool==="rect"&&Math.abs(b.x-a.x)>.2&&Math.abs(b.y-a.y)>.2){const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);c={geometry:{kind:"segments",segments:rectSegments(x,y,w,h)},closed:true,sourceLayer:"CUTAI"}}if(d.tool==="circle"&&C.dist(a,b)>.2)c={geometry:{kind:"circle",cx:a.x,cy:a.y,r:C.dist(a,b)},closed:true,sourceLayer:"CUTAI"};if(c){snapshot();const n=addContour(c);state.selectedIds=[n.id];render();showProperties();status("Kontur erstellt")}}
function drawPreview(){preview.replaceChildren();const d=state.drawing;if(!d)return;const a=d.start,b=d.current;let el;if(d.tool==="line"){el=document.createElementNS(NS,"line");el.setAttribute("x1",a.x);el.setAttribute("y1",a.y);el.setAttribute("x2",b.x);el.setAttribute("y2",b.y)}else if(d.tool==="rect"){el=document.createElementNS(NS,"rect");el.setAttribute("x",Math.min(a.x,b.x));el.setAttribute("y",Math.min(a.y,b.y));el.setAttribute("width",Math.abs(b.x-a.x));el.setAttribute("height",Math.abs(b.y-a.y))}else if(d.tool==="circle"){el=document.createElementNS(NS,"circle");el.setAttribute("cx",a.x);el.setAttribute("cy",a.y);el.setAttribute("r",C.dist(a,b))}if(el){el.setAttribute("class","preview");preview.appendChild(el)}}
function joinContours(){const ss=state.selectedIds.length?selected():contours();if(ss.some(c=>c.chainClosed&&!c.closed))return status("Bereits aufgetrennte Abschnitte bitte mit ‘Abschnitte verbinden’ bearbeiten. Konturen erkennen würde CAM-/Fasendaten verwerfen.");const ids=new Set(ss.map(c=>c.id)),preserve=contours().filter(c=>!ids.has(c.id)),rawByLayer=new Map(),circles=[];for(const c of ss){if(c.geometry.kind==="circle")circles.push(c);else for(const s of c.geometry.segments||[]){const layer=c.sourceLayer||"CUTAI";if(!rawByLayer.has(layer))rawByLayer.set(layer,[]);rawByLayer.get(layer).push({...s,layer})}}const made=[];for(const c of circles)made.push(c);for(const[layer,segs]of rawByLayer)for(const ch of C.chainSegments(segs,.1))made.push(normalizeContour({id:uid(),name:`Kontur ${preserve.length+made.length+1}`,geometry:{kind:"segments",segments:ch.segments.map(({layer,...s})=>s)},closed:ch.closed,sourceLayer:layer,cam:defaultCam(preserve.length+made.length+1)}));snapshot();state.project.contours=[...preserve,...made].map(normalizeContour);state.selectedIds=made.map(c=>c.id);render();showProperties();status(`${made.length} Kontur(en) erkannt / zusammengefügt`)}
function autoCam(){if(!contours().length)return status("Keine Konturen");snapshot();const cls=C.autoClassify(contours());const depthBy=new Map(cls.map(x=>[x.id,x]));const ordered=[...contours()].sort((a,b)=>{const da=depthBy.get(a.id),db=depthBy.get(b.id);return (db?.depth||0)-(da?.depth||0)||(da?.area||0)-(db?.area||0)});ordered.forEach((c,i)=>{const r=depthBy.get(c.id);c.cam.order=i+1;if(c.cam.contourType==="auto")c.cam.direction=r?.type==="inside"?"ccw":"cw";if(!c.cam.startPoint){const q=C.contourSamplePoints(c,10)[0]||(c.geometry.kind==="circle"?{x:c.geometry.cx+c.geometry.r,y:c.geometry.cy}:null);if(q)c.cam.startPoint={x:q.x,y:q.y,segmentIndex:0}}});render();showProperties();status("CAM automatisch: innen vor außen, Startpunkte gesetzt")}
function fitAll(){if(!contours().length){state.viewBox={x:0,y:0,w:1200,h:800};return render()}const bs=contours().map(C.contourBounds),minX=Math.min(...bs.map(b=>b.minX)),minY=Math.min(...bs.map(b=>b.minY)),maxX=Math.max(...bs.map(b=>b.maxX)),maxY=Math.max(...bs.map(b=>b.maxY)),pad=Math.max(30,(maxX-minX+maxY-minY)*.08);state.viewBox={x:minX-pad,y:minY-pad,w:Math.max(100,maxX-minX+2*pad),h:Math.max(100,maxY-minY+2*pad)};setViewBox()}
function download(name,text,type){const blob=new Blob([text],{type}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function layerName(c){const tool=c.cam.tool.code.replace(/[^A-Za-z0-9]/g,"_"),type=resolvedType(c).toUpperCase(),bev=c.cam.bevel.enabled?`_BEVEL_${c.cam.bevel.profileType}_${Math.round(Math.max(...c.cam.bevel.faces.filter(f=>f.enabled).map(f=>Math.abs(f.angleDeg)),0))}`:"";return`${tool}_${type}${bev}`}
function exportCamPlan(){const report=C.validateProject(state.project),ops=[...contours()].sort((a,b)=>a.cam.order-b.cam.order).map(c=>({id:c.id,name:c.name,order:c.cam.order,tool:c.cam.tool,contourType:resolvedType(c),direction:c.cam.direction,startPoint:c.cam.startPoint,kerfMm:c.cam.kerfMm,kerfComp:c.cam.kerfComp,leadIn:c.cam.leadIn,leadOut:c.cam.leadOut,bevel:c.cam.bevel,sourceLayer:c.sourceLayer,sourceRule:c.cam.sourceRule||null,chainId:c.chainId,chainName:c.chainName,sectionIndex:c.sectionIndex,chainClosed:c.chainClosed,lengthMm:C.contourLength(c),geometry:deep(c.geometry)}));const plan={schema:"cutai-cam-plan/0.7.2",units:"mm",project:state.project.name,machineProfile:state.project.machineProfile,material:state.project.material,postprocessorTarget:state.project.machineProfile.postprocessorTarget||"neutral",referenceBuild:R.buildReference||null,note:"Neutraler CAM-Plan. Das Postprozessor-Ziel ist nur Metadatum; es werden keine Maschinen-M-Codes und keine direkte Maschinensteuerung erzeugt.",validation:report,simulation:simulationMetrics(),operations:ops};download("cutai-cam-plan-v072.json",JSON.stringify(plan,null,2),"application/json");status("Neutraler CAM-Plan v0.7.2 exportiert")}
function validate(){const r=C.validateProject(state.project),body=$("reportBody");let h=`<p class="${r.ok?"report-ok":"report-error"}"><b>${r.ok?"Keine harten Fehler gefunden":"Fehler gefunden"}</b></p>`;if(r.errors.length)h+=`<p class="report-error"><b>Fehler</b><br>${r.errors.map(escapeHtml).join("<br>")}</p>`;if(r.warnings.length)h+=`<p class="report-warn"><b>Hinweise</b><br>${r.warnings.map(escapeHtml).join("<br>")}</p>`;if(!r.errors.length&&!r.warnings.length)h+="<p>Alle aktuell prüfbaren Regeln sind erfüllt.</p>";h+='<p class="hint">Diese Prüfung ersetzt keine Maschinenfreigabe, Kollisionsprüfung oder Hersteller-Postprozessorvalidierung.</p>';body.innerHTML=h;$("reportDialog").showModal()}
function parseSvg(text){const doc=new DOMParser().parseFromString(text,"image/svg+xml"),out=[];doc.querySelectorAll("line").forEach(n=>out.push({geometry:{kind:"segments",segments:[{type:"line",x1:num(n.getAttribute("x1")),y1:num(n.getAttribute("y1")),x2:num(n.getAttribute("x2")),y2:num(n.getAttribute("y2"))}]},closed:false,sourceLayer:"SVG"}));doc.querySelectorAll("rect").forEach(n=>{const x=num(n.getAttribute("x")),y=num(n.getAttribute("y")),w=Math.abs(num(n.getAttribute("width"))),h=Math.abs(num(n.getAttribute("height")));out.push({geometry:{kind:"segments",segments:rectSegments(x,y,w,h)},closed:true,sourceLayer:"SVG"})});doc.querySelectorAll("circle").forEach(n=>out.push({geometry:{kind:"circle",cx:num(n.getAttribute("cx")),cy:num(n.getAttribute("cy")),r:Math.abs(num(n.getAttribute("r")))},closed:true,sourceLayer:"SVG"}));doc.querySelectorAll("polyline,polygon").forEach(n=>{const pts=(n.getAttribute("points")||"").trim().split(/\s+/).map(x=>x.split(",").map(Number)).filter(a=>a.length>=2&&a.every(Number.isFinite)).map(([x,y])=>({x,y})),closed=n.tagName.toLowerCase()==="polygon";if(pts.length>=2){const segs=[];for(let i=0;i<pts.length-1;i++)segs.push({type:"line",x1:pts[i].x,y1:pts[i].y,x2:pts[i+1].x,y2:pts[i+1].y});if(closed)segs.push({type:"line",x1:pts.at(-1).x,y1:pts.at(-1).y,x2:pts[0].x,y2:pts[0].y});out.push({geometry:{kind:"segments",segments:segs},closed,sourceLayer:"SVG"})}});return out}
function importDxfRecords(records){return records.map((r,i)=>normalizeContour({...r,id:uid(),name:`DXF Kontur ${i+1}`,cam:camForLayer(r.sourceLayer||"0",contours().length+i+1)},contours().length+i))}

function simulationMetrics(){
 const ordered=[...contours()].sort((a,b)=>(a.cam.order||0)-(b.cam.order||0));let prev=null,travel=0,cut=0;
 for(const c of ordered){const p=c.cam.startPoint||C.contourSamplePoints(c,10)[0]||C.contourCentroid(c);if(prev&&p)travel+=C.dist(prev,p);cut+=C.contourLength(c)+Math.max(0,Number(c.cam?.leadIn?.lengthMm)||0)+Math.max(0,Number(c.cam?.leadOut?.lengthMm)||0);prev=p}
 return{cut,travel,count:ordered.length}
}
function renderSimulation(){
 const ordered=[...contours()].sort((a,b)=>(a.cam.order||0)-(b.cam.order||0));let prev=null;
 for(const c of ordered){const p=c.cam.startPoint||C.contourSamplePoints(c,10)[0]||C.contourCentroid(c);if(!p)continue;
  if(prev){const l=document.createElementNS(NS,"line");l.setAttribute("x1",prev.x);l.setAttribute("y1",prev.y);l.setAttribute("x2",p.x);l.setAttribute("y2",p.y);l.setAttribute("class","sim-travel");simLayer.appendChild(l)}
  const m=document.createElementNS(NS,"circle");m.setAttribute("cx",p.x);m.setAttribute("cy",p.y);m.setAttribute("r",Math.max(7,state.viewBox.w/210));m.setAttribute("class","sim-order-dot");simLayer.appendChild(m);
  const t=document.createElementNS(NS,"text");t.setAttribute("x",p.x);t.setAttribute("y",p.y);t.setAttribute("class","sim-order-text");t.textContent=String(c.cam.order||"?");simLayer.appendChild(t);prev=p
 }
}
function toggleSimulation(){state.simulation=!state.simulation;render();const m=simulationMetrics();status(state.simulation?`Simulation · ${m.count} Konturen · Schnitt ${fmt(m.cut)} mm · Eilweg ${fmt(m.travel)} mm`:"Simulation aus")}
function xmlChildText(el,tag,def=""){const n=[...el.children].find(x=>x.tagName===tag);return n?n.textContent:def}
function xmlInt(el,tag,def=0){const v=Number.parseInt(xmlChildText(el,tag,String(def)),10);return Number.isFinite(v)?v:def}
function parseAsperTool(el){
 return normalizeTool({code:xmlChildText(el,"Code",""),name:xmlChildText(el,"Name",""),priority:xmlInt(el,"Priority"),programIndex:xmlInt(el,"PrgIdx"),mayBeContour:!!xmlInt(el,"MayBeContour"),
  rotationType:xmlInt(el,"RotType"),bevelCorrectionType:xmlInt(el,"BevelCorrectionType"),headCount:xmlInt(el,"HeadCount",1),multiTorchMinGapRaw:xmlInt(el,"MultiTorchMinGap"),
  variableGap:!!xmlInt(el,"VariableGap"),mirrorContour:!!xmlInt(el,"MirrorCon"),canPunch:!!xmlInt(el,"CanPunch"),canVariableBevel:!!xmlInt(el,"CanVarBev"),
  bevelAllowStdTHC:!!xmlInt(el,"BevelAllowStdTHC"),loopAdaptOff:!!xmlInt(el,"LoopAdaptOff"),bevelCutDirRaw:xmlInt(el,"BevelCutDir"),
  supportsTHT:!!xmlInt(el,"SupportsTHT"),automaticBevelCompensation:!!xmlInt(el,"AutomaticBevelCompensation"),supportsPowerHole:!!xmlInt(el,"SupportsPowerHole"),
  dynafly:!!xmlInt(el,"Dynafly"),toolOnMillingHead:!!xmlInt(el,"ToolOnFreza")})
}
function parseLayerGroup(el){
 const name=xmlChildText(el,"LayerName",el.tagName),rules=[];
 for(const c of [...el.children].filter(x=>/^Layer\d+$/.test(x.tagName))){
  rules.push({name:xmlChildText(c,"Name",""),isActive:xmlInt(c,"IsActive",1)!==0,noCut:xmlInt(c,"NoCut",0)!==0,cuttingTool:xmlChildText(c,"CuttingTool",""),
   bevelTool:xmlChildText(c,"BevelTool",""),angleRaw:xmlInt(c,"Angle",0),angle2Raw:xmlInt(c,"Angle2",0),normal:xmlInt(c,"Normal",0),
   normalOffset:xmlInt(c,"NormalOffset",0),millingDepthRaw:xmlInt(c,"MillingDepth",0),millingOperations:xmlInt(c,"Milling-Operations",0)})
 }
 return{name,rules}
}
function parseAsperParamXml(text){
 const doc=new DOMParser().parseFromString(text,"application/xml");if(doc.querySelector("parsererror"))throw new Error("XML konnte nicht gelesen werden");
 const ct=doc.querySelector("CuttingTools");if(!ct)throw new Error("Kein ASPER-CuttingTools-Bereich gefunden");
 const arrays=[...ct.children].filter(x=>/^CCTArray\d+$/.test(x.tagName));if(!arrays.length)throw new Error("Keine CCTArray-Profile gefunden");
 return arrays.map((a,i)=>{const name=xmlChildText(a,"CCTArrayName",`Profil ${i+1}`),tools=[...a.children].filter(x=>/^Tool\d+$/.test(x.tagName)).map(parseAsperTool);
  const dg=[...a.children].find(x=>x.tagName==="DxfGroupLayers"),layerGroups=dg?[...dg.children].filter(x=>/^DxfLayers\d+$/.test(x.tagName)).map(parseLayerGroup):[];
  return normalizeProfile({id:`${name}#${i+1}`,name,typeOfNCCode:xmlInt(a,"TypeOfNCCode",2),tools,layerGroups})
 })
}
function activeIniValue(text,key){
 const re=new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&")}\\s*=\\s*([^;\\r\\n]+)`,"mi"),m=text.match(re);return m?m[1].trim():null
}
function handleAsperConfigText(text,name){
 if(/<registry[\s>]/i.test(text)&&/<CuttingTools[\s>]/i.test(text)){const ps=parseAsperParamXml(text),all=[BUILTIN_PROFILE,...ps];state.configProfiles=[...new Map(all.map(x=>[x.id,x])).values()];populateMachineProfileSelect(ps[0]?.id);if(ps[0])$("machineName").value=ps[0].name;refreshMachinePreview();status(`${ps.length} ASPER-Maschinenprofil(e) lokal geladen`);return}
 if(/\[FUNCTION\]/i.test(text)){const ab=activeIniValue(text,"ADDITIONAL_BEVEL"),hp=activeIniValue(text,"HP2CNC");if(ab!==null)$("additionalBevel").value=String(Number(ab)||0);if(hp!==null)$("sheetShapeInCnc").value=String(Number(hp)||0);status(`ASPER asf.ini gelesen${ab!==null?` · Additional Bevel ${ab}`:""}${hp!==null?` · HP2CNC ${hp}`:""}`);return}
 if(/\[GENERAL\]/i.test(text)&&/\[WRITER\]/i.test(text)){const keys=["IGNORE_ZERO","AUTO_PARK","AUTO_IHS","MILLING","ACTIVATE","DEACTIVATE","AUTOSPEED"],cfg={};for(const k of keys){const v=activeIniValue(text,k);if(v!==null)cfg[k]=Number.isFinite(Number(v))?Number(v):v}state.project.machineProfile.essiConfig=cfg;status("ESSI-Konfiguration lokal gelesen und im Projekt hinterlegt");return}
 throw new Error("Datei ist keine erkannte ASPER-param.xml/asf.ini/essi.ini")
}
function asperAngleToDeg(v){const n=Number(v)||0;return Math.abs(n)>360?n/1000:n}
function selectedLayerGroup(){const groups=state.project.machineProfile?.layerGroups||[],wanted=state.project.machineProfile?.dxfLayerGroup||"";return groups.find(g=>g.name===wanted)||(groups.length===1?groups[0]:null)}
function camForLayer(layer,order){
 const cam=defaultCam(order),group=selectedLayerGroup();if(!group)return cam;const rule=(group.rules||[]).find(r=>r.isActive!==false&&String(r.name).toLowerCase()===String(layer).toLowerCase());if(!rule)return cam;
 const tool=rule.noCut?NONE_TOOL:toolByCode(rule.cuttingTool||"T111");cam.tool=toolSnapshot(tool);cam.sourceRule={group:group.name,...deep(rule)};
 if(rule.noCut)cam.contourType="none";else if(tool.role==="mark"||tool.role==="punch")cam.contourType="mark";else if(tool.role==="drill")cam.contourType="drill";
 const a1=asperAngleToDeg(rule.angleRaw),a2=asperAngleToDeg(rule.angle2Raw);if(Math.abs(a1)>.0001||Math.abs(a2)>.0001||rule.bevelTool){cam.bevel.enabled=true;cam.bevel.profileType=Math.abs(a2)>.0001?"custom":"V";cam.bevel.faces[0]={enabled:Math.abs(a1)>.0001||!!rule.bevelTool,surface:"top",angleDeg:a1,heightMm:0};cam.bevel.faces[2]={enabled:Math.abs(a2)>.0001,surface:"bottom",angleDeg:a2,heightMm:0}}
 return cam
}
function populateMachineProfileSelect(preferred){
 const el=$("machineProfileSelect");if(!el)return;const currentProfile=normalizeProfile(state.project.machineProfile),catalog=[...state.configProfiles];
 if(currentProfile?.id&&!catalog.some(p=>p.id===currentProfile.id))catalog.push(currentProfile);
 const current=preferred||currentProfile.id||"";el.innerHTML=catalog.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} · ${(p.tools||[]).length} Werkzeuge</option>`).join("");
 state.configProfiles=catalog;if([...el.options].some(o=>o.value===current))el.value=current;else if(el.options.length)el.selectedIndex=0;refreshMachinePreview()
}
function previewProfile(){return state.configProfiles.find(p=>p.id===$("machineProfileSelect")?.value)||normalizeProfile(state.project.machineProfile)}
function populateLayerGroupSelect(profile,preferred){
 const el=$("dxfLayerGroup");if(!el)return;const groups=profile?.layerGroups||[];el.innerHTML='<option value="">Keine / automatisch</option>'+groups.map(g=>`<option value="${escapeHtml(g.name)}">${escapeHtml(g.name)} · ${g.rules.length} Regeln</option>`).join("");
 if(preferred&&[...el.options].some(o=>o.value===preferred))el.value=preferred
}
function refreshMachinePreview(){
 const p=previewProfile();if(!p)return;populateLayerGroupSelect(p,state.project.machineProfile?.dxfLayerGroup);
 const bevelTools=p.tools.filter(t=>t.bevelCapable||t.canVariableBevel),tht=p.tools.filter(t=>t.supportsTHT),heads=Math.max(0,...p.tools.map(t=>Number(t.headCount)||0));
 $("machineProfileInfo").innerHTML=`<b>${escapeHtml(p.name)}</b> · ${p.tools.length} Werkzeuge · ${bevelTools.length} Fasenwerkzeug(e) · max. ${heads} Kopf/Köpfe${tht.length?` · THT: ${tht.map(t=>escapeHtml(t.code)).join(", ")}`:""}<br><span class="hint">Layergruppen: ${(p.layerGroups||[]).length}. Importierte ASPER-Daten bleiben lokal im Browser/Projekt.</span>`
}
function populatePostprocessorSelect(){
 const el=$("postprocessorTarget");if(!el)return;const refs=R.postprocessorReferences||[{id:"neutral",name:"Neutraler CAM-Plan"}];el.innerHTML=refs.map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join("")
}
function showReference(){
 const b=R.buildReference||{},p=BUILTIN_PROFILE,mods=R.sourceModules||[],pp=R.postprocessorReferences||[],docs=R.manualReferences||[];
 $("referenceBody").innerHTML=`<p><b>Analysierter ASPER/CadCam-Stand</b><br>Revision ${escapeHtml(b.revision??"?")} / ${escapeHtml(b.revisionRange??"?")} · ${escapeHtml(b.date||"")}</p>
 <p><b>Integriertes Referenzprofil</b><br>${escapeHtml(p.name)} · ${p.tools.length} Werkzeuge · Additional Bevel ${escapeHtml(R.asperDefaults?.additionalBevelMode??"?")} · HP2CNC ${escapeHtml(R.asperDefaults?.sheetShapeInCnc??"?")}</p>
 <p><b>Erkannte Postprozessor-Familien</b><br>${pp.map(x=>escapeHtml(x.name)).join("<br>")}</p>
 <p><b>Statisch ausgewertete Kernmodule</b><br>${mods.map(escapeHtml).join(", ")}</p>\n <p><b>Handbuch-Abgleich</b><br>${docs.map(x=>`${escapeHtml(x.document)} · S. ${escapeHtml(x.pages)} · ${escapeHtml(x.topic)}`).join("<br>")}</p>
 <p class="hint">Die Binärdateien wurden nicht ausgeführt. CutAI übernimmt daraus nur Struktur-/Referenzwissen. Diese Version erzeugt bewusst kein ausführbares Maschinen-NC.</p>`;$("referenceDialog").showModal()
}
function openProjectDialog(){
 const p=state.project;populatePostprocessorSelect();populateMachineProfileSelect(p.machineProfile.id);$("projectName").value=p.name;$("machineName").value=p.machineProfile.name;$("materialName").value=p.material.name;$("materialThickness").value=p.material.thicknessMm;$("bevelLimit").value=p.machineProfile.bevelAngleLimitDeg;$("additionalBevel").value=String(p.machineProfile.additionalBevelMode??1);$("sheetShapeInCnc").value=String(p.machineProfile.sheetShapeInCnc??2);$("postprocessorTarget").value=p.machineProfile.postprocessorTarget||"neutral";populateLayerGroupSelect(previewProfile(),p.machineProfile.dxfLayerGroup||"");refreshMachinePreview();$("projectDialog").showModal()
}
function preset(type){const loc=type==="K"?"both":"top";$("bevelEnabled").checked=true;$("bevelType").value=type;$("bevelLocation").value=loc;const rows=[...document.querySelectorAll(".face-row")];rows.forEach((r,i)=>{r.querySelector(".face-enabled").checked=(type==="K"?i===0||i===2:i===0);r.querySelector(".face-surface").value=i===2?"bottom":"top";r.querySelector(".face-angle").value=i===2?-30:30;r.querySelector(".face-height").value=0});if(type==="Y")$("bevelLand").value=2}
fillToolSelect();
populatePostprocessorSelect();
$("viewMode").value=state.viewMode;$("viewMode").onchange=()=>{state.viewMode=$("viewMode").value||"tool";render();status(`Ansicht: ${state.viewMode==="tool"?"Werkzeuge":state.viewMode==="bevel"?"Fasen":"Normal"}`)};
document.querySelectorAll(".tool").forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$("undoBtn").onclick=undo;$("redoBtn").onclick=redo;$("deleteBtn").onclick=deleteSelected;$("duplicateBtn").onclick=duplicateSelected;
$("multiBtn").onclick=()=>{state.multi=!state.multi;$("multiBtn").classList.toggle("active",state.multi);status(state.multi?"Mehrfachauswahl an":"Mehrfachauswahl aus")};
$("snapBtn").onclick=()=>{state.snapEnabled=!state.snapEnabled;$("snapBtn").classList.toggle("active",state.snapEnabled);if(!state.snapEnabled)snapLayer.replaceChildren();status(state.snapEnabled?"Fang an":"Fang aus")};
$("selectAllBtn").onclick=()=>{state.selectedIds=contours().map(c=>c.id);state.multi=true;$("multiBtn").classList.add("active");render();showProperties()};
$("clearSelectionBtn").onclick=()=>{state.selectedIds=[];hideProperties();render()};
$("closeProperties").onclick=hideProperties;$("applyProperties").onclick=applyProperties;$("applyCamToSelection").onclick=applyCamToSelection;
$("moveApply").onclick=()=>moveSelected(num($("moveX").value),num($("moveY").value));
document.querySelectorAll("[data-nudge]").forEach(b=>b.onclick=()=>{const[dx,dy]=b.dataset.nudge.split(",").map(Number);moveSelected(dx,dy)});
$("setStartBtn").onclick=()=>{if(!selected().length)return status("Zuerst Kontur auswählen");state.startPointMode=true;status("Jetzt gewünschten Startpunkt auf der Kontur antippen")};
$("clearStartBtn").onclick=()=>{if(!selected().length)return;snapshot();selected().forEach(c=>c.cam.startPoint=null);render();showProperties();status("Startpunkt gelöscht")};
$("presetVBtn").onclick=()=>preset("V");$("presetYBtn").onclick=()=>preset("Y");$("presetKBtn").onclick=()=>preset("K");$("bevelZeroBtn").onclick=()=>{$("bevelEnabled").checked=false;document.querySelectorAll(".face-enabled").forEach(x=>x.checked=false)};
$("newBtn").onclick=()=>{snapshot();state.project=newProject();state.selectedIds=[];state.simulation=false;hideProperties();fillToolSelect();render();status("Neues Projekt v0.7.2")};
$("saveBtn").onclick=()=>download("cutai-project-v072.json",JSON.stringify(state.project,null,2),"application/json");
$("loadInput").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{snapshot();restoreProject(JSON.parse(await f.text()));status("Projekt geladen")}catch(err){status("Projekt konnte nicht geladen werden: "+err.message)}e.target.value=""};
$("dxfInput").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const parsed=C.parseDxf(await f.text(),.1);if(!parsed.length)throw new Error("keine unterstützten ENTITIES");snapshot();const cs=importDxfRecords(parsed);contours().push(...cs);state.selectedIds=cs.map(c=>c.id);render();fitAll();showProperties();const ruled=cs.filter(c=>c.cam.sourceRule).length;status(`${cs.length} DXF-Kontur(en) importiert und verkettet${ruled?` · ${ruled} Layerregel(n) angewendet`:""}`)}catch(err){status("DXF-Import fehlgeschlagen: "+err.message)}e.target.value=""};
$("svgInput").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const parsed=parseSvg(await f.text());if(!parsed.length)throw new Error("keine unterstützte Geometrie");snapshot();const cs=parsed.map((r,i)=>normalizeContour({...r,id:uid(),name:`SVG Kontur ${i+1}`,cam:defaultCam(contours().length+i+1)},contours().length+i));contours().push(...cs);state.selectedIds=cs.map(c=>c.id);render();fitAll();showProperties();status(`${cs.length} SVG-Kontur(en) importiert`)}catch(err){status("SVG-Import fehlgeschlagen: "+err.message)}e.target.value=""};
$("joinBtn").onclick=joinContours;$("mergeSectionsBtn").onclick=mergeSelectedSections;$("autoCamBtn").onclick=autoCam;$("validateBtn").onclick=validate;$("simBtn").onclick=toggleSimulation;$("referenceBtn").onclick=showReference;
$("dxfBtn").onclick=()=>{if(!contours().length)return status("Keine Konturen");download("cutai-export-v072-r12.dxf",C.makeDxf(contours(),layerName),"application/dxf");status("DXF R12 exportiert")};
$("camPlanBtn").onclick=exportCamPlan;$("fitBtn").onclick=fitAll;$("resetViewBtn").onclick=()=>{state.viewBox={x:0,y:0,w:1200,h:800};render();status("Ansicht 1:1")};
$("projectBtn").onclick=openProjectDialog;
$("machineProfileSelect").onchange=()=>{const p=previewProfile();if(p)$("machineName").value=p.name;refreshMachinePreview()};
$("asperConfigInput").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{handleAsperConfigText(await f.text(),f.name)}catch(err){status("ASPER-Konfiguration nicht gelesen: "+err.message)}e.target.value=""};
$("saveProjectSettings").onclick=e=>{e.preventDefault();snapshot();const base=previewProfile(),oldEssi=state.project.machineProfile?.essiConfig,mp=profileSnapshot(base);
 mp.name=$("machineName").value.trim()||base.name;mp.bevelAngleLimitDeg=C.clamp(num($("bevelLimit").value)||50,0,50);mp.additionalBevelMode=Number($("additionalBevel").value)||0;
 mp.sheetShapeInCnc=Number($("sheetShapeInCnc").value)||0;mp.postprocessorTarget=$("postprocessorTarget").value||"neutral";mp.dxfLayerGroup=$("dxfLayerGroup").value||"";mp.configSource=base.id===BUILTIN_PROFILE.id?"built-in":"local-import";if(oldEssi)mp.essiConfig=deep(oldEssi);
 state.project.name=$("projectName").value.trim()||"CutAI Projekt";state.project.material.name=$("materialName").value.trim()||"Material";state.project.material.thicknessMm=Math.max(0,num($("materialThickness").value));state.project.machineProfile=mp;
 state.project.contours=contours().map((c,i)=>{const code=c.cam?.tool?.code,t=mp.tools.find(x=>x.code===code);if(t)c.cam.tool=toolSnapshot(t);return normalizeContour(c,i)});
 fillToolSelect();$("projectDialog").close();render();if(state.selectedIds.length)showProperties();status(`Maschinenprofil übernommen · ${mp.name}`)};
$("closeReport").onclick=()=>$("reportDialog").close();$("closeReference").onclick=()=>$("referenceDialog").close();
document.addEventListener("keydown",e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||""))return;if(e.key.toLowerCase()==="x"){const modes=["normal","tool","bevel"],i=modes.indexOf(state.viewMode);state.viewMode=modes[(i+1)%modes.length];$("viewMode").value=state.viewMode;render();status(`Ansicht: ${state.viewMode}`)}else if(e.key.toLowerCase()==="l"){setTool("split")}});
svg.addEventListener("pointerdown",down);svg.addEventListener("pointermove",move);svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);
svg.addEventListener("wheel",e=>{e.preventDefault();const p=svgPoint(e.clientX,e.clientY),factor=e.deltaY>0?1.12:.89,nw=C.clamp(state.viewBox.w*factor,20,20000),nh=C.clamp(state.viewBox.h*factor,20,20000),r=svg.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height;state.viewBox={x:p.x-fx*nw,y:p.y-fy*nh,w:nw,h:nh};setViewBox()},{passive:false});
try{const auto=localStorage.getItem("cutai-v072-autosave")||localStorage.getItem("cutai-v071-autosave")||localStorage.getItem("cutai-v07-autosave");if(auto)state.project=normalizeProject(JSON.parse(auto))}catch{}
setInterval(()=>{try{localStorage.setItem("cutai-v072-autosave",JSON.stringify(state.project))}catch{}},3000);
fillToolSelect();render();status("Bereit · v0.7.2 · Werkzeugfarben, Fasenansicht & Abschnittstrennung · kein Maschinen-NC")
})();
