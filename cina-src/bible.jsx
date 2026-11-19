// bible.jsx — Film Bible (DNA): now interactive end-to-end.
// Tabs actually switch, edit-in-place, sliders for DNA weights, palette
// editor with re-tinting, rule add/remove/reorder, and a "Save & propagate"
// CTA that pushes changes back to the FILM_BIBLE store.

const { useState: usBb, useEffect: ueBb, useMemo: umBb, useRef: urBb } = React;


// Inject responsive layout & clean range/input polish for 01 DNA
if (typeof document !== "undefined" && !document.getElementById("bb-css")) {
  const s = document.createElement("style"); s.id = "bb-css";
  s.textContent = `
  .bb-hero-inner { max-width: 1120px; display: flex; gap: 28px; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; }
  .bb-body { padding: 28px clamp(18px, 3vw, 40px) 60px; max-width: 1160px; }
  .bb-grid-2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; }
  .bb-rules-grid { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 10px 18px; }
  .bb-dna-row {
    padding: 14px 16px; background: var(--c-panel); border: 1px solid var(--c-line);
    border-radius: var(--r-1); display: grid;
    grid-template-columns: minmax(150px, 190px) minmax(120px, 150px) 1fr auto;
    gap: 16px; align-items: center;
  }
  .bb-palette-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 12px; }
  .bb-cast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .bb-royalty {
    margin-top: 22px; padding: 16px 18px;
    background: linear-gradient(135deg, rgba(var(--accent-rgb),.06) 0%, var(--c-panel) 70%);
    border: 1px solid rgba(var(--accent-rgb),.32); border-radius: var(--r-1);
    display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  }
  .bb-edit-line { border-bottom: 1px dashed var(--c-line-2); transition: border-color .14s ease; }
  .bb-edit-line:hover { border-bottom-color: var(--c-ink-3); }
  .bb-edit-line:focus { border-bottom-color: var(--c-amber); }
  @media (max-width: 820px) {
    .bb-grid-2 { grid-template-columns: 1fr; }
    .bb-dna-row { grid-template-columns: 1fr auto; gap: 10px 12px; }
    .bb-dna-row > :nth-child(2) { grid-column: 1 / -1; }
    .bb-dna-row > :nth-child(3) { grid-column: 1 / -2; }
  }`;
  document.head.appendChild(s);
}

