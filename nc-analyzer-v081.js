(()=>{
"use strict";
const round=(v,n=3)=>Math.round(Number(v||0)*10**n)/10**n;
function stripComments(line){
 let s=String(line||"");s=s.replace(/\([^)]*\)/g," ");const semi=s.indexOf(";");if(semi>=0)s=s.slice(0,semi);return s.trim();
}
function parseCncDef(text){
 const s=String(text||"").replace(/\r/g,"");
 const center=(s.match(/^\s*CIRCLE_CENTER\s*=\s*(ABS|REL)/mi)||[])[1]||"REL";
 const commands={};
 for(const raw of s.split("\n")){
  const line=raw.trim();if(!/^D=[GM]\s+/i.test(line))continue;
  const m=line.match(/^D=([GM])\s*(\d+)\s+\d+\s+\d+\s+([A-Z0-9_]+)\s+([^\s]+).*?\s:\s*(.*)$/i);
  if(!m)continue;
  const key=m[1].toUpperCase()+Number(m[2]);
  commands[key]={key,family:m[1].toUpperCase(),code:Number(m[2]),name:m[3],parameter:m[4],args:m[5].trim().split(/\s+/).filter(Boolean)};
 }
 return{source:"CNCDEF.INI",circleCenter:center.toUpperCase(),commands,commandCount:Object.keys(commands).length};
}
function words(line){
 const clean=stripComments(line),out=[];let m;const re=/([A-Za-z_]+)\s*([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?)/g;
 while((m=re.exec(clean)))out.push({letter:m[1].toUpperCase(),value:Number(m[2].replace(",",".")),raw:m[0]});return out;
}
function len(a,b){return Math.hypot((b.x||0)-(a.x||0),(b.y||0)-(a.y||0),(b.z||0)-(a.z||0))}
function arcGeometry(start,end,rec,cw,circleCenter){
 let cx=null,cy=null,r=null,sweep=null;
 if(rec.I!=null||rec.J!=null){cx=circleCenter==="ABS"?(rec.I??start.x):start.x+(rec.I||0);cy=circleCenter==="ABS"?(rec.J??start.y):start.y+(rec.J||0);r=Math.hypot(start.x-cx,start.y-cy)}
 else if(rec.R!=null){
  r=Math.abs(rec.R);const dx=end.x-start.x,dy=end.y-start.y,q=Math.hypot(dx,dy);if(q>0&&r>=q/2){const mx=(start.x+end.x)/2,my=(start.y+end.y)/2,h=Math.sqrt(Math.max(0,r*r-q*q/4)),ux=-dy/q,uy=dx/q;const sign=(cw?-1:1)*(rec.R<0?-1:1);cx=mx+ux*h*sign;cy=my+uy*h*sign}
 }
 if(cx!=null&&cy!=null){let a0=Math.atan2(start.y-cy,start.x-cx),a1=Math.atan2(end.y-cy,end.x-cx),d=a1-a0;if(cw&&d>=0)d-=Math.PI*2;if(!cw&&d<=0)d+=Math.PI*2;sweep=d;r=r||Math.hypot(start.x-cx,start.y-cy)}
 return{cx,cy,r,sweep,length:r!=null&&sweep!=null?Math.abs(r*sweep):len(start,end)};
}
const semantic={
 M3:"Werkzeug/Technologie EIN (maschinenabhängig)",M4:"alternative Werkzeug-/Spindelrichtung",M5:"Werkzeug/Technologie AUS (maschinenabhängig)",M6:"Werkzeugwechsel",
 M26:"aktive Köpfe",M29:"Rotator-/Fasenparameter",M34:"Kontur-Tiefenberechnung AUS (laut CNCDEF-Kommentar)",M35:"Kontur-Tiefenberechnung EIN (laut CNCDEF-Kommentar)",
 M41:"Z-Achse THC/POS Umschaltung",M90:"Technologieparameter ändern",M91:"Rotationspositionierer",M94:"Synchronisations-/Maschinenparameter",M98:"TrueHole-Markierung",
 M101:"Mehrfachbrenner-Aktivität",M102:"THT/TrueHole schneiden",M103:"gegenläufige Rotatoren/Fasenstreifen",M109:"Fräszyklus-Präfix",M114:"Blaster-Parameter",
 M120:"PowerHole",M121:"Startpunkt setzen",M122:"Werkstück definieren",M123:"Schneidkopf definieren",M125:"Blechkante finden",M126:"Plasmabogen-Kontrolle temporär deaktivieren",M134:"Plasmastrom ändern",
 G0:"Eilgang",G1:"Linear",G2:"Kreisbogen CW",G3:"Kreisbogen CCW",G40:"Kompensation aus",G41:"Kompensation links",G42:"Kompensation rechts",G90:"absolute Koordinaten",G91:"relative Koordinaten"
};
function analyze(text,{dialect=null,fileName="NC-Programm"}={}){
 dialect=dialect||{circleCenter:"REL",commands:{}};const lines=String(text||"").replace(/\r/g,"").split("\n"),motions=[],events=[],unknown=[],warnings=[];
 let pos={x:0,y:0,z:0,a:0,b:0,c:0},absolute=true,motionMode=null,toolOn=false,tool=null,heads=null,cutLength=0,rapidLength=0,minX=0,maxX=0,minY=0,maxY=0;
 const seenUnknown=new Set();
 for(let idx=0;idx<lines.length;idx++){
  const raw=lines[idx],clean=stripComments(raw);if(!clean)continue;const ws=words(clean);if(!ws.length)continue;const rec={};for(const w of ws){if(rec[w.letter]==null)rec[w.letter]=w.value;else{if(!Array.isArray(rec[w.letter]))rec[w.letter]=[rec[w.letter]];rec[w.letter].push(w.value)}}
  const gs=ws.filter(w=>w.letter==="G").map(w=>Math.round(w.value)),ms=ws.filter(w=>w.letter==="M").map(w=>Math.round(w.value));
  for(const g of gs){if(g===90)absolute=true;if(g===91)absolute=false;if([0,1,2,3].includes(g))motionMode=g;const key=`G${g}`;if(![0,1,2,3].includes(g)&&(semantic[key]||dialect.commands?.[key]))events.push({line:idx+1,key,semantic:semantic[key]||dialect.commands[key].name,raw})}
  for(const m of ms){const key=`M${m}`,def=dialect.commands?.[key];let sem=semantic[key]||def?.name||"M-Befehl";if(m===3||m===4)toolOn=true;if(m===5)toolOn=false;if(m===6&&rec.T!=null)tool=Array.isArray(rec.T)?rec.T[0]:rec.T;if(m===26&&rec.D!=null)heads=rec.D;events.push({line:idx+1,key,semantic:sem,raw,args:Object.fromEntries(ws.filter(w=>!["G","M","N"].includes(w.letter)).map(w=>[w.letter,w.value]))});if(!def&&!semantic[key]&&!seenUnknown.has(key)){seenUnknown.add(key);unknown.push(key)}}
  const hasAxis=["X","Y","Z","A","B","C"].some(k=>rec[k]!=null);if(hasAxis&&motionMode!=null){const start={...pos},end={...pos};for(const [k,p] of [["X","x"],["Y","y"],["Z","z"],["A","a"],["B","b"],["C","c"]])if(rec[k]!=null){const v=Array.isArray(rec[k])?rec[k].at(-1):rec[k];end[p]=absolute?v:(pos[p]||0)+v}const base={line:idx+1,g:motionMode,start,end,toolOn,tool,heads,feed:rec.F??null,raw};let L=0;if(motionMode===2||motionMode===3){const ag=arcGeometry(start,end,rec,motionMode===2,dialect.circleCenter||"REL");Object.assign(base,{kind:"arc",cw:motionMode===2,...ag});L=ag.length}else{base.kind="line";L=len(start,end)}base.length=L;motions.push(base);if(motionMode===0)rapidLength+=L;else if(toolOn)cutLength+=L;else rapidLength+=L;pos=end;minX=Math.min(minX,end.x);maxX=Math.max(maxX,end.x);minY=Math.min(minY,end.y);maxY=Math.max(maxY,end.y)}
 }
 if(!motions.length)warnings.push("Keine G0/G1/G2/G3-Bewegungen erkannt.");if(unknown.length)warnings.push(`${unknown.length} M-/G-Befehl(e) sind im geladenen CNCDEF bzw. in der bekannten Referenz nicht beschrieben.`);
 return{schema:"cutai-nc-analysis/0.8.1",fileName,lineCount:lines.length,dialect:{source:dialect.source||"generisch",circleCenter:dialect.circleCenter||"REL",commandCount:Object.keys(dialect.commands||{}).length},motions,events,unknownCommands:unknown,warnings,summary:{motionCount:motions.length,rapidLengthMm:round(rapidLength),cutLengthMm:round(cutLength),toolChanges:events.filter(e=>e.key==="M6").length,bevelCommands:events.filter(e=>["M29","M34","M35","M103","M127"].includes(e.key)).length,thtCommands:events.filter(e=>["M98","M102","M120"].includes(e.key)).length,bounds:{minX:round(minX),minY:round(minY),maxX:round(maxX),maxY:round(maxY)}}};
}
function compare(analysis,cam={}){
 const errors=[],warnings=[],matches=[];if(!analysis)return{ok:false,errors:["Keine NC-Analyse vorhanden."],warnings,matches};
 const nc=analysis.summary||{},cut=Number(cam.cutLengthMm??cam.cut??0),ncCut=Number(nc.cutLengthMm||0);if(cut>0&&ncCut>0){const d=Math.abs(ncCut-cut),pct=d/cut*100;(pct<=2?matches:warnings).push(`Schnittweglänge: CAM ${round(cut)} mm · NC ${round(ncCut)} mm · Abweichung ${round(pct,1)} %`)}else warnings.push("Schnittweglänge kann nicht sinnvoll verglichen werden.");
 if(cam.bounds&&nc.bounds){const cw=cam.bounds.maxX-cam.bounds.minX,ch=cam.bounds.maxY-cam.bounds.minY,nw=nc.bounds.maxX-nc.bounds.minX,nh=nc.bounds.maxY-nc.bounds.minY;const dw=Math.abs(cw-nw),dh=Math.abs(ch-nh);((dw<=1&&dh<=1)?matches:warnings).push(`Abmessungen: CAM ${round(cw)} × ${round(ch)} mm · NC ${round(nw)} × ${round(nh)} mm`)}
 if(cam.bevelCount>0&&nc.bevelCommands===0)errors.push("CAM enthält Fasen, im NC wurden keine bekannten Fasen-/Rotatorbefehle erkannt.");if(cam.thtCount>0&&nc.thtCommands===0)warnings.push("CAM enthält THT/QualityHole, im NC wurde kein bekannter THT-/PowerHole-Befehl erkannt.");if(cam.contourCount>0&&nc.motionCount===0)errors.push("CAM enthält Konturen, NC enthält aber keine erkannte Bewegung.");return{ok:errors.length===0,errors,warnings,matches};
}
window.CutAINCAnalyzer={version:"0.8.1",parseCncDef,analyze,compare,semantic};
})();
