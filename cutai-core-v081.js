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

  function parsePairs(text){
    const src=String(text||"").replace(/^\uFEFF/,"").replace(/\u0000/g,"").replace(/\r\n?/g,"\n"),lines=src.split("\n"),pairs=[];
    let i=0;
    while(i+1<lines.length){
      const code=lines[i].trim();
      if(!/^-?\d+$/.test(code)){i++;continue}
      const value=lines[i+1].trim();
      pairs.push([String(Number.parseInt(code,10)),value]);
      i+=2;
    }
    return pairs;
  }
  function groupMap(data){const g={};for(const[c,v]of data){(g[c]||(g[c]=[])).push(v)}return g}
  function getNum(g,c,i=0,def=0){const v=Number.parseFloat(g[c]?.[i]);return Number.isFinite(v)?v:def}
  function pairNum(data,code,def=0){for(const[c,v]of data)if(c===String(code)){const n=Number.parseFloat(v);return Number.isFinite(n)?n:def}return def}
  function pairText(data,code,def=""){for(const[c,v]of data)if(c===String(code))return v;return def}
  function dxfPoint(x,y){return{x:Number(x)||0,y:-(Number(y)||0)}}
  function dxfArcFromData(data){
    const g=groupMap(data),cx=getNum(g,"10"),cy=-getNum(g,"20"),r=Math.abs(getNum(g,"40")),sd=getNum(g,"50"),ed=getNum(g,"51"),layer=g["8"]?.[0]||"0";
    const srad=rad(sd),erad=rad(ed);
    return{type:"arc",cx,cy,r,sx:cx+r*Math.cos(srad),sy:cy-r*Math.sin(srad),ex:cx+r*Math.cos(erad),ey:cy-r*Math.sin(erad),cw:false,layer};
  }
  function dxfLineFromData(data){const g=groupMap(data);return{type:"line",x1:getNum(g,"10"),y1:-getNum(g,"20"),x2:getNum(g,"11"),y2:-getNum(g,"21"),layer:g["8"]?.[0]||"0"}}
  function dxfCircleFromData(data){const g=groupMap(data);return{kind:"circle",cx:getNum(g,"10"),cy:-getNum(g,"20"),r:Math.abs(getNum(g,"40")),layer:g["8"]?.[0]||"0"}}
  function bulgeArc(p1,p2,bulge,layer="0"){
    const b=Number(bulge)||0;if(Math.abs(b)<1e-12)return{type:"line",x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,layer};
    const bc=-b,dx=p2.x-p1.x,dy=p2.y-p1.y,ch=Math.hypot(dx,dy);if(ch<EPS)return null;
    const theta=4*Math.atan(bc),mid={x:(p1.x+p2.x)/2,y:(p1.y+p2.y)/2},off=ch/(2*Math.tan(theta/2)),nx=-dy/ch,ny=dx/ch,cx=mid.x+nx*off,cy=mid.y+ny*off,r=Math.hypot(p1.x-cx,p1.y-cy);
    return{type:"arc",cx,cy,r,sx:p1.x,sy:p1.y,ex:p2.x,ey:p2.y,cw:theta>0,layer};
  }
  function lwVertices(data){
    const layer=pairText(data,"8","0"),closed=(Math.trunc(pairNum(data,"70",0))&1)!==0,verts=[];let current=null;
    for(let i=0;i<data.length;i++){
      const[c,v]=data[i];
      if(c==="10"){
        if(current)verts.push(current);
        current={x:Number.parseFloat(v)||0,y:0,bulge:0};
      }else if(c==="20"&&current)current.y=-(Number.parseFloat(v)||0);
      else if(c==="42"&&current)current.bulge=Number.parseFloat(v)||0;
    }
    if(current)verts.push(current);return{verts,closed,layer};
  }
  function polyVertices(vertices,header){
    const hg=groupMap(header),layer=hg["8"]?.[0]||"0",closed=(getNum(hg,"70")&1)!==0,verts=[];
    for(const vd of vertices){const vg=groupMap(vd);verts.push({x:getNum(vg,"10"),y:-getNum(vg,"20"),bulge:getNum(vg,"42")})}
    return{verts,closed,layer};
  }
  function verticesToSegments(verts,closed,layer){
    const segs=[];if(verts.length<2)return segs;const n=closed?verts.length:verts.length-1;
    for(let i=0;i<n;i++){const a=verts[i],b=verts[(i+1)%verts.length],s=bulgeArc(a,b,a.bulge||0,layer);if(s)segs.push(s)}
    return segs;
  }
  function pointsToSegments(pts,closed,layer){return verticesToSegments(pts.map(p=>({...p,bulge:0})),closed,layer)}
  function sectionSlice(pairs,name){
    for(let i=0;i<pairs.length-1;i++){
      if(pairs[i][0]==="0"&&pairs[i][1]==="SECTION"&&pairs[i+1][0]==="2"&&String(pairs[i+1][1]||"").toUpperCase()===String(name).toUpperCase()){
        const out=[];i+=2;for(;i<pairs.length;i++){if(pairs[i][0]==="0"&&pairs[i][1]==="ENDSEC")break;out.push(pairs[i])}return out;
      }
    }
    return[];
  }
  function entityStream(slice){
    const out=[];let i=0;
    while(i<slice.length){
      if(slice[i][0]!=="0"){i++;continue}
      const type=String(slice[i][1]||"").toUpperCase();i++;
      if(type==="POLYLINE"){
        const header=[];while(i<slice.length&&slice[i][0]!=="0")header.push(slice[i++]);const vertices=[];
        while(i<slice.length&&slice[i][0]==="0"&&slice[i][1]==="VERTEX"){
          i++;const vd=[];while(i<slice.length&&slice[i][0]!=="0")vd.push(slice[i++]);vertices.push(vd);
        }
        if(i<slice.length&&slice[i][0]==="0"&&slice[i][1]==="SEQEND"){i++;while(i<slice.length&&slice[i][0]!=="0")i++}
        out.push({type,header,vertices});continue;
      }
      const data=[];while(i<slice.length&&slice[i][0]!=="0")data.push(slice[i++]);out.push({type,data});
    }
    return out;
  }
  function parseBlocks(pairs){
    const slice=sectionSlice(pairs,"BLOCKS"),blocks=new Map();let i=0;
    while(i<slice.length){
      if(slice[i][0]!=="0"||slice[i][1]!=="BLOCK"){i++;continue}
      i++;const header=[];while(i<slice.length&&slice[i][0]!=="0")header.push(slice[i++]);
      const name=pairText(header,"2",pairText(header,"3",""));const body=[];
      while(i<slice.length&&!(slice[i][0]==="0"&&slice[i][1]==="ENDBLK"))body.push(slice[i++]);
      if(i<slice.length&&slice[i][0]==="0"&&slice[i][1]==="ENDBLK"){i++;while(i<slice.length&&slice[i][0]!=="0")i++}
      if(name){const obj={name,base:{x:pairNum(header,"10",0),y:-pairNum(header,"20",0)},entities:entityStream(body)};blocks.set(name,obj);blocks.set(name.toUpperCase(),obj)}
    }
    return blocks;
  }
  function transformPoint(p,tf){
    if(!tf)return{x:p.x,y:p.y};const x=p.x-(tf.base?.x||0),y=p.y-(tf.base?.y||0),sx=tf.sx??1,sy=tf.sy??1,a=tf.angleRad||0,cs=Math.cos(a),sn=Math.sin(a),xx=x*sx,yy=y*sy;
    return{x:(tf.insert?.x||0)+xx*cs-yy*sn,y:(tf.insert?.y||0)+xx*sn+yy*cs};
  }
  function transformedLayer(layer,tf){return layer&&layer!=="0"?layer:(tf?.layer||layer||"0")}
  function transformSegment(s,tf,layer){
    const l=transformedLayer(layer||s.layer,tf),a=transformPoint(segStart(s),tf),b=transformPoint(segEnd(s),tf);
    if(s.type==="line")return[{type:"line",x1:a.x,y1:a.y,x2:b.x,y2:b.y,layer:l}];
    const sx=Math.abs(tf?.sx??1),sy=Math.abs(tf?.sy??1),uniform=Math.abs(sx-sy)<1e-9;
    if(!tf||uniform){const c=transformPoint({x:s.cx,y:s.cy},tf),r=s.r*(tf?sx:1),mirror=((tf?.sx??1)*(tf?.sy??1))<0;return[{type:"arc",cx:c.x,cy:c.y,r,sx:a.x,sy:a.y,ex:b.x,ey:b.y,cw:mirror?!s.cw:s.cw,layer:l}]}
    const n=Math.max(4,Math.ceil(deg(arcSweep(s))/5)),pts=[];for(let i=0;i<=n;i++)pts.push(transformPoint(arcPoint(s,i/n),tf));return pointsToSegments(pts,false,l);
  }
  function transformRecord(rec,tf,forceLayer){
    const layer=transformedLayer(forceLayer||rec.sourceLayer,tf);
    if(rec.geometry.kind==="circle"){
      const sx=Math.abs(tf?.sx??1),sy=Math.abs(tf?.sy??1),uniform=!tf||Math.abs(sx-sy)<1e-9;
      if(uniform){const c=transformPoint({x:rec.geometry.cx,y:rec.geometry.cy},tf);return{geometry:{kind:"circle",cx:c.x,cy:c.y,r:rec.geometry.r*(tf?sx:1)},closed:true,sourceLayer:layer}}
      const pts=[];for(let i=0;i<72;i++){const a=i/72*Math.PI*2;pts.push(transformPoint({x:rec.geometry.cx+rec.geometry.r*Math.cos(a),y:rec.geometry.cy+rec.geometry.r*Math.sin(a)},tf))}return polyApprox(pts,true,layer);
    }
    const segs=[];for(const sg of rec.geometry.segments||[])segs.push(...transformSegment(sg,tf,layer));return{geometry:{kind:"segments",segments:segs},closed:rec.closed,sourceLayer:layer};
  }
  function insertTransforms(e,block){
    const d=e.data||[],insert={x:pairNum(d,"10",0),y:-pairNum(d,"20",0)},sx=pairNum(d,"41",1)||1,sy=pairNum(d,"42",1)||1,angleRad=-rad(pairNum(d,"50",0)),cols=Math.max(1,Math.trunc(pairNum(d,"70",1))),rows=Math.max(1,Math.trunc(pairNum(d,"71",1))),colSpace=pairNum(d,"44",0),rowSpace=pairNum(d,"45",0),layer=pairText(d,"8","0"),out=[];
    const cs=Math.cos(angleRad),sn=Math.sin(angleRad);
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const ox=c*colSpace*sx,oy=-r*rowSpace*sy,rx=ox*cs-oy*sn,ry=ox*sn+oy*cs;
      out.push({base:block.base,insert:{x:insert.x+rx,y:insert.y+ry},sx,sy,angleRad,layer});
    }
    return out;
  }
  function polyApprox(points,closed,layer){return points.length>=2?{geometry:{kind:"segments",segments:pointsToSegments(points,closed,layer)},closed,sourceLayer:layer}:null}
  function ellipseRecord(data){
    const g=groupMap(data),layer=g["8"]?.[0]||"0",cx=getNum(g,"10"),cy=-getNum(g,"20"),ax=getNum(g,"11"),ay=-getNum(g,"21"),ratio=Math.abs(getNum(g,"40",0,1)),t0=getNum(g,"41",0,0),t1=getNum(g,"42",0,Math.PI*2),major=Math.hypot(ax,ay);if(major<EPS||ratio<EPS)return null;
    let span=t1-t0;while(span<=0)span+=Math.PI*2;const full=Math.abs(span-Math.PI*2)<1e-4||span>Math.PI*2-1e-4,n=Math.max(12,Math.ceil(span/(Math.PI/36))),ux=ax/major,uy=ay/major,vx=-uy*major*ratio,vy=ux*major*ratio,pts=[];
    for(let i=0;i<=(full?n-1:n);i++){const t=t0+span*(i/n);pts.push({x:cx+ax*Math.cos(t)+vx*Math.sin(t),y:cy+ay*Math.cos(t)+vy*Math.sin(t)})}
    return polyApprox(pts,full,layer);
  }
  function splineRecord(data){
    const layer=pairText(data,"8","0"),closed=(Math.trunc(pairNum(data,"70",0))&1)!==0,fit=[],ctrl=[];let cur10=null,cur11=null;
    for(const[c,v]of data){
      if(c==="10"){if(cur10)ctrl.push(cur10);cur10={x:Number.parseFloat(v)||0,y:0}}
      else if(c==="20"&&cur10)cur10.y=-(Number.parseFloat(v)||0);
      else if(c==="11"){if(cur11)fit.push(cur11);cur11={x:Number.parseFloat(v)||0,y:0}}
      else if(c==="21"&&cur11)cur11.y=-(Number.parseFloat(v)||0);
    }
    if(cur10)ctrl.push(cur10);if(cur11)fit.push(cur11);const pts=fit.length>=2?fit:ctrl;return polyApprox(pts,closed,layer);
  }
  function faceRecord(data){
    const g=groupMap(data),layer=g["8"]?.[0]||"0",pts=[];for(const k of ["10","11","12","13"]){if(g[k]?.length){const y=String(Number(k)+10);pts.push({x:getNum(g,k),y:-getNum(g,y)})}}
    const uniq=[];for(const p of pts)if(!uniq.length||!near(p,uniq[uniq.length-1],1e-8))uniq.push(p);if(uniq.length>2&&near(uniq[0],uniq[uniq.length-1],1e-8))uniq.pop();return polyApprox(uniq,true,layer);
  }
  function closeSmallGap(rec,maxGap=.5){
    if(!rec||rec.closed||rec.geometry?.kind!=="segments")return rec;const segs=rec.geometry.segments||[];if(!segs.length)return rec;const a=segStart(segs[0]),b=segEnd(segs[segs.length-1]),gap=dist(a,b);if(gap>maxGap)return rec;
    if(gap>1e-8)segs.push({type:"line",x1:b.x,y1:b.y,x2:a.x,y2:a.y,layer:rec.sourceLayer||"0"});rec.closed=true;rec.autoClosedGapMm=gap;return rec;
  }
  function parseDxfDetailed(text,tol=.2){
    const pairs=parsePairs(text);if(!pairs.length)throw new Error("DXF ist leer oder nicht als ASCII/Unicode-DXF lesbar");
    const slice=sectionSlice(pairs,"ENTITIES");if(!slice.length)throw new Error("ENTITIES-Sektion nicht gefunden");
    const ents=entityStream(slice),blocks=parseBlocks(pairs),ready=[],rawByLayer=new Map(),types={},ignored={},blockStats={expanded:0,missing:0};
    const addRaw=s=>{const l=s.layer||"0";if(!rawByLayer.has(l))rawByLayer.set(l,[]);rawByLayer.get(l).push(s)};
    const addRecord=r=>{if(r)ready.push(r)};
    const processEntity=(e,tf=null,depth=0)=>{
      if(depth>8){ignored.INSERT=(ignored.INSERT||0)+1;return}
      types[e.type]=(types[e.type]||0)+1;
      if(e.type==="INSERT"){
        const name=pairText(e.data,"2",""),block=blocks.get(name)||blocks.get(name.toUpperCase());if(!block){blockStats.missing++;ignored.INSERT=(ignored.INSERT||0)+1;return}
        for(const itf of insertTransforms(e,block)){blockStats.expanded++;for(const child of block.entities)processEntity(child,itf,depth+1)}return;
      }
      if(e.type==="LINE"){
        const q=dxfLineFromData(e.data);for(const sg of transformSegment(q,tf,q.layer))addRaw(sg);return;
      }
      if(e.type==="ARC"){
        const q=dxfArcFromData(e.data);for(const sg of transformSegment(q,tf,q.layer))addRaw(sg);return;
      }
      if(e.type==="CIRCLE"){
        const q=dxfCircleFromData(e.data);if(q.r>EPS)addRecord(transformRecord({geometry:{kind:"circle",cx:q.cx,cy:q.cy,r:q.r},closed:true,sourceLayer:q.layer},tf));return;
      }
      if(e.type==="LWPOLYLINE"){
        const q=lwVertices(e.data),segs=verticesToSegments(q.verts,q.closed,q.layer);if(segs.length)addRecord(transformRecord({geometry:{kind:"segments",segments:segs},closed:q.closed,sourceLayer:q.layer},tf));return;
      }
      if(e.type==="POLYLINE"){
        const q=polyVertices(e.vertices,e.header),segs=verticesToSegments(q.verts,q.closed,q.layer);if(segs.length)addRecord(transformRecord({geometry:{kind:"segments",segments:segs},closed:q.closed,sourceLayer:q.layer},tf));return;
      }
      if(e.type==="ELLIPSE"){const q=ellipseRecord(e.data);if(q)addRecord(transformRecord(q,tf));return}
      if(e.type==="SPLINE"){const q=splineRecord(e.data);if(q)addRecord(transformRecord(q,tf));return}
      if(e.type==="SOLID"||e.type==="3DFACE"||e.type==="TRACE"){const q=faceRecord(e.data);if(q)addRecord(transformRecord(q,tf));return}
      ignored[e.type]=(ignored[e.type]||0)+1;
    };
    for(const e of ents)processEntity(e,null,0);
    for(const[layer,segs]of rawByLayer){for(const ch of chainSegments(segs,tol))ready.push({geometry:{kind:"segments",segments:ch.segments},closed:ch.closed,sourceLayer:layer})}
    let autoClosed=0;for(const r of ready){const was=r.closed;closeSmallGap(r,Math.max(.5,tol*2.5));if(!was&&r.closed)autoClosed++}
    return{records:ready,stats:{entityTypes:types,ignored,blocks:blockStats,autoClosed,totalEntities:ents.length,records:ready.length,open:ready.filter(r=>!r.closed).length,closed:ready.filter(r=>r.closed).length}};
  }
  function parseDxf(text,tol=.2){return parseDxfDetailed(text,tol).records}
  const dxfPair=(c,v)=>`${c}\n${v}\n`,fmt=v=>String(round(v,6));
  function layerSafe(v){return(String(v||"CUTAI").replace(/[^A-Za-z0-9_\-.$]/g,"_").slice(0,120)||"CUTAI")}
  function dxfLine(s,l){return dxfPair(0,"LINE")+dxfPair(8,l)+dxfPair(10,fmt(s.x1))+dxfPair(20,fmt(-s.y1))+dxfPair(30,0)+dxfPair(11,fmt(s.x2))+dxfPair(21,fmt(-s.y2))+dxfPair(31,0)}
  function dxfArc(s,l){
    let a1=deg(Math.atan2(-(s.sy-s.cy),s.sx-s.cx)),a2=deg(Math.atan2(-(s.ey-s.cy),s.ex-s.cx));a1=(a1+360)%360;a2=(a2+360)%360;
    if(s.cw){const t=a1;a1=a2;a2=t}
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
      if(role==="cut"&&!c.closed)warnings.push(`${label}: offene Kontur mit Schneidwerkzeug.`);
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

  return{clamp,round,dist,near,normAngle,rad,deg,segStart,segEnd,reverseSegment,translateSegment,makeArc,arcAngles,arcSweep,angleOnArc,arcPoint,chainSegments,contourSamplePoints,contourBounds,contourArea,contourLength,pointInContour,contourCentroid,nestingDepth,autoClassify,nearestPointOnContour,translateContour,parseDxf,parseDxfDetailed,makeDxf,validateProject};
});