function BiblePanel() {
  const base = (window.CinaPipeline && typeof window.CinaPipeline.hydrateDna === "function")
    ? window.CinaPipeline.hydrateDna()
    : window.FILM_BIBLE;
  const [bible, setBible] = usBb(() => ({ ...base, director_dna: [...base.director_dna], rules: [...base.rules], palette: base.palette.map(p => ({ ...p })) }));
  const [tab, setTab] = usBb("tone");
  const [dirty, setDirty] = usBb(false);
  const [showSaved, setShowSaved] = usBb(false);
  const bibleRef = urBb(bible);
  bibleRef.current = bible;

  ueBb(() => {
    const onSub = (e) => {
      if (e.detail?.view === "bible" && e.detail.sub) setTab(e.detail.sub);
    };
    const onDna = (e) => {
      const next = e.detail;
      if (!next || next === bibleRef.current) return;
      setBible(prev => ({
        ...prev,
        ...next,
        director_dna: Array.isArray(next.director_dna) ? [...next.director_dna] : prev.director_dna,
        rules: Array.isArray(next.rules) ? [...next.rules] : prev.rules,
        palette: Array.isArray(next.palette) ? next.palette.map(p => ({ ...p })) : prev.palette,
      }));
    };
    window.addEventListener("cina:studioSubTab", onSub);
    window.addEventListener("cina:dna-updated", onDna);
    return () => {
      window.removeEventListener("cina:studioSubTab", onSub);
      window.removeEventListener("cina:dna-updated", onDna);
    };
  }, []);

  const patch = (next) => { setBible(next); bibleRef.current = next; setDirty(true); };

  const save = (andNext = false) => {
    const cur = bibleRef.current;
    if (window.CinaPipeline && typeof window.CinaPipeline.propagateDna === "function") {
      window.CinaPipeline.propagateDna(cur);
    } else {
      window.FILM_BIBLE = { ...window.FILM_BIBLE, ...cur };
    }
    setDirty(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2200);
    if (window.toast) window.toast({ title: andNext ? "01 DNA → 02 SCRIPT" : "DNA UPDATED", text: andNext ? "Synced to Script & Crew — advancing to 02 Script." : "Propagated to crew agents · Pipeline synced", kind: "good" });
    if (andNext) {
      if (window.CinaPipeline) window.CinaPipeline.go("script");
      else window.dispatchEvent(new CustomEvent("cina:setView", { detail: "script" }));
    }
  };
  const saveRef = urBb(save);
  saveRef.current = save;

  ueBb(() => {
    if (!window.CinaPipeline?.registerSendNext) return;
    return window.CinaPipeline.registerSendNext("bible", () => {
      saveRef.current(true);
      return true;
    });
  }, []);

  const reset = () => {
    const fresh = (window.CinaPipeline && typeof window.CinaPipeline.hydrateDna === "function")
      ? window.CinaPipeline.hydrateDna()
      : window.FILM_BIBLE;
    setBible({ ...fresh, director_dna: [...fresh.director_dna], rules: [...fresh.rules], palette: fresh.palette.map(p => ({ ...p })) });
    setDirty(false);
  };

  const TABS = [
    { id: "tone",       label: "Tone & rules" },
    { id: "director",   label: "Director DNA" },
    { id: "palette",    label: "Palette" },
    { id: "characters", label: "Characters" },
    { id: "scout",      label: "Locations & Scout" },
  ];

  return (
    <div className="sc-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
      {/* Hero */}
      <div style={{
        position: "relative", padding: "26px clamp(18px, 3vw, 40px) 24px",
        borderBottom: "1px solid var(--c-line)",
        background: `linear-gradient(180deg, ${tkc("void")} 0%, var(--c-bg) 100%)`,
      }}>
        <div className="bb-hero-inner">
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".14em" }}>01 · PROJECT DNA</span>
              <span aria-hidden="true" style={{ color: "var(--c-ink-4)" }}>·</span>
              <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: dirty ? "var(--c-warn)" : "var(--c-ink-4)", letterSpacing: ".1em" }}>
                {dirty ? "UNSAVED EDITS" : "SYNCED TO CREW"}
              </span>
            </div>
            <EditableHeadline value={bible.title} onChange={v => patch({ ...bible, title: v })}/>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
              {bible.genre.map((g, i) => (
                <EditableChip key={i} value={g}
                  onChange={(v) => { const next = [...bible.genre]; if (v === "") next.splice(i, 1); else next[i] = v; patch({ ...bible, genre: next }); }}/>
              ))}
              <button onClick={() => patch({ ...bible, genre: [...bible.genre, "NEW TAG"] })} style={{
                padding: "4px 10px", border: "1px dashed var(--c-line-2)", borderRadius: "var(--r-1)",
                fontSize: "var(--fs-label)", fontFamily: "var(--f-mono)", color: "var(--c-ink-3)",
                textTransform: "uppercase", letterSpacing: ".08em",
                background: "transparent", cursor: "pointer",
              }}>+ Tag</button>
            </div>
            <EditableLogline value={bible.logline} onChange={v => patch({ ...bible, logline: v })}/>
          </div>

          {/* Save controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
            {showSaved && (
              <div style={{
                padding: "4px 10px",
                fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em",
                color: "var(--c-good)", border: "1px solid rgba(106,163,122,.4)",
                background: "rgba(106,163,122,.08)", borderRadius: "var(--r-1)",
              }}>✓ SAVED &amp; PROPAGATED</div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {dirty && (
                <button onClick={reset} className="btn btn-ghost" style={{ height: 34 }}>Discard</button>
              )}
              <button onClick={() => save(false)} disabled={!dirty} className={dirty ? "btn btn-primary" : "btn btn-ghost"} style={{
                height: 34, padding: "0 16px",
                opacity: dirty ? 1 : 0.6, cursor: dirty ? "pointer" : "default",
              }}>{dirty ? "Save & Sync DNA" : "✓ Synced"}</button>
            </div>
            <div className="t-mono" style={{ fontSize: "10px", color: "var(--c-ink-4)", letterSpacing: ".12em", textTransform: "uppercase" }}>
              Propagates to all 5 crew agents
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0, padding: "0 clamp(14px, 2.5vw, 32px)",
        borderBottom: "1px solid var(--c-line)", background: "var(--c-panel)",
        overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            padding: "11px 16px", fontSize: "var(--fs-label)", fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? "var(--c-amber)" : "var(--c-ink-3)",
            borderRadius: 0, whiteSpace: "nowrap", flexShrink: 0,
            borderBottom: tab === t.id ? "2px solid var(--c-amber)" : "2px solid transparent",
            marginBottom: -1, cursor: "pointer",
            fontFamily: "var(--f-mono)", textTransform: "uppercase", letterSpacing: ".1em",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Body */}
      <div className="bb-body">
        {tab === "tone"       && <ToneRulesTab bible={bible} patch={patch}/>}
        {tab === "director"   && <DirectorDnaTab bible={bible} patch={patch}/>}
        {tab === "palette"    && <PaletteTab bible={bible} patch={patch}/>}
        {tab === "characters" && <CharactersTab/>}
        {tab === "scout"      && window.CinaStudioAI?.StudioLocationScoutTab && <window.CinaStudioAI.StudioLocationScoutTab/>}
      </div>
    </div>
  );
}

