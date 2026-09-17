(() => {
  const svg = document.getElementById("cad");
  const geometry = document.getElementById("geometry");
  const preview = document.getElementById("preview");
  const statusEl = document.getElementById("status");
  const coordsEl = document.getElementById("coords");
  const commandEl = document.getElementById("command");

  const state = {
    tool: "select",
    shapes: [],
    history: [],
    selectedId: null,
    start: null,
    drawing: false,
    viewBox: { x: 0, y: 0, w: 1200, h: 800 },
    panStart: null,
    panViewStart: null,
    pointers: new Map(),
    pinchStart: null
  };

  const uid = () => "s_" + Math.random().toString(36).slice(2, 9);

  function setStatus(msg) { statusEl.textContent = msg; }

  function snapshot() {
    state.history.push(JSON.stringify(state.shapes));
    if (state.history.length > 60) state.history.shift();
  }

  function undo() {
    if (!state.history.length) return;
    state.shapes = JSON.parse(state.history.pop());
    state.selectedId = null;
    render();
  }

  function svgPoint(clientX, clientY) {
    const r = svg.getBoundingClientRect();
    return {
      x: state.viewBox.x + (clientX - r.left) / r.width * state.viewBox.w,
      y: state.viewBox.y + (clientY - r.top) / r.height * state.viewBox.h
    };
  }

  function snap(v, step = 1) { return Math.round(v / step) * step; }
  function snappedPoint(e) {
    const p = svgPoint(e.clientX, e.clientY);
    return { x: snap(p.x), y: snap(p.y) };
  }

  function setViewBox() {
    const v = state.viewBox;
    svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  }

  function shapeToElement(s) {
    let el;
    if (s.type === "line") {
      el = document.createElementNS("http://www.w3.org/2000/svg", "line");
      [["x1", s.x1], ["y1", s.y1], ["x2", s.x2], ["y2", s.y2]].forEach(([k,v]) => el.setAttribute(k,v));
    } else if (s.type === "rect") {
      el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      [["x", s.x], ["y", s.y], ["width", s.w], ["height", s.h]].forEach(([k,v]) => el.setAttribute(k,v));
    } else if (s.type === "circle") {
      el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      [["cx", s.cx], ["cy", s.cy], ["r", s.r]].forEach(([k,v]) => el.setAttribute(k,v));
    }
    el.classList.add("shape");
    if (s.id === state.selectedId) el.classList.add("selected");
    el.dataset.id = s.id;
    return el;
  }

  function render() {
    geometry.replaceChildren();
    state.shapes.forEach(s => geometry.appendChild(shapeToElement(s)));
    setViewBox();
  }

  function clearPreview() { preview.replaceChildren(); }

  function renderPreview(s) {
    clearPreview();
    const el = shapeToElement({ ...s, id: "__preview" });
    el.classList.remove("shape");
    el.classList.add("preview");
    preview.appendChild(el);
  }

  function makeShape(tool, a, b) {
    if (tool === "line") {
      return { id: uid(), type: "line", x1:a.x, y1:a.y, x2:b.x, y2:b.y };
    }
    if (tool === "rect") {
      return { id: uid(), type:"rect", x:Math.min(a.x,b.x), y:Math.min(a.y,b.y),
        w:Math.abs(b.x-a.x), h:Math.abs(b.y-a.y) };
    }
    if (tool === "circle") {
      return { id: uid(), type:"circle", cx:a.x, cy:a.y, r:Math.hypot(b.x-a.x,b.y-a.y) };
    }
  }

  function setTool(tool) {
    state.tool = tool;
    state.selectedId = null;
    document.querySelectorAll(".tool").forEach(b => b.classList.toggle("active", b.dataset.tool === tool));
    setStatus(`${toolName(tool)} · mm`);
    render();
  }

  function toolName(t) {
    return ({select:"Auswahl", line:"Linie", rect:"Rechteck", circle:"Kreis", pan:"Verschieben"})[t] || t;
  }

  function selectAtTarget(target) {
    const id = target?.dataset?.id;
    state.selectedId = id || null;
    render();
  }

  function deleteSelected() {
    if (!state.selectedId) return;
    snapshot();
    state.shapes = state.shapes.filter(s => s.id !== state.selectedId);
    state.selectedId = null;
    render();
  }

  function pointerDown(e) {
    svg.setPointerCapture?.(e.pointerId);
    state.pointers.set(e.pointerId, {x:e.clientX,y:e.clientY});

    if (state.pointers.size === 2) {
      const pts = [...state.pointers.values()];
      state.pinchStart = {
        dist: Math.hypot(pts[1].x-pts[0].x, pts[1].y-pts[0].y),
        view: {...state.viewBox}
      };
      return;
    }

    const p = snappedPoint(e);
    if (state.tool === "select") {
      selectAtTarget(e.target);
      return;
    }
    if (state.tool === "pan") {
      state.panStart = {x:e.clientX,y:e.clientY};
      state.panViewStart = {...state.viewBox};
      return;
    }
    if (["line","rect","circle"].includes(state.tool)) {
      state.start = p;
      state.drawing = true;
    }
  }

  function pointerMove(e) {
    state.pointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
    const p = svgPoint(e.clientX, e.clientY);
    coordsEl.textContent = `X ${p.x.toFixed(1)} · Y ${p.y.toFixed(1)} mm`;

    if (state.pointers.size === 2 && state.pinchStart) {
      const pts = [...state.pointers.values()];
      const dist = Math.hypot(pts[1].x-pts[0].x, pts[1].y-pts[0].y);
      const factor = state.pinchStart.dist / Math.max(dist, 1);
      const newW = Math.min(10000, Math.max(50, state.pinchStart.view.w * factor));
      const newH = Math.min(10000, Math.max(50, state.pinchStart.view.h * factor));
      const cx = state.pinchStart.view.x + state.pinchStart.view.w/2;
      const cy = state.pinchStart.view.y + state.pinchStart.view.h/2;
      state.viewBox = {x:cx-newW/2, y:cy-newH/2, w:newW, h:newH};
      setViewBox();
      return;
    }

    if (state.tool === "pan" && state.panStart) {
      const r = svg.getBoundingClientRect();
      const dx = (e.clientX-state.panStart.x)/r.width*state.panViewStart.w;
      const dy = (e.clientY-state.panStart.y)/r.height*state.panViewStart.h;
      state.viewBox.x = state.panViewStart.x-dx;
      state.viewBox.y = state.panViewStart.y-dy;
      setViewBox();
      return;
    }

    if (state.drawing && state.start) {
      const b = snappedPoint(e);
      renderPreview(makeShape(state.tool, state.start, b));
    }
  }

  function pointerUp(e) {
    const remainingBeforeDelete = state.pointers.size;
    state.pointers.delete(e.pointerId);
    if (remainingBeforeDelete >= 2) {
      if (state.pointers.size < 2) state.pinchStart = null;
      return;
    }

    if (state.tool === "pan") {
      state.panStart = null;
      state.panViewStart = null;
      return;
    }

    if (state.drawing && state.start) {
      const b = snappedPoint(e);
      const s = makeShape(state.tool, state.start, b);
      const valid = s && (
        s.type === "line" ? Math.hypot(s.x2-s.x1,s.y2-s.y1) > 0.5 :
        s.type === "rect" ? s.w > 0.5 && s.h > 0.5 :
        s.type === "circle" ? s.r > 0.5 : false
      );
      if (valid) {
        snapshot();
        state.shapes.push(s);
      }
      state.drawing = false;
      state.start = null;
      clearPreview();
      render();
    }
  }

  svg.addEventListener("pointerdown", pointerDown);
  svg.addEventListener("pointermove", pointerMove);
  svg.addEventListener("pointerup", pointerUp);
  svg.addEventListener("pointercancel", pointerUp);
  svg.addEventListener("wheel", e => {
    e.preventDefault();
    const p = svgPoint(e.clientX,e.clientY);
    const factor = e.deltaY > 0 ? 1.12 : 0.89;
    const nw = Math.min(10000,Math.max(50,state.viewBox.w*factor));
    const nh = Math.min(10000,Math.max(50,state.viewBox.h*factor));
    const rx=(p.x-state.viewBox.x)/state.viewBox.w, ry=(p.y-state.viewBox.y)/state.viewBox.h;
    state.viewBox={x:p.x-rx*nw,y:p.y-ry*nh,w:nw,h:nh};
    setViewBox();
  }, {passive:false});

  document.querySelectorAll(".tool").forEach(b => b.addEventListener("click",()=>setTool(b.dataset.tool)));
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("deleteBtn").addEventListener("click", deleteSelected);

  document.getElementById("newBtn").addEventListener("click", () => {
    snapshot(); state.shapes=[]; state.selectedId=null; render(); setStatus("Neues Projekt · mm");
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    const project = {
      schema: "cutai-cad/0.1",
      units: "mm",
      created: new Date().toISOString(),
      shapes: state.shapes
    };
    const blob = new Blob([JSON.stringify(project,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cutai-project.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("loadInput").addEventListener("change", async e => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const project = JSON.parse(await f.text());
      if (!Array.isArray(project.shapes)) throw new Error("Ungültig");
      snapshot(); state.shapes = project.shapes; state.selectedId=null; render(); fitAll();
      setStatus("Projekt geladen · mm");
    } catch {
      setStatus("Projektdatei konnte nicht geladen werden");
    } finally { e.target.value=""; }
  });

  function fitAll() {
    if (!state.shapes.length) {
      state.viewBox={x:0,y:0,w:1200,h:800}; render(); return;
    }
    let xs=[], ys=[];
    for (const s of state.shapes) {
      if (s.type==="line") { xs.push(s.x1,s.x2); ys.push(s.y1,s.y2); }
      if (s.type==="rect") { xs.push(s.x,s.x+s.w); ys.push(s.y,s.y+s.h); }
      if (s.type==="circle") { xs.push(s.cx-s.r,s.cx+s.r); ys.push(s.cy-s.r,s.cy+s.r); }
    }
    const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
    const pad=Math.max(50,(maxX-minX+maxY-minY)*.08);
    state.viewBox={x:minX-pad,y:minY-pad,w:Math.max(100,maxX-minX+2*pad),h:Math.max(100,maxY-minY+2*pad)};
    render();
  }
  document.getElementById("fitBtn").addEventListener("click", fitAll);

  function runCommand(raw) {
    const cmd = raw.trim().replace(/,/g,".");
    if (!cmd) return;

    let m = cmd.match(/(?:platte|rechteck)\s+(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
    if (m) {
      const w=+m[1], h=+m[2];
      snapshot();
      state.shapes.push({id:uid(),type:"rect",x:0,y:0,w,h});
      render(); fitAll(); setStatus(`Platte ${w} × ${h} mm erstellt`);
      return;
    }

    m = cmd.match(/kreis\s*(?:ø|⌀|durchmesser|d)?\s*(\d+(?:\.\d+)?)\s*(?:bei|@)\s*(-?\d+(?:\.\d+)?)\s*[,;/ ]\s*(-?\d+(?:\.\d+)?)/i);
    if (m) {
      const d=+m[1], x=+m[2], y=+m[3];
      snapshot();
      state.shapes.push({id:uid(),type:"circle",cx:x,cy:y,r:d/2});
      render(); setStatus(`Kreis Ø${d} bei ${x}, ${y} erstellt`);
      return;
    }

    m = cmd.match(/linie\s+von\s+(-?\d+(?:\.\d+)?)\s*[,;/ ]\s*(-?\d+(?:\.\d+)?)\s+(?:nach|bis)\s+(-?\d+(?:\.\d+)?)\s*[,;/ ]\s*(-?\d+(?:\.\d+)?)/i);
    if (m) {
      snapshot();
      state.shapes.push({id:uid(),type:"line",x1:+m[1],y1:+m[2],x2:+m[3],y2:+m[4]});
      render(); setStatus("Linie erstellt");
      return;
    }

    setStatus("Befehl noch nicht verstanden · V0.1 kann Platte, Kreis und Linie");
  }

  document.getElementById("runCommand").addEventListener("click",()=>runCommand(commandEl.value));
  commandEl.addEventListener("keydown",e=>{ if(e.key==="Enter") runCommand(commandEl.value); });

  render();
})();
