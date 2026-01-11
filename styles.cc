:root{
  --bg0:#07070c; --bg1:#0b0b12;
  --card:#111120;
  --text:rgba(255,255,255,.92);
  --muted:rgba(255,255,255,.62);
  --muted2:rgba(255,255,255,.45);
  --line:rgba(255,255,255,.12);
  --accent:#39f5ff;
  --accent2:#ff3bd4;
  --good:#a6ff4d;

  --radius:20px;
  --shadow:0 16px 50px rgba(0,0,0,.55);
  --font: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

*{ box-sizing:border-box; }
html,body{ height:100%; }
body{
  margin:0;
  font-family:var(--font);
  color:var(--text);
  background: radial-gradient(1200px 600px at 15% 0%, rgba(57,245,255,.10), transparent 55%),
              radial-gradient(1000px 600px at 90% 15%, rgba(255,59,212,.10), transparent 55%),
              linear-gradient(180deg, var(--bg0), var(--bg1));
}

.topbar{
  position:sticky; top:0; z-index:10;
  display:flex; justify-content:space-between; align-items:center;
  padding:14px 16px;
  border-bottom:1px solid var(--line);
  background: rgba(10,10,18,.75);
  backdrop-filter: blur(10px);
}

.brand{ display:flex; gap:12px; align-items:center; }
.logo{
  width:40px; height:40px; border-radius:14px;
  display:grid; place-items:center;
  background: linear-gradient(135deg, rgba(57,245,255,.18), rgba(255,59,212,.18));
  border:1px solid rgba(255,255,255,.14);
}
.title{ font-weight:800; letter-spacing:.2px; }
.subtitle{ font-size:12px; color:var(--muted); }

.actions{ display:flex; gap:10px; flex-wrap:wrap; }

.wrap{ max-width:980px; margin:0 auto; padding:16px; }

.hero{
  margin-top:10px;
  display:flex; justify-content:space-between; align-items:flex-start;
  gap:12px;
}
.hero h1{ margin:0; font-size:28px; }
.muted{ color:var(--muted); margin:6px 0 0; }

.hero-right{ display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.pill{
  min-width:120px;
  padding:10px 12px;
  border:1px solid var(--line);
  border-radius:16px;
  background: rgba(255,255,255,.04);
}
.pill-label{ font-size:12px; color:var(--muted); }
.pill-value{ font-size:18px; font-weight:800; margin-top:2px; }

.toolbar{
  margin-top:14px;
  display:flex;
  gap:12px;
  align-items:center;
  justify-content:space-between;
  flex-wrap:wrap;
}

.tabs{ display:flex; gap:8px; flex-wrap:wrap; }

.tab{
  cursor:pointer;
  padding:10px 12px;
  border-radius:999px;
  border:1px solid var(--line);
  background: rgba(255,255,255,.03);
  color:var(--text);
  font-weight:650;
  font-size:13px;
}
.tab.active{
  border-color: rgba(57,245,255,.45);
  box-shadow: 0 0 0 4px rgba(57,245,255,.08);
}

.search input{
  width:min(360px, 92vw);
  padding:10px 12px;
  border-radius:14px;
  border:1px solid var(--line);
  background: rgba(255,255,255,.03);
  color:var(--text);
  outline:none;
}

.card{
  margin-top:14px;
  padding:14px;
  border-radius:var(--radius);
  border:1px solid var(--line);
  background: rgba(17,17,32,.65);
  box-shadow: var(--shadow);
}

.section-title{ margin:0 0 10px; font-size:16px; font-weight:900; }
.section-sub{ margin:-6px 0 10px; color:var(--muted); font-size:13px; }
.hr{ height:1px; background:rgba(255,255,255,.10); margin:14px 0; border:0; }

.list{ display:flex; flex-direction:column; gap:10px; }

.item{
  padding:12px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
}
.item-top{ display:flex; align-items:flex-start; gap:10px; }
.chk{
  width:22px; height:22px;
  border-radius:7px;
  border:1px solid rgba(255,255,255,.22);
  display:grid; place-items:center;
  cursor:pointer;
  flex: 0 0 auto;
}
.chk.done{
  background: rgba(166,255,77,.18);
  border-color: rgba(166,255,77,.55);
}
.item-title{ font-weight:850; margin:0; line-height:1.25; }
.item-meta{ margin:4px 0 0; color:var(--muted); font-size:13px; }

.details{
  margin-top:10px;
  color:var(--muted);
  font-size:13px;
  line-height:1.45;
}
.details b{ color: rgba(255,255,255,.88); }

.tags{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
.tag{
  font-size:12px;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
  color:var(--muted);
  background: rgba(255,255,255,.02);
}

.note{ margin-top:10px; display:flex; gap:8px; }
.note input{
  flex:1;
  padding:10px 12px;
  border-radius:14px;
  border:1px solid var(--line);
  background: rgba(255,255,255,.03);
  color:var(--text);
  outline:none;
}

.btn{
  cursor:pointer;
  padding:10px 12px;
  border-radius:14px;
  border:1px solid rgba(57,245,255,.40);
  background: rgba(57,245,255,.14);
  color:var(--text);
  font-weight:800;
}
.btn.ghost{
  border-color: rgba(255,255,255,.16);
  background: rgba(255,255,255,.03);
  font-weight:750;
}
.btn.small{
  padding:8px 10px;
  border-radius:12px;
  font-weight:800;
  font-size:12px;
}

.grid{
  display:grid;
  grid-template-columns: repeat(12, 1fr);
  gap:12px;
}
.col6{ grid-column: span 6; }
.col12{ grid-column: span 12; }

.block{
  padding:12px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
}
.block h4{ margin:0 0 8px; }
.block ul{ margin:0; padding-left:18px; color:var(--muted); }

.codebox{
  white-space:pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size:12px;
  color: rgba(255,255,255,.82);
  background: rgba(0,0,0,.25);
  border:1px solid rgba(255,255,255,.10);
  border-radius:14px;
  padding:12px;
}

.footer{ padding:18px 2px 26px; color:var(--muted2); font-size:12px; }

.dialog{
  border:none;
  padding:0;
  width:min(900px, 92vw);
  border-radius:18px;
  background: rgba(17,17,32,.98);
  color:var(--text);
  box-shadow: var(--shadow);
}
.dialog-inner{ padding:14px; }
.dialog textarea{
  width:100%;
  min-height:260px;
  resize:vertical;
  margin-top:10px;
  padding:12px;
  border-radius:14px;
  border:1px solid var(--line);
  background: rgba(255,255,255,.03);
  color:var(--text);
  outline:none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.dialog-actions{ margin-top:12px; display:flex; gap:10px; justify-content:flex-end; }

.row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin:8px 0;
}
.row input[type="time"]{
  padding:8px 10px;
  border-radius:12px;
  border:1px solid var(--line);
  background: rgba(255,255,255,.03);
  color:var(--text);
}
.row-wrap{ display:flex; gap:10px; flex-wrap:wrap; }

@media (max-width: 760px){
  .col6{ grid-column: span 12; }
  }