// ─── Editable primitives ─────────────────────────────────────────────────
function EditableHeadline({ value, onChange }) {
  const [v, setV] = usBb(value);
  ueBb(() => setV(value), [value]);
  return (
    <input value={v} onChange={e => setV(e.target.value)} onBlur={() => onChange(v)}
      onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
      title="Click to rename project"
      className="bb-edit-line"
      style={{
        width: "100%", padding: "2px 0 4px", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none",
        outline: "none", color: "var(--c-ink)",
        fontFamily: "var(--f-display)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 400,
        letterSpacing: "-0.02em", lineHeight: 1.05, textTransform: "uppercase",
      }}/>
  );
}
function EditableLogline({ value, onChange }) {
  const [v, setV] = usBb(value);
  ueBb(() => setV(value), [value]);
  return (
    <textarea value={v} onChange={e => setV(e.target.value)} onBlur={() => onChange(v)}
      title="Click to edit logline"
      className="bb-edit-line"
      rows={2}
      style={{
        width: "100%", marginTop: 16, padding: "4px 0", resize: "none",
        background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", outline: "none",
        color: "var(--c-ink-2)",
        fontFamily: "var(--f-display)", fontStyle: "italic",
        fontSize: "var(--fs-lead)", lineHeight: 1.5, maxWidth: 680,
      }}/>
  );
}
function EditableChip({ value, onChange }) {
  const [v, setV] = usBb(value);
  ueBb(() => setV(value), [value]);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 6px 4px 10px", border: "1px solid var(--c-line-2)",
      background: "var(--c-panel)",
      borderRadius: "var(--r-1)", fontSize: "var(--fs-label)", fontFamily: "var(--f-mono)",
      color: "var(--c-ink-2)", textTransform: "uppercase", letterSpacing: ".08em",
    }}>
      <input value={v} onChange={e => setV(e.target.value)} onBlur={() => onChange(v)}
        onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
        size={Math.max(4, v.length)}
        style={{
          background: "transparent", border: "none", outline: "none",
          color: "inherit", fontFamily: "inherit", fontSize: "inherit", letterSpacing: "inherit",
          textTransform: "inherit", minWidth: 44,
        }}/>
      <button onClick={() => onChange("")} title="Remove tag" style={{
        width: 16, height: 16, background: "transparent",
        border: "none", color: "var(--c-ink-4)", cursor: "pointer",
        fontSize: "var(--fs-body)", padding: 0, lineHeight: 1,
      }}>×</button>
    </span>
  );
}

