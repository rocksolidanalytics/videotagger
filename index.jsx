import { useState, useRef, useEffect } from "react";

const C = {
  bg:"#0b1220",panel:"#111827",panelB:"#1a2540",border:"#1e2d45",
  green:"#34c967",greenDim:"#1a5c35",greenGlow:"rgba(52,201,103,0.15)",
  navy:"#0f1e36",blue:"#3b82f6",blueDim:"#1e3a6e",gold:"#f59e0b",
  red:"#ef4444",slate:"#64748b",muted:"#94a3b8",white:"#f1f5f9",text:"#e2e8f0",
};

const EVENTS = [
  { id:"kickout", label:"Kickout", color:C.blue, icon:"⬆", outcomes:["Won Clean","Break Won","Break Lost","Lost Clean"] },
  { id:"shot", label:"Shot", color:C.green, icon:"◎", outcomes:["Point","Goal","Wide","Blocked","Saved","2-Pointer"] },
  { id:"free", label:"Free", color:C.gold, icon:"◉", outcomes:["Point","Goal","Wide","Blocked","Saved","2-Pointer"] },
  { id:"turnover", label:"Turnover", color:"#f97316", icon:"↯", outcomes:["In Contact","Kick Pass","Hand Pass","Handling","Intercepted","Foul"] },
  { id:"tackle", label:"Tackle", color:"#a78bfa", icon:"⚡", outcomes:["Contact Made","Block","Foul"] },
];

const TEAMS = { home:"Bray Emmets", away:"Opposition" };

function formatVideoTime(secs) {
  if (secs == null || isNaN(secs)) return "--:--";
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function videoTimeToGameTime(videoSecs, throwInSecs, halfStartSecs) {
  if (throwInSecs == null || videoSecs < throwInSecs) return null;
  if (halfStartSecs != null && videoSecs >= halfStartSecs) {
    return { secs: 1800 + (videoSecs - halfStartSecs), period:2 };
  }
  return { secs: videoSecs - throwInSecs, period:1 };
}

function formatGameTime(gt) {
  if (!gt) return "--:--";
  const m = Math.floor(gt.secs / 60), s = Math.floor(gt.secs % 60);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:28,height:28,border:`2px solid ${C.green}`,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",background:C.greenGlow }}>
        <span style={{ fontSize:14,color:C.green }}>▶</span>
      </div>
      <div>
        <div style={{ fontSize:11,fontWeight:800,letterSpacing:2,color:C.white,lineHeight:1 }}>ROCK SOLID</div>
        <div style={{ fontSize:8,letterSpacing:3,color:C.green,fontFamily:"monospace" }}>VIDEO TAGGER</div>
      </div>
    </div>
  );
}

function Pill({ children, color=C.green, style={} }) {
  return (
    <span style={{ display:"inline-block",padding:"2px 8px",borderRadius:999,fontSize:10,fontWeight:700,letterSpacing:1,fontFamily:"monospace",background:`${color}22`,color,border:`1px solid ${color}44`,...style }}>
      {children}
    </span>
  );
}

