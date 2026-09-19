(()=>{
"use strict";
const TYPE_PROCESS={0:"plasma",1:"plasma",2:"oxyfuel",4:"waterjet",5:"drill",6:"mill",7:"laser",8:"inkjet",9:"3d",105:"drill"};
const MATERIAL_ALIASES={S235:"MST",S235JR:"MST",S355:"MST",S355JR:"MST",STAHL:"MST",BAUSTAHL:"MST",MILDSTEEL:"MST",MST:"MST",EDELSTAHL:"SST",INOX:"SST",STAINLESS:"SST",SST:"SST",ALU:"AL",ALUMINIUM:"AL",ALUMINUM:"AL",AL:"AL"};
function norm(s){return String(s??"").trim()}
function num(v){if(v==null||v==="")return null;const s=String(v).trim().replace(/,(?=\d)/g,".");const m=s.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);return m?Number(m[0]):null}
function materialCode(v){const s=norm(v).toUpperCase().replace(/[^A-Z0-9]/g,"");return MATERIAL_ALIASES[s]||norm(v).toUpperCase()}
function parseIni(text){
 const out={"":{}},order=[""];let sec="";
 for(let raw of String(text||"").replace(/^\uFEFF/,"").split(/\r?\n/)){
  let line=raw.trim();if(!line||line.startsWith(";")||line.startsWith("//"))continue;
  const c1=line.indexOf("//");if(c1>0)line=line.slice(0,c1).trim();
  const sm=line.match(/^\[([^\]]+)\]/);if(sm){sec=sm[1].trim();if(!out[sec]){out[sec]={};order.push(sec)}continue}
  const eq=line.indexOf("=");if(eq<0)continue;const key=line.slice(0,eq).trim(),val=line.slice(eq+1).trim(),bag=out[sec]||(out[sec]={});
  if(Object.prototype.hasOwnProperty.call(bag,key)){if(!Array.isArray(bag[key]))bag[key]=[bag[key]];bag[key].push(val)}else bag[key]=val;
 }
 Object.defineProperty(out,"__order",{value:order,enumerable:false});return out
}
function arr(v){return v==null?[]:Array.isArray(v)?v:[v]}
function slug(s){return norm(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,90)||"station"}
function fnv1a(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,"0")}
function inferMakerModel(file){const f=norm(file).replace(/\\/g,"/");
 if(/HIFO\s*280/i.test(f)||/HIFO280/i.test(f))return{manufacturer:"Kjellberg",model:"HiFocus 280"};
 if(/HIFO\s*160/i.test(f)||/HIFO160/i.test(f))return{manufacturer:"Kjellberg",model:"HiFocus 160"};
 if(/HIFO|HIFOCUS/i.test(f))return{manufacturer:"Kjellberg",model:"HiFocus"};
 if(/FF800|FINEFOCUS\s*800/i.test(f))return{manufacturer:"Kjellberg",model:"FineFocus 800"};
 if(/XPR/i.test(f)){const m=f.match(/XPR[_ -]?(\d+)/i);return{manufacturer:"Hypertherm",model:m?`XPR${m[1]}`:"XPR"}}
 if(/HPR/i.test(f)){const m=f.match(/HPR\s*(\d+)/i);return{manufacturer:"Hypertherm",model:m?`HPR${m[1]}`:"HPR"}}
 if(/HD4070/i.test(f))return{manufacturer:"Hypertherm",model:"HD4070"};
 if(/THERMADYNE/i.test(f))return{manufacturer:"Thermadyne",model:""};
 if(/IPG/i.test(f)){let model="";if(/PROCUTTER/i.test(f))model="IPG ProCutter";else if(/HIGHYAG/i.test(f))model="IPG HighYAG";else if(/3D/i.test(f))model="IPG 3D";else model="IPG";return{manufacturer:"IPG",model}}
 if(/RAYCUS/i.test(f))return{manufacturer:"Raycus",model:""};
 if(/WJ|WATER.?JET/i.test(f))return{manufacturer:"Generisch",model:"WaterJet"};
 if(/GAS|OXY/i.test(f))return{manufacturer:"Generisch",model:"Autogen"};
 if(/DRILL|BORE/i.test(f))return{manufacturer:"Generisch",model:"Bohrspindel"};
 return{manufacturer:"Generisch",model:""}
}
function detectController(paths,machineText){const hay=(paths.join(" ")+" "+String(machineText||"")).toLowerCase();if(/eckelmann|smartfl|p_eckelmann/.test(hay))return"eckelmann";return"imsnc"}
function infoXml(text){const get=t=>{const m=String(text||"").match(new RegExp(`<${t}>([\\s\\S]*?)<\\/${t}>`,"i"));return m?m[1].replace(/&amp;/g,"&").trim():""};return{serial:get("SerialNr"),name:get("Name"),language:get("Language"),dealer:get("Dealer")}}
function getActiveGroup(machine,process){if(process==="plasma")return machine.PARGROUP1||{};if(process==="oxyfuel")return machine.PARGROUP2||machine.PARGROUP2_Gas||{};if(process==="waterjet")return machine.PARGROUP4_WJ||machine.PARGROUP4||{};if(process==="laser")return machine.PARGROUP7_Laser||{};return{}}
function capabilitiesFromGroup(group,process){const text=Object.entries(group||{}).flatMap(([k,v])=>[k,...arr(v)]).join(" ").toLowerCase(),set=new Set();
 if(/straight|gerad|q1|q2|q3|q4|q5/.test(text)||["plasma","laser","oxyfuel","waterjet"].includes(process))set.add("straight");
 if(/beveltop|bct|fase.?oben/.test(text))set.add("bevelTop");
 if(/bevelbottom|bcb|fase.?unten/.test(text))set.add("bevelBottom");
 if(/\bbevel\b|vbc|bcl|bcr/.test(text)){set.add("bevelTop");set.add("bevelBottom")}
 if(/marking|markier|grpm/.test(text))set.add("marking");
 if(/punch|körn|koern|grpmp/.test(text))set.add("punching");
 if(/tht|quality/.test(text))set.add("tht");
 if(/cc_inner|inner/.test(text))set.add("innerCut");
 if(process==="drill")set.add("drilling");if(process==="mill")set.add("milling");return[...set]
}
function stationMode(process,capabilities,filter){const f=norm(filter).toLowerCase(),caps=new Set(capabilities||[]);if(process==="drill")return"spindle";if(process==="plasma"||process==="waterjet")return caps.has("bevelTop")||caps.has("bevelBottom")||/rot|bevel|fase/.test(f)?"rotator_bevel":"vertical";if(process==="laser")return caps.has("bevelTop")||caps.has("bevelBottom")||/bevel|3d|rot/.test(f)?"bevel":"vertical";return"vertical"}
function classifyOperation(p,name){if(num(p.MARKING)===1||num(p.TECHOPERATIONTYPE)===4)return"marking";const op=num(p.TECHOPERATIONTYPE);if(op===16)return"inner";if(op===8193)return"special";return name.toLowerCase()==="param"?"straight":"variant"}
function compactParams(p){const keys=["MATERIAL","HRUBKA","MINTHICKNESS","MAXTHICKNESS","PLASMA_COMMENT","PLPROCESSREM","PLPROCESS","ZELCURR","ZELVOLT","ZELFEED","CC_OUT_SPEED","CC_IN_SPEED","CC_OUT_KERF","CC_IN_KERF","DIAM","PRESSURE","DIERT","STARTT","ZAPH","REZH","DIERH","MARKING","TECHOPERATIONTYPE","TORCHTYPE","PLCONSUMABLES","PLCONSUMABLES_REM","TypePG1","TypePG2","TypePG3","TypePG4","TypeWG1","TypeWG2","PG1","PG2","PG3","PG4","WG1","WG2","NAHRT","O2WPRESS","GASWPRESS","O2CPRESS","O2HPRESS","GASHPRESS","ABRASIVE","ABRWPRESS","HIGHPR","SPINDLEREV","DRILL_DEPTH","ZELFEEDBOREV","ZELFEEDZ","DRILL_STEP1","DRILL_STEP","DRILL_STEP_DWELL","LASERPOWER","POWER","FREQUENCY","FOCUS","FOCUSPOS"];
 const out={};for(const k of keys)if(p[k]!=null&&p[k]!=="")out[k]=p[k];return out
}
function thicknessFromName(name){const m=String(name).match(/(?:Autogen|Gas|MST|SST|AL)[^\d]{0,10}(\d+(?:[.,]\d+)?)(?:\s*mm|[-_ ])/i);return m?num(m[1]):null}
function technologyRecord(path,text,station){const ini=parseIni(text),p=ini.param||ini.PARAM||{},n=ini.NAME||{},file=path.split("/").pop(),ops=[];
 for(const sn of ini.__order||[]){if(!/^param\d*$/i.test(sn))continue;const q=ini[sn]||{};ops.push({section:sn,kind:classifyOperation(q,sn),params:compactParams(q)})}
 const gases=[p.TypePG1,p.TypePG2,p.TypePG3,p.TypePG4,p.TypeWG1,p.TypeWG2].filter(v=>v&&!/nein|none/i.test(v));
 return{id:`${station.id}:${path}`,stationId:station.id,sourceFile:path,fileName:file,process:station.process,manufacturer:station.manufacturer,model:station.model,mode:station.mode,
  material:materialCode(p.MATERIAL||""),thicknessMm:num(p.HRUBKA)??thicknessFromName(file),currentA:num(p.ZELCURR),voltageV:num(p.ZELVOLT),feedMmMin:num(p.ZELFEED),kerfMm:num(p.DIAM)??num(p.CC_OUT_KERF),innerKerfMm:num(p.CC_IN_KERF),cutHeightMm:num(p.REZH),pierceHeightMm:num(p.DIERH),pierceTimeS:num(p.DIERT),startTimeS:num(p.STARTT),preheatTimeS:num(p.NAHRT),pressureBar:num(p.PRESSURE),gases:[...new Set(gases)],comment:n.NAME||p.PLASMA_COMMENT||p.REM||"",operations:ops,params:compactParams(p)}
}
function paramSchema(text){const ini=parseIni(text),p=ini.PARAM||ini.param||{},rows=[];for(const v of Object.values(p).flatMap(arr)){const m=String(v).match(/^([^,]+),([^,]+),([^,]+)(?:,(.+))?$/);if(m)rows.push({key:m[1].trim(),type:m[2].trim(),label:m[3].trim(),unit:(m[4]||"").trim()})}return rows}
function findToolDefinitionPath(paths,defFile){if(!defFile)return null;const low=defFile.toLowerCase();let p=paths.find(x=>x.toLowerCase().endsWith(`/ini/${low}`)||x.toLowerCase()===`ini/${low}`||x.toLowerCase().endsWith(`/${low}`)||x.toLowerCase()===low);if(p)return p;const alias=low.replace(/\.ini$/i,"");p=paths.find(x=>x.toLowerCase().endsWith(`/ini/toolset_${alias}.ini`)||x.toLowerCase()===`ini/toolset_${alias}.ini`);if(p)return p;if(/^plasma_/i.test(defFile))return paths.find(x=>x.toLowerCase().endsWith(`/ini/toolset_${low}.ini`)||x.toLowerCase()===`ini/toolset_${low}.ini`)||null;return null}
function identitySignature(mi,controllerId,stations){const stable={serial:mi.serial||"",name:mi.name||"",controllerId,stations:(stations||[]).map(s=>({process:s.process,manufacturer:s.manufacturer,model:s.model,mode:s.mode,toolNumber:s.toolNumber,definition:s.toolDefinitionFile})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))};return fnv1a(JSON.stringify(stable))}
async function fromZipArrayBuffer(buffer,{name="Maschinen-Snapshot"}={}){
 if(!window.JSZip)throw new Error("ZIP-Modul ist nicht geladen.");const zip=await window.JSZip.loadAsync(buffer);const paths=Object.keys(zip.files).filter(p=>!zip.files[p].dir),find=re=>paths.find(p=>re.test(p.replace(/\\/g,"/"))),read=async p=>p?zip.files[p].async("string"):"";
 const machinePath=find(/\/Ini\/machine\.ini$/i)||find(/(^|\/)ini\/machine\.ini$/i)||find(/(^|\/)machine\.ini$/i);if(!machinePath)throw new Error("Keine machine.ini im Snapshot gefunden.");
 const machineText=await read(machinePath),machine=parseIni(machineText),machInfoPath=find(/\/MachInfo\.xml$/i)||find(/(^|\/)machinfo\.xml$/i),mi=infoXml(await read(machInfoPath)),controllerId=detectController(paths,machineText),stations=[],byKey=new Map(),diagnostics=[];
 for(const secName of machine.__order||[]){if(!/^TOOLSTACK\d+$/i.test(secName))continue;const sec=machine[secName]||{},n=Math.max(Number(sec.NTOOLS)||20,20);for(let i=0;i<n;i++){
  const tv=sec[`TOOL${i}`],fv=sec[`FILTER${i}`];if(tv==null&&fv==null)continue;const tool=String(tv||"").split(","),filter=String(fv||"").split(","),toolNo=Number(tool[0])||null,typeM=String(filter[0]||"").match(/TYPE\s*=\s*(\d+)/i),typeCode=typeM?Number(typeM[1]):null,defFile=norm(filter[1]||""),process=TYPE_PROCESS[typeCode]||TYPE_PROCESS[Number(sec.TYPE)]||"unknown";if(process==="unknown")continue;
  const maker=inferMakerModel(defFile),caps=capabilitiesFromGroup(getActiveGroup(machine,process),process),mode=stationMode(process,caps,defFile),key=`${process}|${toolNo||""}|${defFile.toLowerCase()}`;
  if(byKey.has(key)){const ex=byKey.get(key);if(!ex.toolStacks.includes(secName))ex.toolStacks.push(secName);ex.magazineSlots=Math.max(ex.magazineSlots||1,process==="drill"?(Number(sec.NTOOLS)||1):1);continue}
  let id=slug(`${mi.serial||"machine"}-${process}-${toolNo||i}-${maker.manufacturer}-${maker.model}`),base=id,k=2;while(stations.some(s=>s.id===id))id=`${base}-${k++}`;
  const st={id,label:`${process} · ${maker.manufacturer}${maker.model?` ${maker.model}`:""}`,process,manufacturer:maker.manufacturer,model:maker.model,mode,enabled:true,toolNumber:toolNo,toolStack:secName,toolStacks:[secName],toolDefinitionFile:defFile,magazineSlots:process==="drill"?Number(sec.NTOOLS)||1:1,capabilities:caps};stations.push(st);byKey.set(key,st)
 }}
 const catalog=[],schemas={},sourceToolFiles={};for(const st of stations){const p=findToolDefinitionPath(paths,st.toolDefinitionFile);if(p){sourceToolFiles[st.id]=p;try{schemas[st.id]=paramSchema(await read(p))}catch{}}else if(st.toolDefinitionFile)diagnostics.push(`Werkzeugdefinition nicht direkt gefunden: ${st.toolDefinitionFile}`);if(!st.toolNumber)continue;const re=new RegExp(`(?:^|/)Tools/T${st.toolNumber}/[^/]+\\.ini$`,"i");for(const pth of paths.filter(x=>re.test(x.replace(/\\/g,"/")))){try{catalog.push(technologyRecord(pth.replace(/\\/g,"/"),await read(pth),st))}catch{}}}
 for(const st of stations){const own=catalog.filter(x=>x.stationId===st.id);st.technologyCount=own.length;if(st.manufacturer==="Hypertherm"&&st.model==="XPR"){const counts={};for(const x of own){const m=String(x.fileName||"").match(/XPR[_ -]?(\d+)/i);if(m)counts[m[1]]=(counts[m[1]]||0)+1}const best=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];if(best)st.model=`XPR${best[0]}`}st.label=`${st.process} · ${st.manufacturer}${st.model?` ${st.model}`:""}`;if(!st.technologyCount)diagnostics.push(`${st.label}: keine Tools/T${st.toolNumber||"?"}-Technologie-INIs gefunden.`)}
 const signature=identitySignature(mi,controllerId,stations),cncdef=find(/(^|\/)CNCDEF\.INI$/i),m607=find(/(^|\/)M607\.PAR$/i),toolIni=find(/(^|\/)TOOL\.INI$/i)||find(/(^|\/)TOOL_MNC\d+\.INI$/i);
 let ncDialect=null;if(cncdef&&window.CutAINCAnalyzer?.parseCncDef){try{ncDialect=window.CutAINCAnalyzer.parseCncDef(await read(cncdef))}catch(e){diagnostics.push(`CNCDEF konnte nicht als NC-Dialekt gelesen werden: ${e.message||e}`)}}
 return{schema:"cutai-machine-package/0.8.1",id:slug(mi.serial?`machine-${mi.serial}`:name),signature,name:mi.name||name,serial:mi.serial||"",controllerId,source:"local-zip",stations,technologyCatalog:catalog,toolSchemas:schemas,ncDialect,diagnostics,stats:{stationCount:stations.length,technologyCount:catalog.length,materials:[...new Set(catalog.map(x=>x.material).filter(Boolean))].sort(),sourceFileCount:paths.length},sourceFiles:{machine:machinePath,machInfo:machInfoPath||null,cncdef:cncdef||null,m607:m607||null,toolIni:toolIni||null,toolDefinitions:sourceToolFiles}}
}
async function fromZipFile(file){return fromZipArrayBuffer(await file.arrayBuffer(),{name:file.name})}
function candidates(pkg,q={}){let xs=[...(pkg?.technologyCatalog||[])];if(q.stationId)xs=xs.filter(x=>x.stationId===q.stationId);if(q.process)xs=xs.filter(x=>x.process===q.process);if(q.manufacturer)xs=xs.filter(x=>String(x.manufacturer).toLowerCase().includes(String(q.manufacturer).toLowerCase()));if(q.material)xs=xs.filter(x=>x.material===materialCode(q.material));if(q.thicknessMm!=null)xs=xs.filter(x=>x.thicknessMm!=null&&Math.abs(x.thicknessMm-Number(q.thicknessMm))<.001);if(q.currentA!=null)xs=xs.filter(x=>x.currentA!=null&&Math.abs(x.currentA-Number(q.currentA))<.001);if(q.fileName)xs=xs.filter(x=>String(x.fileName).toLowerCase().includes(String(q.fileName).toLowerCase()));return xs}
function safeContext(pkg,{includeTechnologies=false,limit=120}={}){if(!pkg)return null;const base={id:pkg.id,signature:pkg.signature,name:pkg.name,serial:pkg.serial,controllerId:pkg.controllerId,stations:(pkg.stations||[]).map(s=>({id:s.id,label:s.label,process:s.process,manufacturer:s.manufacturer,model:s.model,mode:s.mode,toolNumber:s.toolNumber,magazineSlots:s.magazineSlots,capabilities:s.capabilities||[],technologyCount:s.technologyCount||0})),stats:pkg.stats};if(includeTechnologies)base.technologies=(pkg.technologyCatalog||[]).slice(0,limit).map(x=>({id:x.id,stationId:x.stationId,fileName:x.fileName,process:x.process,manufacturer:x.manufacturer,model:x.model,mode:x.mode,material:x.material,thicknessMm:x.thicknessMm,currentA:x.currentA,voltageV:x.voltageV,feedMmMin:x.feedMmMin,kerfMm:x.kerfMm,cutHeightMm:x.cutHeightMm,pierceHeightMm:x.pierceHeightMm,pierceTimeS:x.pierceTimeS,gases:x.gases}));return base}
window.CutAIMachinePackage={version:"0.8.1",parseIni,materialCode,fromZipArrayBuffer,fromZipFile,candidates,safeContext};
})();