// ─── Tone & rules ────────────────────────────────────────────────────────
function ToneRulesTab({ bible, patch }) {
  const setRule = (i, v) => { const next = [...bible.rules]; next[i] = v; patch({ ...bible, rules: next }); };
  const removeRule = (i) => { const next = [...bible.rules]; next.splice(i, 1); patch({ ...bible, rules: next }); };
  const moveRule = (i, dir) => {
    const j = i + dir; if (j < 0 || j >= bible.rules.length) return;
    const next = [...bible.rules]; [next[i], next[j]] = [next[j], next[i]]; patch({ ...bible, rules: next });
  };
  const addRule = () => patch({ ...bible, rules: [...bible.rules, "New rule. Click to edit."] });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div className="bb-grid-2">
        <section>
          <div className="t-label" style={{ marginBottom: 10 }}>Tone &amp; Atmosphere</div>
          <textarea value={bible.tone} onChange={e => patch({ ...bible, tone: e.target.value })}
            rows={5} style={{
              width: "100%", padding: 14, resize: "vertical",
              background: "var(--c-panel)", border: "1px solid var(--c-line)",
              borderRadius: "var(--r-1)", color: "var(--c-ink)",
              fontFamily: "var(--f-display)", fontStyle: "italic",
              fontSize: "var(--fs-lead)", lineHeight: 1.55, outline: "none",
            }}/>
        </section>

        <section>
          <div className="t-label" style={{ marginBottom: 10 }}>DNA Scope &amp; Constraints</div>
          <div style={{
            padding: 16, background: "var(--c-panel)", border: "1px solid var(--c-line)",
            borderRadius: "var(--r-1)", fontSize: "var(--fs-body)", color: "var(--c-ink-2)", lineHeight: 1.6,
          }}>
            <div style={{ marginBottom: 10 }}>
              Inline title, genre tags, logline, tone, and rules sync directly to Script, Cast, Stills, and Video prompts.
            </div>
            <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)", letterSpacing: ".08em" }}>
              TAGS ACTIVE: {bible.genre.join(" · ") || "NONE"}
            </div>
          </div>
        </section>
      </div>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="t-label">Rules of the world · <span className="t-num">{bible.rules.length}</span></span>
          <button onClick={addRule} className="btn btn-ghost" style={{ height: 30, fontSize: "var(--fs-label)" }}>
            + Add rule
          </button>
        </div>
        <ol className="bb-rules-grid">
          {bible.rules.map((r, i) => (
            <li key={i} style={{
              display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10,
              padding: "10px 14px",
              background: "var(--c-panel)", border: "1px solid var(--c-line)",
              borderRadius: "var(--r-1)", alignItems: "center",
            }}>
              <span className="t-mono t-num" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", flexShrink: 0 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <input value={r} onChange={e => setRule(i, e.target.value)} style={{
                flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
                color: "var(--c-ink)", fontSize: "var(--fs-body)", lineHeight: 1.5,
                fontFamily: "var(--f-sans)",
              }}/>
              <div style={{ display: "flex", gap: 3 }}>
                <RuleBtn onClick={() => moveRule(i, -1)} title="Move up">↑</RuleBtn>
                <RuleBtn onClick={() => moveRule(i, 1)} title="Move down">↓</RuleBtn>
                <RuleBtn onClick={() => removeRule(i)} title="Delete rule" danger>×</RuleBtn>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function RuleBtn({ onClick, children, title, danger }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 24, height: 24, background: "var(--c-bg)",
      border: "1px solid var(--c-line)", borderRadius: "var(--r-1)",
      color: danger ? "var(--c-blood-l)" : "var(--c-ink-3)",
      cursor: "pointer", fontSize: "var(--fs-body)", padding: 0, lineHeight: 1,
    }}>{children}</button>
  );
}