function SyncButton({ label, icon, done, time, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled || done} style={{ display:"flex",alignItems:"center",gap:12,background:done?C.greenGlow:C.panelB,border:`1px solid ${done?C.green:C.border}`,borderRadius:10,padding:"12px 16px",cursor:disabled||done?"default":"pointer",width:"100%",transition:"all 0.15s" }}>
      <div style={{ width:36,height:36,borderRadius:8,background:done?C.green:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>
        {done ? "✓" : icon}
      </div>
      <div style={{ textAlign:"left",flex:1 }}>
        <div style={{ fontSize:12,fontWeight:700,color:done?C.green:C.white }}>{label}</div>
        <div style={{ fontSize:10,color:C.slate,fontFamily:"monospace",marginTop:2 }}>
          {done ? `Marked at ${formatVideoTime(time)}` : "Tap while video plays at this moment"}
        </div>
      </div>
      {done && <div style={{ fontSize:14,color:C.green }}>●</div>}
    </button>
  );
}

function EventTag({ ev, onSelect, disabled }) {
  return (
    <button onClick={() => onSelect(ev)} disabled={disabled} style={{ background:C.panelB,border:`1px solid ${ev.color}55`,borderRadius:10,padding:"10px 8px",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,transition:"all 0.12s",display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1,minWidth:0 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background=`${ev.color}1a`; }}
      onMouseLeave={e => { e.currentTarget.style.background=C.panelB; }}>
      <span style={{ fontSize:20 }}>{ev.icon}</span>
      <span style={{ fontSize:10,fontWeight:700,color:ev.color,letterSpacing:0.5 }}>{ev.label}</span>
    </button>
  );
}

function TeamToggle({ team, setTeam }) {
  return (
    <div style={{ display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}` }}>
      {["home","away"].map(t => (
        <button key={t} onClick={() => setTeam(t)} style={{ flex:1,padding:"6px 0",fontSize:11,fontWeight:700,cursor:"pointer",border:"none",transition:"all 0.12s",background:team===t?(t==="home"?C.green:C.gold):C.panelB,color:team===t?"#000":C.slate,letterSpacing:0.5 }}>
          {t==="home"?TEAMS.home:TEAMS.away}
        </button>
      ))}
    </div>
  );
}

function OutcomeModal({ event, team, gameTime, videoTime, onConfirm, onCancel }) {
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [playerNum, setPlayerNum] = useState("");
  if (!event) return null;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)" }}>
      <div style={{ background:C.panel,borderTop:`2px solid ${event.color}`,borderRadius:"16px 16px 0 0",padding:20,width:"100%",maxWidth:480,animation:"slideUp 0.2s ease" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:20 }}>{event.icon}</span>
              <span style={{ fontSize:16,fontWeight:800,color:event.color }}>{event.label}</span>
              <Pill color={team==="home"?C.green:C.gold}>{team==="home"?TEAMS.home:TEAMS.away}</Pill>
            </div>
            <div style={{ fontSize:10,color:C.slate,fontFamily:"monospace",marginTop:4 }}>
              Game time {formatGameTime(gameTime)} · Video {formatVideoTime(videoTime)}
            </div>
          </div>
          <button onClick={onCancel} style={{ background:"none",border:"none",color:C.slate,fontSize:20,cursor:"pointer",padding:4 }}>✕</button>
        </div>
        <div style={{ fontSize:10,color:C.slate,letterSpacing:1,marginBottom:8,fontFamily:"monospace" }}>OUTCOME <span style={{ color:C.red }}>*</span></div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:16 }}>
          {event.outcomes.map(o => (
            <button key={o} onClick={() => setSelectedOutcome(o)} style={{ padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.1s",border:`1px solid ${selectedOutcome===o?event.color:C.border}`,background:selectedOutcome===o?`${event.color}22`:C.panelB,color:selectedOutcome===o?event.color:C.muted }}>
              {o}
            </button>
          ))}
        </div>
        <div style={{ fontSize:10,color:C.slate,letterSpacing:1,marginBottom:8,fontFamily:"monospace" }}>PLAYER NUMBER <span style={{ color:C.slate }}>(optional)</span></div>
        <input type="number" min="1" max="30" value={playerNum} onChange={e => setPlayerNum(e.target.value)} placeholder="e.g. 9"
          style={{ background:C.panelB,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.white,fontSize:14,width:"100%",marginBottom:16,boxSizing:"border-box",outline:"none" }} />
        <button onClick={() => selectedOutcome && onConfirm(selectedOutcome, playerNum||null)} disabled={!selectedOutcome}
          style={{ width:"100%",padding:"12px",borderRadius:10,fontSize:14,fontWeight:800,cursor:selectedOutcome?"pointer":"not-allowed",background:selectedOutcome?event.color:C.border,color:selectedOutcome?"#000":C.slate,border:"none",letterSpacing:0.5,transition:"all 0.12s" }}>
          LOG EVENT →
        </button>
      </div>
    </div>
  );
}

function EventRow({ ev, index, onJump }) {
  const eventDef = EVENTS.find(e => e.id === ev.eventId);
  const goodOutcomes = ["Won Clean","Break Won","Point","Goal","2-Pointer","Contact Made","Block"];
  const isGood = goodOutcomes.includes(ev.outcome);
  return (
    <div onClick={() => onJump(ev.videoTime)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,cursor:"pointer",transition:"background 0.1s",borderBottom:`1px solid ${C.border}` }}
      onMouseEnter={e => e.currentTarget.style.background=C.panelB}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
      <div style={{ fontSize:10,color:C.slate,fontFamily:"monospace",minWidth:20,textAlign:"right" }}>{index+1}</div>
      <div style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,color:C.muted,minWidth:38 }}>{formatGameTime(ev.gameTime)}</div>
      <Pill color={ev.gameTime?.period===1?C.blue:C.gold} style={{ minWidth:22,textAlign:"center" }}>{ev.gameTime?.period===1?"H1":"H2"}</Pill>
      <span style={{ fontSize:14 }}>{eventDef?.icon}</span>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:12,fontWeight:700,color:eventDef?.color }}>{eventDef?.label}</div>
        <div style={{ fontSize:10,color:C.slate }}>{ev.team==="home"?TEAMS.home:TEAMS.away}{ev.player?` · #${ev.player}`:""}</div>
      </div>
      <div style={{ fontSize:11,fontWeight:600,color:isGood?C.green:C.red,textAlign:"right",minWidth:80 }}>{ev.outcome}</div>
      <div style={{ fontSize:12,color:C.slate }}>▶</div>
    </div>
  );
}

// ── VIDEO LOAD PANEL ──────────────────────────────────────────────────────────
function VideoLoader({ onFile, onUrl, videoSrc, videoLoaded, videoError, urlInput, setUrlInput, fileInputRef }) {
  const [mode, setMode] = useState("url"); // "url" | "file"

  return (
    <div style={{ padding:16, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ fontSize:10,color:C.slate,letterSpacing:1,fontFamily:"monospace",marginBottom:8 }}>MATCH VIDEO</div>

      {/* Mode toggle */}
      <div style={{ display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:10 }}>
        {[["url","URL"],["file","File"]].map(([m,l]) => (
          <button key={m} onClick={() => setMode(m)} style={{ flex:1,padding:"5px 0",fontSize:11,fontWeight:700,cursor:"pointer",border:"none",transition:"all 0.12s",background:mode===m?C.blue:C.panelB,color:mode===m?"#fff":C.slate }}>
            {l}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <div>
          <input
            type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && onUrl()}
            placeholder="Paste video URL and press Load"
            style={{ width:"100%",background:C.panelB,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.white,fontSize:11,outline:"none",boxSizing:"border-box",marginBottom:6 }}
          />
          <button onClick={onUrl} disabled={!urlInput.trim()} style={{ width:"100%",padding:"7px",borderRadius:8,fontSize:11,fontWeight:700,cursor:urlInput.trim()?"pointer":"not-allowed",background:urlInput.trim()?C.blue:C.border,color:urlInput.trim()?"#fff":C.slate,border:"none" }}>
            Load Video
          </button>
          <div style={{ fontSize:9,color:C.slate,marginTop:6,lineHeight:1.5 }}>
            Works with direct video links (MP4/WebM). Try Dropbox → Share → copy direct link, or Google Drive with sharing on.
          </div>
        </div>
      ) : (
        <div>
          <div onClick={() => fileInputRef.current.click()}
            style={{ border:`2px dashed ${C.border}`,borderRadius:10,padding:"20px 12px",textAlign:"center",cursor:"pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor=C.green}
            onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
            <div style={{ fontSize:24,marginBottom:6 }}>📹</div>
            <div style={{ fontSize:11,color:C.muted,fontWeight:600 }}>Click to browse</div>
            <div style={{ fontSize:9,color:C.slate,marginTop:2 }}>MP4, MOV, WebM</div>
          </div>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={onFile} style={{ display:"none" }} />
        </div>
      )}

      {/* Status */}
      {videoSrc && (
        <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:8 }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:videoError?C.red:videoLoaded?C.green:C.gold,animation:(!videoLoaded&&!videoError)?"pulse 1s infinite":"none" }} />
          <span style={{ fontSize:10,color:videoError?C.red:videoLoaded?C.green:C.gold }}>
            {videoError ? `Error: ${videoError}` : videoLoaded ? "Video ready" : "Loading…"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [videoSrc, setVideoSrc] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [urlInput, setUrlInput] = useState("");

  const [throwInTime, setThrowInTime] = useState(null);
  const [halfStartTime, setHalfStartTime] = useState(null);

  const [team, setTeam] = useState("home");
  const [pendingEvent, setPendingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("tag");
  const [searchTerm, setSearchTerm] = useState("");

  const loadVideo = (src) => {
    setVideoSrc(src);
    setVideoLoaded(false);
    setVideoError(null);
    setThrowInTime(null);
    setHalfStartTime(null);
    setEvents([]);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadVideo(URL.createObjectURL(file));
  };

  const handleUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    loadVideo(trimmed);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onLoaded = () => { setVideoLoaded(true); setVideoError(null); };
    const onError = () => setVideoError("Could not load video — check the URL or try a different format");
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("error", onError);
    return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("loadeddata", onLoaded); v.removeEventListener("error", onError); };
  }, [videoSrc]);

  useEffect(() => {
    const handle = (e) => {
      if (!videoLoaded || pendingEvent) return;
      if (e.target.tagName === "INPUT") return;
      const v = videoRef.current;
      if (e.key === " ") { e.preventDefault(); v.paused ? v.play() : v.pause(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); v.currentTime -= 5; }
      if (e.key === "ArrowRight") { e.preventDefault(); v.currentTime += 5; }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [videoLoaded, pendingEvent]);

  const markThrowIn = () => { if (!videoRef.current) return; videoRef.current.pause(); setThrowInTime(videoRef.current.currentTime); };
  const markHalfStart = () => { if (!videoRef.current) return; videoRef.current.pause(); setHalfStartTime(videoRef.current.currentTime); };

  const gameTime = videoTimeToGameTime(currentTime, throwInTime, halfStartTime);
  const syncReady = throwInTime != null;

  const handleEventSelect = (ev) => {
    if (!syncReady) return;
    const v = videoRef.current;
    const vt = v?.currentTime ?? currentTime;
    v?.pause();
    setPendingEvent({ ev, videoTime:vt, gameTime:videoTimeToGameTime(vt, throwInTime, halfStartTime) });
  };

  const handleConfirm = (outcome, player) => {
    const { ev, videoTime, gameTime } = pendingEvent;
    setEvents(prev => [...prev, { id:Date.now(), eventId:ev.id, outcome, player, team, videoTime, gameTime }]);
    setPendingEvent(null);
  };

  const handleJump = (videoTime) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, videoTime - 5);
    v.play();
    setActiveTab("tag");
  };

  const exportCSV = () => {
    const rows = [["#","Game Time","Period","Event","Team","Outcome","Player","Video Time"]];
    events.forEach((ev, i) => {
      rows.push([i+1, formatGameTime(ev.gameTime), ev.gameTime?.period??"", ev.eventId, ev.team==="home"?TEAMS.home:TEAMS.away, ev.outcome, ev.player??"", formatVideoTime(ev.videoTime)]);
    });
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rock-solid-events.csv"; a.click();
  };

  const filteredEvents = events.filter(ev => {
    if (!searchTerm) return true;
    const def = EVENTS.find(e => e.id === ev.eventId);
    return `${def?.label} ${ev.outcome} ${ev.team} ${ev.player??""}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const counts = {};
  EVENTS.forEach(e => { counts[e.id] = events.filter(ev => ev.eventId === e.id).length; });

  return (
    <div style={{ minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"system-ui, sans-serif",display:"flex",flexDirection:"column" }}>
      <style>{`
        * { box-sizing:border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity:0.4; }
        @keyframes slideUp { from { transform:translateY(40px);opacity:0; } to { transform:translateY(0);opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.border};border-radius:2px; }
      `}</style>

      {/* HEADER */}
      <div style={{ background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10 }}>
        <Logo />
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          {events.length > 0 && (
            <button onClick={exportCSV} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",fontSize:11,color:C.muted,cursor:"pointer",fontWeight:600 }}>↓ CSV</button>
          )}
          {syncReady && (
            <Pill color={C.green}>{gameTime ? `${formatGameTime(gameTime)} · ${gameTime.period===1?"H1":"H2"}` : "BEFORE KO"}</Pill>
          )}
        </div>
      </div>

      <div style={{ display:"flex",flex:1,overflow:"hidden",maxHeight:"calc(100vh - 52px)" }}>

        {/* LEFT PANEL */}
        <div style={{ width:260,flexShrink:0,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflowY:"auto" }}>

          <VideoLoader
            onFile={handleFile} onUrl={handleUrl}
            videoSrc={videoSrc} videoLoaded={videoLoaded} videoError={videoError}
            urlInput={urlInput} setUrlInput={setUrlInput}
            fileInputRef={fileInputRef}
          />

          {/* Sync points */}
          <div style={{ padding:16,borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10,color:C.slate,letterSpacing:1,fontFamily:"monospace",marginBottom:10 }}>SYNC POINTS</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <SyncButton label="Mark Throw-in" icon="🏐" done={throwInTime!=null} time={throwInTime} onClick={markThrowIn} disabled={!videoLoaded} />
              <SyncButton label="Mark 2nd Half Start" icon="🔄" done={halfStartTime!=null} time={halfStartTime} onClick={markHalfStart} disabled={!videoLoaded||throwInTime==null} />
            </div>
            {throwInTime!=null && halfStartTime==null && (
              <div style={{ fontSize:10,color:C.gold,marginTop:8,fontFamily:"monospace" }}>⚠ 2nd half sync pending</div>
            )}
          </div>

          {/* Event summary */}
          {events.length > 0 && (
            <div style={{ padding:16,borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10,color:C.slate,letterSpacing:1,fontFamily:"monospace",marginBottom:10 }}>TAGGED ({events.length})</div>
              {EVENTS.map(e => counts[e.id] > 0 && (
                <div key={e.id} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`,fontSize:11 }}>
                  <span style={{ color:e.color }}>{e.icon} {e.label}</span>
                  <span style={{ color:C.muted,fontFamily:"monospace",fontWeight:700 }}>{counts[e.id]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Shortcuts */}
          <div style={{ padding:16,marginTop:"auto" }}>
            <div style={{ fontSize:10,color:C.slate,letterSpacing:1,fontFamily:"monospace",marginBottom:8 }}>SHORTCUTS</div>
            {[["Space","Play / Pause"],["← →","±5 seconds"]].map(([k,v]) => (
              <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:C.slate,padding:"3px 0" }}>
                <kbd style={{ background:C.panelB,border:`1px solid ${C.border}`,borderRadius:4,padding:"1px 6px",color:C.muted,fontFamily:"monospace" }}>{k}</kbd>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN AREA */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>

          {/* Video */}
          <div style={{ background:"#000",borderBottom:`1px solid ${C.border}`,flexShrink:0 }}>
            {videoSrc ? (
              <video ref={videoRef} src={videoSrc} controls crossOrigin="anonymous"
                style={{ width:"100%",display:"block",maxHeight:"45vh",objectFit:"contain" }} />
            ) : (
              <div style={{ height:240,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8 }}>
                <div style={{ fontSize:40,opacity:0.2 }}>🎬</div>
                <div style={{ fontSize:12,color:C.slate }}>Load a match video to begin</div>
              </div>
            )}
          </div>

          {/* Tab nav */}
          <div style={{ display:"flex",borderBottom:`1px solid ${C.border}`,background:C.panel,flexShrink:0 }}>
            {[["tag","Tag Events"],["events",`Event Log (${events.length})`]].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ flex:1,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer",background:"none",border:"none",letterSpacing:0.5,color:activeTab===id?C.green:C.slate,borderBottom:activeTab===id?`2px solid ${C.green}`:"2px solid transparent",transition:"all 0.12s" }}>
                {label}
              </button>
            ))}
          </div>

          {/* TAG TAB */}
          {activeTab === "tag" && (
            <div style={{ flex:1,overflowY:"auto",padding:16 }}>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10,color:C.slate,letterSpacing:1,fontFamily:"monospace",marginBottom:6 }}>TAGGING FOR</div>
                <TeamToggle team={team} setTeam={setTeam} />
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10,color:C.slate,letterSpacing:1,fontFamily:"monospace",marginBottom:6 }}>SELECT EVENT</div>
                {!syncReady && (
                  <div style={{ background:`${C.gold}11`,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"10px 12px",fontSize:11,color:C.gold,marginBottom:10,fontFamily:"monospace" }}>
                    ⚠ Mark Throw-in before tagging events
                  </div>
                )}
                <div style={{ display:"flex",gap:8 }}>
                  {EVENTS.map(ev => <EventTag key={ev.id} ev={ev} onSelect={handleEventSelect} disabled={!syncReady||!videoLoaded} />)}
                </div>
              </div>
              {events.length > 0 && (
                <div>
                  <div style={{ fontSize:10,color:C.slate,letterSpacing:1,fontFamily:"monospace",marginBottom:6 }}>RECENT</div>
                  {[...events].reverse().slice(0,5).map((ev,i) => (
                    <EventRow key={ev.id} ev={ev} index={events.length-1-i} onJump={handleJump} />
                  ))}
                  {events.length > 5 && (
                    <button onClick={() => setActiveTab("events")} style={{ background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:11,padding:"8px 0",fontWeight:600 }}>
                      View all {events.length} events →
                    </button>
                  )}
                </div>
              )}
              {events.length === 0 && syncReady && (
                <div style={{ textAlign:"center",padding:"32px 16px",color:C.slate }}>
                  <div style={{ fontSize:32,marginBottom:8 }}>🏐</div>
                  <div style={{ fontSize:12 }}>Play the video and tap an event button when something happens</div>
                </div>
              )}
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === "events" && (
            <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
              <div style={{ padding:"12px 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0 }}>
                <input type="text" placeholder="Filter events…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ width:"100%",background:C.panelB,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.white,fontSize:12,outline:"none" }} />
              </div>
              <div style={{ flex:1,overflowY:"auto" }}>
                {filteredEvents.length === 0 ? (
                  <div style={{ textAlign:"center",padding:32,color:C.slate,fontSize:12 }}>
                    {events.length===0?"No events tagged yet":"No events match your filter"}
                  </div>
                ) : filteredEvents.map((ev,i) => <EventRow key={ev.id} ev={ev} index={i} onJump={handleJump} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {pendingEvent && (
        <OutcomeModal event={pendingEvent.ev} team={team} gameTime={pendingEvent.gameTime} videoTime={pendingEvent.videoTime}
          onConfirm={handleConfirm} onCancel={() => { setPendingEvent(null); videoRef.current?.play(); }} />
      )}
    </div>
  );
}
