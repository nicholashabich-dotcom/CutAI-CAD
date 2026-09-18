(function(root,factory){
  if(typeof module==="object"&&module.exports) module.exports=factory();
  else root.CutAICore=factory();
})(typeof self!=="undefined"?self:this,function(){
  "use strict";
  const EPS=1e-9;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const round=(v,n=6)=>Math.round(v*10**n)/10**n;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const near=(a,b,tol=.05)=>dist(a,b)<=tol;
  const normAngle=a=>{a%=Math.PI*2;if(a<0)a+=Math.PI*2;return a};
  const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI;

  function segStart(s){return s.type==="line"?{x:s.x1,y:s.y1}:{x:s.sx,y:s.sy}}
  function segEnd(s){return s.type==="line"?{x:s.x2,y:s.y2}:{x:s.ex,y:s.ey}}
  function reverseSegment(s){
    if(s.type==="line") return {...s,x1:s.x2,y1:s.y2,x2:s.x1,y2:s.y1};
    if(s.type==="arc") return {...s,sx:s.ex,sy:s.ey,ex:s.sx,ey:s.sy,cw:!s.cw};
    return {...s};
  }
  function translateSegment(s,dx,dy){
    if(s.type==="line") return {...s,x1:s.x1+dx,y1:s.y1+dy,x2:s.x2+dx,y2:s.y2+dy};
    if(s.type==="arc") return {...s,cx:s.cx+dx,cy:s.cy+dy,sx:s.sx+dx,sy:s.sy+dy,ex:s.ex+dx,ey:s.ey+dy};
    return {...s};
  }
  function makeArc(cx,cy,r,startDeg,endDeg,cw=true,layer="0"){
    const a1=rad(startDeg),a2=rad(endDeg);
    return {type:"arc",cx,cy,r:Math.abs(r),sx:cx+Math.abs(r)*Math.cos(a1),sy:cy+Math.abs(r)*Math.sin(a1),ex:cx+Math.abs(r)*Math.cos(a2),ey:cy+Math.abs(r)*Math.sin(a2),cw,layer};
  }
  function arcAngles(s){
    return {a1:normAngle(Math.atan2(s.sy-s.cy,s.sx-s.cx)),a2:normAngle(Math.atan2(s.ey-s.cy,s.ex-s.cx))};
  }
  function arcSweep(s){
    const {a1,a2}=arcAngles(s);
    return s.cw?normAngle(a2-a1):normAngle(a1-a2);
  }
  function angleOnArc(s,a,tol=1e-7){
    const {a1}=arcAngles(s),sw=arcSweep(s),aa=normAngle(a);
    const d=s.cw?normAngle(aa-a1):normAngle(a1-aa);
    return d<=sw+tol;
  }
  function arcPoint(s,t){
    const {a1}=arcAngles(s),sw=arcSweep(s),a=s.cw?a1+sw*t:a1-sw*t;
    return {x:s.cx+s.r*Math.cos(a),y:s.cy+s.r*Math.sin(a)};
  }

  function chainSegments(segments,tol=.05){
    const unused=segments.map((s,i)=>({s:{...s},i}));
    const chains=[];
    while(unused.length){
      const seed=unused.shift();
      const chain=[seed.s];
      let changed=true;
      while(changed&&unused.length){
        changed=false;
        const start=segStart(chain[0]),end=segEnd(chain[chain.length-1]);
        for(let i=0;i<unused.length;i++){
          const c=unused[i].s,cs=segStart(c),ce=segEnd(c);
          if(near(end,cs,tol)){chain.push(c);unused.splice(i,1);changed=true;break}
          if(near(end,ce,tol)){chain.push(reverseSegment(c));unused.splice(i,1);changed=true;break}
          if(near(start,ce,tol)){chain.unshift(c);unused.splice(i,1);changed=true;break}
          if(near(start,cs,tol)){chain.unshift(reverseSegment(c));unused.splice(i,1);changed=true;break}
        }
      }
      let closed=false;
      if(chain.length&&near(segStart(chain[0]),segEnd(chain[chain.length-1]),tol)){
        closed=true;
        const p=segStart(chain[0]),last=chain[chain.length-1];
        if(last.type==="line"){last.x2=p.x;last.y2=p.y}
        else {last.ex=p.x;last.ey=p.y}
      }
      chains.push({segments:chain,closed});
    }
    return chains;
  }

  function contourSamplePoints(c,maxArcStepDeg=10){
    if(c.geometry.kind==="circle"){
      const pts=[];for(let i=0;i<36;i++){const a=i/36*Math.PI*2;pts.push({x:c.geometry.cx+c.geometry.r*Math.cos(a),y:c.geometry.cy+c.geometry.r*Math.sin(a)})}return pts;
    }
    const pts=[];
    for(const s of c.geometry.segments||[]){
      if(!pts.length) pts.push(segStart(s));
      if(s.type==="line") pts.push(segEnd(s));
      else if(s.type==="arc"){
        const n=Math.max(2,Math.ceil(deg(arcSweep(s))/maxArcStepDeg));
        for(let i=1;i<=n;i++) pts.push(arcPoint(s,i/n));
      }
    }
    return pts;
  }
  function contourBounds(c){
    if(c.geometry.kind==="circle") return {minX:c.geometry.cx-c.geometry.r,minY:c.geometry.cy-c.geometry.r,maxX:c.geometry.cx+c.geometry.r,maxY:c.geometry.cy+c.geometry.r};
    const pts=contourSamplePoints(c,5);if(!pts.length)return{minX:0,minY:0,maxX:0,maxY:0};
    return {minX:Math.min(...pts.map(p=>p.x)),minY:Math.min(...pts.map(p=>p.y)),maxX:Math.max(...pts.map(p=>p.x)),maxY:Math.max(...pts.map(p=>p.y))};
  }
  function contourArea(c){
    if(c.geometry.kind==="circle") return Math.PI*c.geometry.r*c.geometry.r;
    if(!c.closed) return 0;
    const pts=contourSamplePoints(c,5);let a=0;
    for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];a+=p.x*q.y-q.x*p.y}
    return Math.abs(a/2);
  }
  function contourLength(c){
    if(c.geometry.kind==="circle") return Math.PI*2*c.geometry.r;
    let total=0;
    for(const s of c.geometry.segments||[]){
      if(s.type==="line") total+=Math.hypot(s.x2-s.x1,s.y2-s.y1);
      else if(s.type==="arc") total+=Math.abs(s.r*arcSweep(s));
    }
    return total;
  }
  function pointInPolygon(pt,pts){
    let inside=false;
    for(let i=0,j=pts.length-1;i<pts.length;j=i++){
      const a=pts[i],b=pts[j];
      const cross=((a.y>pt.y)!=(b.y>pt.y))&&(pt.x<(b.x-a.x)*(pt.y-a.y)/((b.y-a.y)||EPS)+a.x);
      if(cross)inside=!inside;
    }
    return inside;
  }
  function pointInContour(pt,c){
    if(!c.closed)return false;
    if(c.geometry.kind==="circle")return dist(pt,{x:c.geometry.cx,y:c.geometry.cy})<c.geometry.r-EPS;
    return pointInPolygon(pt,contourSamplePoints(c,5));
  }
  function contourCentroid(c){
    if(c.geometry.kind==="circle")return{x:c.geometry.cx,y:c.geometry.cy};
    const pts=contourSamplePoints(c,5);if(!pts.length)return{x:0,y:0};
    return{x:pts.reduce((a,p)=>a+p.x,0)/pts.length,y:pts.reduce((a,p)=>a+p.y,0)/pts.length};
  }
  function nestingDepth(c,all){
    if(!c.closed)return 0;const p=contourCentroid(c);let d=0;
    for(const other of all){if(other===c||!other.closed)continue;if(contourArea(other)<=contourArea(c)+EPS)continue;if(pointInContour(p,other))d++}
    return d;
  }
  function autoClassify(contours){
    return contours.map(c=>({id:c.id,depth:nestingDepth(c,contours),type:!c.closed?"none":nestingDepth(c,contours)%2?"inside":"outside",area:contourArea(c)}));
  }

  function nearestOnLine(p,s){
    const vx=s.x2-s.x1,vy=s.y2-s.y1,l2=vx*vx+vy*vy;
    const t=l2?clamp(((p.x-s.x1)*vx+(p.y-s.y1)*vy)/l2,0,1):0;
    const q={x:s.x1+vx*t,y:s.y1+vy*t};return{...q,d:dist(p,q),t};
  }
  function nearestOnArc(p,s){
    let a=Math.atan2(p.y-s.cy,p.x-s.cx);let q={x:s.cx+s.r*Math.cos(a),y:s.cy+s.r*Math.sin(a)};
    if(!angleOnArc(s,a)){
      const ps=segStart(s),pe=segEnd(s);q=dist(p,ps)<=dist(p,pe)?ps:pe;a=Math.atan2(q.y-s.cy,q.x-s.cx);
    }
    return{...q,d:dist(p,q),angle:a};
  }
  function nearestPointOnContour(p,c){
    if(c.geometry.kind==="circle"){
      const a=Math.atan2(p.y-c.geometry.cy,p.x-c.geometry.cx),q={x:c.geometry.cx+c.geometry.r*Math.cos(a),y:c.geometry.cy+c.geometry.r*Math.sin(a)};
      return{...q,d:dist(p,q),segmentIndex:0,angle:a};
    }
    let best=null;(c.geometry.segments||[]).forEach((s,i)=>{const q=s.type==="line"?nearestOnLine(p,s):nearestOnArc(p,s);if(!best||q.d<best.d)best={...q,segmentIndex:i}});return best;
  }
  function translateContour(c,dx,dy){
    const out=JSON.parse(JSON.stringify(c));
    if(out.geometry.kind==="circle"){out.geometry.cx+=dx;out.geometry.cy+=dy}
    else out.geometry.segments=out.geometry.segments.map(s=>translateSegment(s,dx,dy));
    if(out.cam&&out.cam.startPoint){out.cam.startPoint.x+=dx;out.cam.startPoint.y+=dy}
    return out;
  }


  function circleToSegments(g){
    const pts=[0,90,180,270,360];
    return pts.slice(0,-1).map((a,i)=>makeArc(g.cx,g.cy,g.r,a,pts[i+1],true));
  }
  function splitSegmentAtPoint(s,p){
    if(s.type==="line"){
      const q=nearestOnLine(p,s),a=segStart(s),b=segEnd(s);
      if(near(q,a,1e-6))return{point:{x:a.x,y:a.y},before:null,after:{...s}};
      if(near(q,b,1e-6))return{point:{x:b.x,y:b.y},before:{...s},after:null};
      return{point:{x:q.x,y:q.y},before:{...s,x2:q.x,y2:q.y},after:{...s,x1:q.x,y1:q.y}};
    }
    if(s.type==="arc"){
      const q=nearestOnArc(p,s),a=segStart(s),b=segEnd(s);
      if(near(q,a,1e-6))return{point:{x:a.x,y:a.y},before:null,after:{...s}};
      if(near(q,b,1e-6))return{point:{x:b.x,y:b.y},before:{...s},after:null};
      return{point:{x:q.x,y:q.y},before:{...s,ex:q.x,ey:q.y},after:{...s,sx:q.x,sy:q.y}};
    }
    return null;
  }
  function splitContourGeometryAtPoint(c,p){
    let segs,wasClosed=!!c.closed;
    if(c.geometry.kind==="circle"){segs=circleToSegments(c.geometry);wasClosed=true}
    else segs=(c.geometry.segments||[]).map(s=>({...s}));
    if(!segs.length)return null;
    let best=null;
    for(let i=0;i<segs.length;i++){
      const q=segs[i].type==="line"?nearestOnLine(p,segs[i]):nearestOnArc(p,segs[i]);
      if(!best||q.d<best.d)best={...q,index:i};
    }
    if(!best)return null;
    const i=best.index,cut=splitSegmentAtPoint(segs[i],best);
    if(!cut)return null;
    const q=cut.point;
    if(wasClosed){
      let ordered;
      if(!cut.before) ordered=[...segs.slice(i),...segs.slice(0,i)];
      else if(!cut.after) ordered=[...segs.slice(i+1),...segs.slice(0,i+1)];
      else ordered=[cut.after,...segs.slice(i+1),...segs.slice(0,i),cut.before];
      return{mode:"open-loop",point:q,parts:[{geometry:{kind:"segments",segments:ordered},closed:false}]};
    }
    let left,right;
    if(!cut.before){
      if(i===0)return null;
      left=segs.slice(0,i);right=segs.slice(i);
    }else if(!cut.after){
      if(i===segs.length-1)return null;
      left=segs.slice(0,i+1);right=segs.slice(i+1);
    }else{
      left=[...segs.slice(0,i),cut.before];
      right=[cut.after,...segs.slice(i+1)];
    }
    if(!left.length||!right.length)return null;
    return{mode:"split",point:q,parts:[
      {geometry:{kind:"segments",segments:left},closed:false},
      {geometry:{kind:"segments",segments:right},closed:false}
    ]};
  }

  function parsePairs(text){const lines=text.replace(/\r/g,"").split("\n"),pairs=[];for(let i=0;i+1<lines.length;i+=2)pairs.push([lines[i].trim(),lines[i+1].trim()]);return pairs}
  function groupMap(data){const g={};for(const[c,v]of data){(g[c]||(g[c]=[])).push(v)}return g}
  function getNum(g,c,i=0,def=0){const v=Number.parseFloat(g[c]?.[i]);return Number.isFinite(v)?v:def}
  function dxfArcFromData(data){
    const g=groupMap(data),cx=getNum(g,"10"),cy=-getNum(g,"20"),r=Math.abs(getNum(g,"40")),sd=getNum(g,"50"),ed=getNum(g,"51"),layer=g["8"]?.[0]||"0";
    const srad=rad(sd),erad=rad(ed);
    return{type:"arc",cx,cy,r,sx:cx+r*Math.cos(srad),sy:cy-r*Math.sin(srad),ex:cx+r*Math.cos(erad),ey:cy-r*Math.sin(erad),cw:true,layer};
  }
  function dxfLineFromData(data){const g=groupMap(data);return{type:"line",x1:getNum(g,"10"),y1:-getNum(g,"20"),x2:getNum(g,"11"),y2:-getNum(g,"21"),layer:g["8"]?.[0]||"0"}}
  function dxfCircleFromData(data){const g=groupMap(data);return{kind:"circle",cx:getNum(g,"10"),cy:-getNum(g,"20"),r:Math.abs(getNum(g,"40")),layer:g["8"]?.[0]||"0"}}
  function verticesFromLW(data){
    const g=groupMap(data),xs=g["10"]||[],ys=g["20"]||[],pts=[];for(let i=0;i<Math.min(xs.length,ys.length);i++)pts.push({x:Number(xs[i])||0,y:-(Number(ys[i])||0)});return{pts,closed:(getNum(g,"70")&1)!==0,layer:g["8"]?.[0]||"0"}
  }
  function pointsToSegments(pts,closed,layer){const segs=[];for(let i=0;i<pts.length-1;i++)segs.push({type:"line",x1:pts[i].x,y1:pts[i].y,x2:pts[i+1].x,y2:pts[i+1].y,layer});if(closed&&pts.length>2)segs.push({type:"line",x1:pts[pts.length-1].x,y1:pts[pts.length-1].y,x2:pts[0].x,y2:pts[0].y,layer});return segs}
  function parseDxf(text,tol=.05){
    const p=parsePairs(text),ready=[],rawByLayer=new Map();let i=0,inEntities=false;
    const addRaw=s=>{const l=s.layer||"0";if(!rawByLayer.has(l))rawByLayer.set(l,[]);rawByLayer.get(l).push(s)};
    while(i<p.length){const[c,v]=p[i];
      if(c==="0"&&v==="SECTION"&&p[i+1]?.[0]==="2"&&p[i+1]?.[1]==="ENTITIES"){inEntities=true;i+=2;continue}
      if(inEntities&&c==="0"&&v==="ENDSEC")break;
      if(!inEntities){i++;continue}
      if(c!=="0"){i++;continue}
      const type=v;i++;
      if(type==="POLYLINE"){
        const header=[];while(i<p.length&&p[i][0]!=="0")header.push(p[i++]);const hg=groupMap(header),layer=hg["8"]?.[0]||"0",closed=(getNum(hg,"70")&1)!==0,pts=[];
        while(i<p.length){const[t0,tv]=p[i];if(t0!=="0"){i++;continue}if(tv==="VERTEX"){i++;const vd=[];while(i<p.length&&p[i][0]!=="0")vd.push(p[i++]);const vg=groupMap(vd);pts.push({x:getNum(vg,"10"),y:-getNum(vg,"20")});continue}if(tv==="SEQEND"){i++;while(i<p.length&&p[i][0]!=="0")i++;break}break}
        if(pts.length>=2)ready.push({geometry:{kind:"segments",segments:pointsToSegments(pts,closed,layer)},closed,sourceLayer:layer});continue;
      }
      const data=[];while(i<p.length&&p[i][0]!=="0")data.push(p[i++]);
      if(type==="LINE")addRaw(dxfLineFromData(data));
      else if(type==="ARC")addRaw(dxfArcFromData(data));
      else if(type==="CIRCLE"){const q=dxfCircleFromData(data);ready.push({geometry:{kind:"circle",cx:q.cx,cy:q.cy,r:q.r},closed:true,sourceLayer:q.layer})}
      else if(type==="LWPOLYLINE"){const q=verticesFromLW(data);if(q.pts.length>=2)ready.push({geometry:{kind:"segments",segments:pointsToSegments(q.pts,q.closed,q.layer)},closed:q.closed,sourceLayer:q.layer})}
    }
    for(const[layer,segs]of rawByLayer){for(const ch of chainSegments(segs,tol))ready.push({geometry:{kind:"segments",segments:ch.segments},closed:ch.closed,sourceLayer:layer})}
    return ready;
  }

  const dxfPair=(c,v)=>`${c}\n${v}\n`,fmt=v=>String(round(v,6));
  function layerSafe(v){return(String(v||"CUTAI").replace(/[^A-Za-z0-9_\-.$]/g,"_").slice(0,120)||"CUTAI")}
  function dxfLine(s,l){return dxfPair(0,"LINE")+dxfPair(8,l)+dxfPair(10,fmt(s.x1))+dxfPair(20,fmt(-s.y1))+dxfPair(30,0)+dxfPair(11,fmt(s.x2))+dxfPair(21,fmt(-s.y2))+dxfPair(31,0)}
  function dxfArc(s,l){
    let a1=deg(Math.atan2(-(s.sy-s.cy),s.sx-s.cx)),a2=deg(Math.atan2(-(s.ey-s.cy),s.ex-s.cx));a1=(a1+360)%360;a2=(a2+360)%360;
    if(!s.cw){const t=a1;a1=a2;a2=t}
    return dxfPair(0,"ARC")+dxfPair(8,l)+dxfPair(10,fmt(s.cx))+dxfPair(20,fmt(-s.cy))+dxfPair(30,0)+dxfPair(40,fmt(s.r))+dxfPair(50,fmt(a1))+dxfPair(51,fmt(a2));
  }
  function dxfCircle(g,l){return dxfPair(0,"CIRCLE")+dxfPair(8,l)+dxfPair(10,fmt(g.cx))+dxfPair(20,fmt(-g.cy))+dxfPair(30,0)+dxfPair(40,fmt(g.r))}
  function lineOnlyPolyline(c){return c.geometry.kind==="segments"&&(c.geometry.segments||[]).every(s=>s.type==="line")}
  function dxfPolyline(c,l){
    const segs=c.geometry.segments,pts=[segStart(segs[0]),...segs.map(segEnd)];if(c.closed&&near(pts[0],pts[pts.length-1],1e-6))pts.pop();
    let o=dxfPair(0,"POLYLINE")+dxfPair(8,l)+dxfPair(66,1)+dxfPair(70,c.closed?1:0);
    for(const p of pts)o+=dxfPair(0,"VERTEX")+dxfPair(8,l)+dxfPair(10,fmt(p.x))+dxfPair(20,fmt(-p.y))+dxfPair(30,0);
    return o+dxfPair(0,"SEQEND");
  }
  function makeDxf(contours,layerFn){
    const ls=[...new Set(contours.map((c,i)=>layerSafe(layerFn?layerFn(c,i):c.sourceLayer||"CUTAI")))];
    let o=dxfPair(0,"SECTION")+dxfPair(2,"HEADER")+dxfPair(9,"$ACADVER")+dxfPair(1,"AC1009")+dxfPair(0,"ENDSEC")+dxfPair(0,"SECTION")+dxfPair(2,"TABLES")+dxfPair(0,"TABLE")+dxfPair(2,"LAYER")+dxfPair(70,ls.length);
    for(const l of ls)o+=dxfPair(0,"LAYER")+dxfPair(2,l)+dxfPair(70,0)+dxfPair(62,7)+dxfPair(6,"CONTINUOUS");
    o+=dxfPair(0,"ENDTAB")+dxfPair(0,"ENDSEC")+dxfPair(0,"SECTION")+dxfPair(2,"ENTITIES");
    contours.forEach((c,i)=>{const l=layerSafe(layerFn?layerFn(c,i):c.sourceLayer||"CUTAI");if(c.geometry.kind==="circle")o+=dxfCircle(c.geometry,l);else if(lineOnlyPolyline(c))o+=dxfPolyline(c,l);else for(const s of c.geometry.segments||[])o+=s.type==="line"?dxfLine(s,l):dxfArc(s,l)});
    return o+dxfPair(0,"ENDSEC")+dxfPair(0,"EOF");
  }

  function validateProject(project){
    const warnings=[],errors=[];const limit=Number(project.machineProfile?.bevelAngleLimitDeg??50);
    for(const c of project.contours||[]){const label=c.name||c.id||"Kontur";const role=c.cam?.tool?.role||"cut";
      if(role==="cut"&&!c.closed&&!c.chainClosed)warnings.push(`${label}: offene Kontur mit Schneidwerkzeug.`);
      if(role==="cut"&&c.closed&&!c.cam?.startPoint)warnings.push(`${label}: kein Startpunkt gesetzt.`);
      const kerf=Number(c.cam?.kerfMm??0);if(!Number.isFinite(kerf)||kerf<0)errors.push(`${label}: ungültige Schnittfuge.`);
      if(c.cam?.bevel?.enabled){
        const faces=(c.cam.bevel.faces||[]).filter(f=>f&&f.enabled);
        if(faces.length>4)errors.push(`${label}: mehr als vier aktive Fasenflächen.`);
        for(const [i,f] of (c.cam.bevel.faces||[]).entries()){if(Math.abs(Number(f.angleDeg)||0)>limit+EPS)errors.push(`${label}: Fasenfläche ${i+1} überschreitet ${limit}°.`)}
        if(c.cam.bevel.variable&&c.cam?.tool?.canVariableBevel===false)warnings.push(`${label}: variable Fase gewählt, Werkzeug meldet CanVarBev=0.`);
        if(c.cam?.tool?.rotationType===0&&faces.some(f=>Math.abs(Number(f.angleDeg)||0)>EPS))warnings.push(`${label}: Fasenwinkel gesetzt, Werkzeug meldet RotType=0.`);
      }
      if(c.cam?.tool?.supportsTHT&&role!=="cut")warnings.push(`${label}: THT-fähiges Werkzeug ist nicht als Schneidwerkzeug klassifiziert.`);
      if(!c.cam?.tool?.code)warnings.push(`${label}: kein Werkzeugcode.`);
    }
    const orders=(project.contours||[]).map(c=>Number(c.cam?.order)||0).filter(Boolean);const dup=orders.filter((x,i,a)=>a.indexOf(x)!==i);if(dup.length)warnings.push(`Doppelte Schnittreihenfolge: ${[...new Set(dup)].join(", ")}.`);
    return{ok:errors.length===0,errors,warnings};
  }

  return{clamp,round,dist,near,normAngle,rad,deg,segStart,segEnd,reverseSegment,translateSegment,makeArc,arcAngles,arcSweep,angleOnArc,arcPoint,chainSegments,contourSamplePoints,contourBounds,contourArea,contourLength,pointInContour,contourCentroid,nestingDepth,autoClassify,nearestPointOnContour,translateContour,circleToSegments,splitSegmentAtPoint,splitContourGeometryAtPoint,parseDxf,makeDxf,validateProject};
});