// ─── Director DNA ────────────────────────────────────────────────────────
function DirectorDnaTab({ bible, patch }) {
  const setWeight = (i, w) => {
    const next = bible.director_dna.map((d, j) => j === i ? { ...d, weight: w } : d);
    const sum = next.reduce((s, d) => s + d.weight, 0) || 1;
    patch({ ...bible, director_dna: next.map(d => ({ ...d, weight: d.weight / sum })) });
  };
  const setNote = (i, v) => {
    patch({ ...bible, director_dna: bible.director_dna.map((d, j) => j === i ? { ...d, note: v } : d) });
  };
  const setName = (i, v) => {
    patch({ ...bible, director_dna: bible.director_dna.map((d, j) => j === i ? { ...d, name: v } : d) });
  };
  const removeDna = (i) => {
    if (bible.director_dna.length <= 1) return;
    const next = [...bible.director_dna]; next.splice(i, 1);
    const sum = next.reduce((s, d) => s + d.weight, 0) || 1;
    patch({ ...bible, director_dna: next.map(d => ({ ...d, weight: d.weight / sum })) });
  };
  const addDna = () => {
    const next = [...bible.director_dna, { name: "New", weight: 0.1, note: "Describe the borrowed move." }];
    const sum = next.reduce((s, d) => s + d.weight, 0);
    patch({ ...bible, director_dna: next.map(d => ({ ...d, weight: d.weight / sum })) });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Director DNA · {bible.director_dna.length} influences</div>
          <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "var(--fs-title)", color: "var(--c-ink)", fontWeight: 500, letterSpacing: "-0.01em" }}>
            What your film borrows from, and how much.
          </div>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-3)", marginTop: 6, lineHeight: 1.5, maxWidth: 600 }}>
            Each influence routes 5% of the film's revenue back to the cited director (or estate) via the Royalty Pool. Weights auto-normalize.
          </div>
        </div>
        <button onClick={addDna} className="btn btn-ghost" style={{ height: 32 }}>+ Add influence</button>
      </div>

      {/* Visual weight bar */}
      <div style={{ display: "flex", height: 28, borderRadius: "var(--r-1)", overflow: "hidden", marginBottom: 16, border: "1px solid var(--c-line)" }}>
        {bible.director_dna.map((d, i) => (
          <div key={i} className="t-num" style={{
            flex: d.weight,
            background: ["var(--c-amber)", tkc("bad"), tkc("cat-1"), tkc("cat-2"), tkc("cat-4"), tkc("good")][i % 6],
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--c-on-amber)", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)",
            fontWeight: 700, letterSpacing: ".06em",
          }}>
            {d.weight > 0.08 ? `${d.name.split(" ").pop()} ${(d.weight * 100).toFixed(0)}%` : ""}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bible.director_dna.map((d, i) => {
          const color = ["var(--c-amber)", tkc("bad"), tkc("cat-1"), tkc("cat-2"), tkc("cat-4"), tkc("good")][i % 6];
          return (
            <div key={i} className="bb-dna-row">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "var(--r-1)", background: color, flexShrink: 0 }}/>
                <input value={d.name} onChange={e => setName(i, e.target.value)} style={{
                  width: "100%", background: "transparent", border: "none", outline: "none",
                  color: "var(--c-ink)", fontFamily: "var(--f-display)", fontStyle: "italic",
                  fontSize: "var(--fs-lead)", fontWeight: 500, letterSpacing: "-0.01em",
                }}/>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="range" min="1" max="100" value={Math.round(d.weight * 100)}
                  onChange={e => setWeight(i, +e.target.value / 100)}
                  style={{ flex: 1, minWidth: 80, accentColor: color }}/>
                <span className="t-mono t-num" style={{ fontSize: "var(--fs-label)", color, fontWeight: 700, width: 34, textAlign: "right" }}>
                  {(d.weight * 100).toFixed(0)}%
                </span>
              </div>
              <input value={d.note} onChange={e => setNote(i, e.target.value)} style={{
                background: "transparent", border: "none", outline: "none", minWidth: 0,
                color: "var(--c-ink-2)", fontSize: "var(--fs-body)", lineHeight: 1.5,
                fontFamily: "var(--f-sans)",
              }}/>
              <button onClick={() => removeDna(i)} disabled={bible.director_dna.length <= 1} title="Remove influence" style={{
                width: 26, height: 26, background: "var(--c-bg)",
                border: "1px solid var(--c-line)", borderRadius: "var(--r-1)",
                color: "var(--c-blood-l)", cursor: bible.director_dna.length <= 1 ? "not-allowed" : "pointer",
                opacity: bible.director_dna.length <= 1 ? 0.35 : 1,
                fontSize: "var(--fs-body)", padding: 0, lineHeight: 1,
              }}>×</button>
            </div>
          );
        })}
      </div>

      {/* Royalty preview */}
      <div className="bb-royalty">
        <div>
          <div className="t-label" style={{ color: "var(--c-amber)", marginBottom: 4 }}>ROYALTY ROUTE PREVIEW</div>
          <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "var(--fs-lead)", color: "var(--c-ink)" }}>
            $1,000 in film revenue routes <em style={{ color: "var(--c-amber)" }}>$50</em> to the Royalty Pool: {bible.director_dna.map(d => `${d.name} $${(d.weight * 50).toFixed(2)}`).join(" · ")}
          </div>
        </div>
        <a href="index.html#/royalty" className="btn btn-ghost" style={{ borderColor: "var(--c-amber)", color: "var(--c-amber)", textDecoration: "none" }}>
          View pool →
        </a>
      </div>
    </div>
  );
}

