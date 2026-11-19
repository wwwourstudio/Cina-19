// director-hub.jsx — Director hub: chat at center + Status rail + Pulse rail.
// Wraps ChatPanel with at-a-glance project state on either side.
// Fully responsive: rails collapse below the chat on tablet, hide on phone
// (their actions live in the nav + command palette). Fluid type via clamp().

const { useState: useStateDH, useEffect: useEffectDH } = React;

// One-time responsive stylesheet for the hub.
if (typeof document !== "undefined" && !document.getElementById("dh-css")) {
  const s = document.createElement("style"); s.id = "dh-css";
  s.textContent = `
  .dh-wrap { display: flex; height: 100%; min-height: 0; background: var(--c-bg); }
  .dh-center { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
  .dh-rail {
    flex-shrink: 0; overflow-y: auto; padding: 18px 16px;
    background: var(--c-panel);
    display: flex; flex-direction: column; gap: 22px;
  }
  .dh-rail--left  { width: clamp(220px, 17vw, 268px); border-right: 1px solid var(--c-line); }
  .dh-rail--right { width: clamp(224px, 18vw, 280px); border-left: 1px solid var(--c-line); }
  .dh-stage {
    padding: 9px 10px;
    border: 1px solid var(--c-line); border-radius: var(--r-1); background: var(--c-bg);
    text-align: left; cursor: pointer; color: inherit; width: 100%;
    transition: border-color .14s ease, background .14s ease;
  }
  .dh-stage:hover { border-color: var(--c-amber); background: var(--c-panel-2); }
  .dh-card {
    padding: 10px 12px;
    border: 1px solid var(--c-line); border-radius: var(--r-1); background: var(--c-bg);
    text-align: left; cursor: pointer; color: inherit; width: 100%;
    transition: border-color .14s ease, color .14s ease, background .14s ease;
  }
  .dh-card:hover { border-color: var(--c-amber); background: var(--c-panel-2); }
  .dh-label {
    font-size: var(--fs-label); color: var(--c-ink-4); letter-spacing: .16em;
    padding-bottom: 8px; border-bottom: 1px solid var(--c-line);
    display: flex; align-items: center; justify-content: space-between;
  }
  /* Tablet: fold the rails under the chat as horizontal scrollers */
  @media (max-width: 960px) {
    .dh-wrap { flex-direction: column; overflow-y: auto; }
    .dh-center { order: -1; min-height: 62vh; }
    .dh-rail { width: auto; border: none; border-top: 1px solid var(--c-line);
      flex-direction: row; gap: 16px; overflow-x: auto; }
    .dh-rail > div { min-width: 240px; flex-shrink: 0; }
  }
  /* Phone: chat only — rail actions live in nav + command palette */
  @media (max-width: 680px) {
    .dh-rail { display: none; }
  }`;
  document.head.appendChild(s);
}

// Pull the freshest pipeline numbers if the bridge is present; else sensible defaults.
function livePipeline(kind) {
  try {
    if (window.CinaPipeline && window.CinaPipeline.snapshot) {
      const s = window.CinaPipeline.snapshot(kind);
      if (s && s.stages) return s;
    }
  } catch {}
  return null;
}

function StatusRail({ kind = "movie" }) {
  const STAGES = {
    movie: [
      { label: "Script",   pct: 86, note: "Act 3 in revision",     view: "script"   },
      { label: "Board",    pct: 72, note: "12 of 18 shots locked", view: "board"    },
      { label: "Generate", pct: 54, note: "26 renders queued",     view: "generate" },
      { label: "Editor",   pct: 31, note: "Rough cut · 22 min",     view: "editor"   },
    ],
    series: [
      { label: "Writers' room", pct: 74, note: "Ep 3 of 8 drafted",   view: "script"   },
      { label: "Episodes",      pct: 38, note: "2 of 8 locked",       view: "episodes" },
      { label: "Board",         pct: 60, note: "Ep 1–2 boarded",       view: "board"    },
      { label: "Generate",      pct: 42, note: "Ep 1 rendering",      view: "generate" },
    ],
    branched: [
      { label: "Spine",    pct: 82, note: "Locked · 1h 30m",          view: "script"   },
      { label: "Forks",    pct: 66, note: "4 forks · 18 cuts",        view: "branch"   },
      { label: "Board",    pct: 54, note: "Fork A–C boarded",         view: "board"    },
      { label: "Generate", pct: 40, note: "Branch renders queued",   view: "generate" },
    ],
  };
  const stages = (livePipeline(kind) || {}).stages || STAGES[kind] || STAGES.movie;

  const suggestions = React.useMemo(() => {
    const out = [];
    const behind = [...stages].sort((a, b) => a.pct - b.pct)[0];
    if (behind) out.push({ text: `${behind.label} is furthest behind at ${behind.pct}% — want me to push it?`, view: behind.view, tag: behind.label.toUpperCase() });
    const gen = stages.find(s => /generate/i.test(s.label));
    if (gen) out.push({ text: `Approve the finished takes in the render queue.`, view: "generate", tag: "VIDEO" });
    out.push({ text: `Tighten the pacing on the latest cut — pull two beats.`, view: "editor", tag: "EDIT" });
    return out;
  }, [stages]);

  const fmt = (window.CINA_FORMATS || {})[kind] || { tag: "FILM" };
  return (
    <aside className="dh-rail dh-rail--left">
      <div>
        <div className="t-mono dh-label" style={{ marginBottom: 10 }}>
          <span>{fmt.tag} · WORKFLOW</span>
          <span className="t-num" style={{ color: "var(--c-ink-3)" }}>{stages.length} STAGES</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stages.map(s => (
            <button key={s.label} className="dh-stage"
              onClick={() => window.dispatchEvent(new CustomEvent("cina:setView", { detail: s.view }))}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--c-ink)" }}>{s.label}</span>
                <span className="t-mono t-num" style={{ fontSize: "var(--fs-label)", color: s.pct >= 80 ? "var(--c-good)" : "var(--c-amber)" }}>{s.pct}%</span>
              </div>
              <div style={{ height: 2, background: "var(--c-line)", overflow: "hidden", margin: "6px 0" }}>
                <div style={{ width: `${s.pct}%`, height: "100%", background: s.pct >= 80 ? "var(--c-good)" : "var(--c-amber)" }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--fs-label)", color: "var(--c-ink-3)" }}>
                <span>{s.note}</span>
                <span className="t-mono" style={{ color: "var(--c-ink-4)" }}>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="t-mono dh-label" style={{ marginBottom: 10 }}>
          <span>DIRECTOR NOTES</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {suggestions.map((s, i) => (
            <button key={i} className="dh-card"
              onClick={() => { if (s.view) window.dispatchEvent(new CustomEvent("cina:setView", { detail: s.view })); window.dispatchEvent(new CustomEvent("cina:promptSend", { detail: s.text })); }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--c-ink)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--c-ink-2)"}
            >
              <div className="t-mono" style={{ fontSize: "9.5px", letterSpacing: ".14em", color: "var(--c-amber)", marginBottom: 4 }}>{s.tag}</div>
              <div style={{ fontSize: "clamp(12px, .85vw, 13px)", lineHeight: 1.45, color: "var(--c-ink-2)", fontFamily: "var(--f-display)", fontStyle: "italic" }}>{s.text}</div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function PulseRail() {
  const renders = [
    { ttl: "Shot 14 · take 3", status: "DONE",     time: "2m" },
    { ttl: "Shot 09 · take 2", status: "DONE",     time: "8m" },
    { ttl: "Shot 21 · take 1", status: "RENDER",   time: "now", pct: 64 },
    { ttl: "Shot 22 · take 1", status: "QUEUED",   time: "—" },
  ];
  const comments = [
    { who: "@quietframe",   text: "The amber wash in shot 14 is doing it.",       on: "Last Light" },
    { who: "@nightcaller",  text: "Need that diner scene as a poster.",            on: "Last Light" },
    { who: "@kerosene",     text: "Pacing in act 2 felt off — could trim.",        on: "Last Light" },
  ];
  return (
    <aside className="dh-rail dh-rail--right">
      <div>
        <div className="t-mono dh-label" style={{ marginBottom: 10 }}>
          <span>RENDER QUEUE</span>
          <span className="t-num" style={{ color: "var(--c-amber)" }}>{renders.length} SHOTS</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {renders.map((r, i) => (
            <button key={i} className="dh-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}
              onClick={() => window.dispatchEvent(new CustomEvent("cina:setView", { detail: "generate" }))}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%" }}>
                <span style={{ fontSize: "var(--fs-body)", color: "var(--c-ink)", fontWeight: 500 }}>{r.ttl}</span>
                <span className="t-mono t-num" style={{
                  fontSize: "var(--fs-label)", letterSpacing: ".12em",
                  color: r.status === "DONE" ? "var(--c-good)" : r.status === "RENDER" ? "var(--c-amber)" : "var(--c-ink-4)",
                }}>{r.status}</span>
              </div>
              {r.pct != null ? (
                <div style={{ height: 2, width: "100%", background: "var(--c-line)", overflow: "hidden" }}>
                  <div style={{ width: `${r.pct}%`, height: "100%", background: "var(--c-amber)" }}/>
                </div>
              ) : (
                <span className="t-mono t-num" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)" }}>{r.time}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="t-mono dh-label" style={{ marginBottom: 10 }}>
          <span>AUDIENCE SCREENING</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {comments.map((c, i) => (
            <button key={i} className="dh-card"
              onClick={() => window.dispatchEvent(new CustomEvent("cina:setView", { detail: "memory" }))}>
              <div style={{ fontSize: "clamp(12px, .85vw, 13px)", lineHeight: 1.45, color: "var(--c-ink-2)", marginBottom: 4, fontStyle: "italic", fontFamily: "var(--f-display)" }}>
                "{c.text}"
              </div>
              <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)", letterSpacing: ".08em" }}>
                {c.who} · {c.on}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function DirectorHub({ kind = "movie", sub: controlledSub, setSub: setControlledSub, hideSubTabs = false }) {
  const [localSub, setLocalSub] = useStateDH("room");
  const sub = controlledSub || localSub;
  const setSub = setControlledSub || setLocalSub;

  useEffectDH(() => {
    if (controlledSub) return;
    const onSub = (e) => {
      if (e.detail && e.detail.view === "chat" && e.detail.sub) {
        setLocalSub(e.detail.sub);
      }
    };
    window.addEventListener("cina:studioSubTab", onSub);
    return () => window.removeEventListener("cina:studioSubTab", onSub);
  }, [controlledSub]);

  const TABS = [
    { id: "room", label: "Writers' Room · Gemini" },
    { id: "live", label: "Live Voice Rehearsal" },
    { id: "vault", label: "Cloud Slate Vault" },
  ];

  const AI = window.CinaStudioAI || {};

  return (
    <div className="dh-wrap">
      <StatusRail kind={kind}/>
      <div className="dh-center">
        {!hideSubTabs && (
          <div role="tablist" style={{ display: "flex", borderBottom: "1px solid var(--c-line)", background: "var(--c-panel)", padding: "0 1.2rem", flexShrink: 0 }}>
            {TABS.map(t => {
              const on = sub === t.id;
              return (
                <button key={t.id} role="tab" aria-selected={on} onClick={() => setSub(t.id)} style={{
                  padding: "0.7rem 1rem", background: "transparent", border: "none",
                  borderBottom: on ? "2px solid var(--c-amber)" : "2px solid transparent",
                  borderRadius: 0, cursor: "pointer",
                  fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".12em",
                  textTransform: "uppercase", color: on ? "var(--c-amber)" : "var(--c-ink-3)", fontWeight: on ? 700 : 500,
                }}>{t.label}</button>
              );
            })}
          </div>
        )}
        {sub === "room" && <ChatPanel/>}
        {sub === "live" && (AI.StudioLiveRehearsal ? <AI.StudioLiveRehearsal/> : <ChatPanel/>)}
        {sub === "vault" && (AI.StudioCloudVault ? <AI.StudioCloudVault/> : <ChatPanel/>)}
      </div>
      <PulseRail/>
    </div>
  );
}

Object.assign(window, { DirectorHub });