// ─── Palette ─────────────────────────────────────────────────────────────
function PaletteTab({ bible, patch }) {
  const setColor = (i, hex) => patch({ ...bible, palette: bible.palette.map((p, j) => j === i ? { ...p, hex } : p) });
  const setName = (i, v) => patch({ ...bible, palette: bible.palette.map((p, j) => j === i ? { ...p, name: v } : p) });
  const setUsage = (i, v) => patch({ ...bible, palette: bible.palette.map((p, j) => j === i ? { ...p, usage: v } : p) });
  const removeColor = (i) => {
    if (bible.palette.length <= 1) return;
    const next = [...bible.palette]; next.splice(i, 1);
    patch({ ...bible, palette: next });
  };
  const addColor = () => patch({ ...bible, palette: [...bible.palette, { name: "New swatch", hex: tkc("ink-3"), usage: "Describe usage." }] });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Palette · {bible.palette.length} swatches</div>
          <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "var(--fs-title)", color: "var(--c-ink)", fontWeight: 500, letterSpacing: "-0.01em" }}>
            The colors your film allows itself to use.
          </div>
        </div>
        <button onClick={addColor} className="btn btn-ghost" style={{ height: 32 }}>+ Add color</button>
      </div>

      {/* Combined palette strip */}
      <div style={{ display: "flex", height: 56, borderRadius: "var(--r-1)", overflow: "hidden", marginBottom: 16, border: "1px solid var(--c-line)" }}>
        {bible.palette.map((p, i) => (
          <div key={i} style={{ flex: 1, background: p.hex }} title={`${p.name} · ${p.hex}`}/>
        ))}
      </div>

      <div className="bb-palette-grid">
        {bible.palette.map((p, i) => (
          <div key={i} style={{
            background: "var(--c-panel)", border: "1px solid var(--c-line)",
            borderRadius: "var(--r-1)", overflow: "hidden", position: "relative",
          }}>
            <label style={{ display: "block", position: "relative", height: 84, background: p.hex, cursor: "pointer" }}>
              <input type="color" value={p.hex} onChange={e => setColor(i, e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}/>
              <span style={{
                position: "absolute", bottom: 6, left: 8,
                padding: "2px 6px", background: "rgba(0,0,0,.55)",
                fontFamily: "var(--f-mono)", fontSize: "10px",
                letterSpacing: ".12em", color: "rgba(255,255,255,.88)",
              }}>PICK</span>
            </label>
            <div style={{ padding: "10px 12px" }}>
              <input value={p.name} onChange={e => setName(i, e.target.value)} style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                color: "var(--c-ink)",
                fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "var(--fs-lead)", fontWeight: 500,
                marginBottom: 4,
              }}/>
              <input value={p.hex.toUpperCase()} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setColor(i, e.target.value); }}
                style={{
                  width: "100%", background: "transparent", border: "none", outline: "none",
                  fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: "var(--c-amber)", marginBottom: 8,
                }}/>
              <input value={p.usage} onChange={e => setUsage(i, e.target.value)} style={{
                width: "100%", background: "var(--c-bg)", border: "1px solid var(--c-line)", outline: "none",
                color: "var(--c-ink-2)", fontSize: "var(--fs-label)", padding: "5px 8px", borderRadius: "var(--r-1)",
                fontFamily: "var(--f-sans)",
              }}/>
              <button onClick={() => removeColor(i)} disabled={bible.palette.length <= 1} className="btn btn-ghost" style={{
                marginTop: 8, width: "100%", height: 26, fontSize: "var(--fs-label)",
                color: "var(--c-blood-l)", opacity: bible.palette.length <= 1 ? 0.35 : 1,
                cursor: bible.palette.length <= 1 ? "not-allowed" : "pointer",
              }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Characters ──────────────────────────────────────────────────────────
function CharactersTab() {
  const characters = (window.CHARACTERS || []).slice(0, 6);
  const goVault = () => window.dispatchEvent(new CustomEvent("cina:setView", { detail: "vault" }));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Cast · {characters.length} characters</div>
          <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "var(--fs-title)", color: "var(--c-ink)", fontWeight: 500, letterSpacing: "-0.01em" }}>
            Who is in this story.
          </div>
        </div>
        <button onClick={goVault} className="btn btn-primary" style={{ height: 34 }}>
          Open Cast Vault →
        </button>
      </div>

      {characters.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", border: "1px dashed var(--c-line)", borderRadius: "var(--r-1)", color: "var(--c-ink-3)" }}>
          No characters cast yet. Open the Cast Vault to add performers.
        </div>
      ) : (
        <div className="bb-cast-grid">
          {characters.map(c => {
            const initials = (c.name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
            return (
              <button key={c.id || c.name} onClick={goVault} style={{
                padding: 14, background: "var(--c-panel)", border: "1px solid var(--c-line)",
                borderRadius: "var(--r-1)", display: "flex", gap: 12, alignItems: "flex-start",
                textAlign: "left", cursor: "pointer", transition: "border-color .14s ease",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--c-amber)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--c-line)"}
              >
                <div style={{
                  width: 58, height: 74, borderRadius: "var(--r-1)", overflow: "hidden",
                  background: c.color || "var(--c-panel-2)", flexShrink: 0,
                  border: "1px solid var(--c-line)", position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="t-mono" style={{ fontSize: "var(--fs-body)", color: "rgba(255,255,255,.55)", fontWeight: 700 }}>{initials}</span>
                  {c.photo && (
                    <img
                      src={c.photo}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      onError={e => { e.currentTarget.style.display = "none"; }}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "var(--fs-lead)", color: "var(--c-ink)", fontWeight: 500, lineHeight: 1.1 }}>{c.name}</div>
                  <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".12em", marginTop: 4, textTransform: "uppercase" }}>{c.role || c.archetype || "Lead"}</div>
                  {c.bio && <div style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-3)", lineHeight: 1.45, marginTop: 6 }}>{c.bio.slice(0, 82)}{c.bio.length > 82 ? "…" : ""}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { BiblePanel });
