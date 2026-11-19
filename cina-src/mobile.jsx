// mobile.jsx — Studio on phones: Slate home, full station strip, Director AI, Board, Crew & Surfaces.

const { useState: useStateM, useEffect: useEffectM } = React;

const MOB_CSS = `
.mob-home{position:relative;flex:1;min-height:0}
.mob-home .dsh-shell{padding-top:0}
.mob-home .dsh-wrap{padding-left:16px!important;padding-right:16px!important}
.mob-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:54px;border:none;background:transparent;font-size:var(--fs-label);font-family:var(--f-mono);text-transform:uppercase;letter-spacing:.08em;cursor:pointer;white-space:nowrap}
.mob-strip{display:flex;align-items:center;gap:2px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--c-line);background:var(--c-panel-2);padding:0 10px;flex-shrink:0}
.mob-strip::-webkit-scrollbar{display:none}
.mob-strip__btn{height:36px;padding:0 10px;border:none;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--c-ink-3);font-family:var(--f-mono);font-size:var(--fs-label);letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;flex-shrink:0;cursor:pointer}
.mob-strip__btn[aria-selected="true"]{color:var(--c-amber);border-bottom-color:var(--c-amber);background:rgba(var(--accent-rgb),.07);font-weight:700}
.mob-stage{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;position:relative}
.mob-stage > *{min-height:100%}
.mob-sheet-row{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:8px 4px;border:none;border-top:1px solid var(--c-line);background:transparent;color:var(--c-ink);text-align:left;cursor:pointer;font:inherit}
`;

function _mobStationsFor(kind) {
  return [
    { id: "chat",      label: "Director AI" },
    { id: "bible",     label: "01 DNA" },
    { id: "script",    label: "02 Script" },
    ...(kind === "series" ? [{ id: "episodes", label: "Episodes" }] : []),
    { id: "vault",     label: "03 Cast" },
    { id: "board",     label: "04 Stills" },
    { id: "generate",  label: "05 Video" },
    ...(kind === "branched" ? [{ id: "branch", label: "Branches" }] : []),
    { id: "editor",    label: "06 Edit" },
    { id: "cuts",      label: "Cuts" },
    { id: "score",     label: "Score" },
    { id: "titles",    label: "Titles" },
    { id: "mint",      label: "07 Splits" },
    { id: "deliver",   label: "Deliver" },
    { id: "watch",     label: "Premiere" },
    { id: "pipeline",  label: "Pipeline" },
    { id: "memory",    label: "Memory" },
    { id: "autopilot", label: "Autopilot" },
  ];
}

function MobileApp() {
  const _bootHandoff = window.__cinaStudioOpenFilm;
  const [tab, setTab] = useStateM(() => (_bootHandoff ? "station" : "home")); // home | station | board | crew
  const [activeView, setActiveView] = useStateM(() => {
    if (_bootHandoff && window.CinaPipeline?.resolveSmartView) {
      return window.CinaPipeline.resolveSmartView(_bootHandoff);
    }
    return "chat";
  });
  const [sheet, setSheet] = useStateM(null); // null | "films"
  const [page, setPage] = useStateM(null); // null | site | promo | analytics | new
  const [filmId, setFilmId] = useStateM(() => {
    if (_bootHandoff) {
      try { delete window.__cinaStudioOpenFilm; } catch (_) { window.__cinaStudioOpenFilm = null; }
      return _bootHandoff;
    }
    try { return window.__cinaActiveFilmId || localStorage.getItem("cina:active-film-id") || (window.PROJECTS[0] && window.PROJECTS[0].id); }
    catch (_) { return window.__cinaActiveFilmId || (window.PROJECTS[0] && window.PROJECTS[0].id); }
  });

  const film = window.PROJECTS.find(p => p.id === filmId) || window.PROJECTS[0];
  const kind = film?.kind || "movie";

  useEffectM(() => {
    window.__cinaActiveFilmId = filmId;
    if (window.CinaPipeline?.selectFilm) window.CinaPipeline.selectFilm(filmId);
    else { try { localStorage.setItem("cina:active-film-id", filmId); } catch (_) {} }
  }, [filmId]);

  useEffectM(() => {
    const onView = (e) => {
      if (!e.detail) return;
      if (["site", "promo", "analytics", "new"].includes(e.detail)) {
        setPage(e.detail);
        return;
      }
      if (["dashboard", "slate"].includes(e.detail)) {
        setPage(null); setTab("home");
        return;
      }
      setPage(null);
      setActiveView(e.detail);
      setTab(e.detail === "board" ? "board" : "station");
    };
    const onRoute = (e) => {
      const next = e.detail === "slate" ? "dashboard" : e.detail;
      if (next === "dashboard") { setPage(null); setTab("home"); }
      else if (["site", "promo", "analytics", "new"].includes(next)) { setPage(next); }
      else if (next === "studio") { setPage(null); setTab("station"); }
    };
    const onHome = () => { setPage(null); setTab("home"); };
    const onProj = (e) => { if (e.detail) setFilmId(e.detail); };
    window.__cinaStudioGo = (view, sub) => {
      if (["dashboard", "slate"].includes(view)) { setPage(null); setTab("home"); return; }
      if (["site", "promo", "analytics", "new"].includes(view)) { setPage(view); return; }
      setPage(null);
      setActiveView(view || "chat");
      setTab(view === "board" ? "board" : "station");
      if (sub) setTimeout(() => window.dispatchEvent(new CustomEvent("cina:studioSubTab", { detail: { view, sub } })), 40);
    };
    window.addEventListener("cina:setView", onView);
    window.addEventListener("cina:setRoute", onRoute);
    window.addEventListener("cina:studioHome", onHome);
    window.addEventListener("cina:setProject", onProj);
    return () => {
      window.removeEventListener("cina:setView", onView);
      window.removeEventListener("cina:setRoute", onRoute);
      window.removeEventListener("cina:studioHome", onHome);
      window.removeEventListener("cina:setProject", onProj);
    };
  }, []);

  const openFilm = (f, view) => {
    const id = typeof f === "string" ? f : (f && f.id);
    const targetId = id || filmId;
    if (targetId) setFilmId(targetId);
    const resolved = view || (window.CinaPipeline?.resolveSmartView ? window.CinaPipeline.resolveSmartView(f || targetId) : "bible");
    setPage(null);
    setSheet(null);
    setActiveView(resolved);
    setTab(resolved === "board" ? "board" : "station");
  };

  const pages = {
    site:      { label: "Site Builder",       el: window.StudioSitePanel ? <StudioSitePanel/> : null },
    promo:     { label: "Promotion",          el: window.StudioPromotionPage ? <StudioPromotionPage onOpenVault={() => { setPage(null); setActiveView("vault"); setTab("station"); }}/> : null },
    analytics: { label: "Director Analytics", el: window.StudioAnalyticsPage ? <StudioAnalyticsPage onOpenPromo={() => setPage("promo")} onOpenFilm={openFilm}/> : null },
    new:       { label: "New Production",     el: window.NewFilmFlow ? <NewFilmFlow initialKind={null} onCancel={() => setPage(null)} onCreate={() => { setPage(null); setActiveView("bible"); setTab("station"); }}/> : null },
  };

  const stations = _mobStationsFor(kind);
  const currentStation = tab === "board" ? "board" : activeView;

  const renderStation = (viewId) => {
    if (["editor", "cuts", "score", "titles", "dock"].includes(viewId) && window.UnifiedEditHub) {
      return <window.UnifiedEditHub activeView={viewId} setActiveView={(v) => setActiveView(v)} kind={kind} activeFilmId={filmId}/>;
    }
    if (["mint", "deliver", "watch"].includes(viewId) && window.UnifiedShipHub) {
      return <window.UnifiedShipHub activeView={viewId} setActiveView={(v) => setActiveView(v)}/>;
    }
    if (["chat", "pipeline", "memory", "autopilot"].includes(viewId) && window.UnifiedDirectorHub) {
      return <window.UnifiedDirectorHub activeView={viewId} setActiveView={(v) => setActiveView(v)} kind={kind}/>;
    }
    if (viewId === "bible" && window.BiblePanel)           return <BiblePanel/>;
    if (viewId === "script" && window.ScriptFlow)          return <ScriptFlow/>;
    if (viewId === "episodes" && window.EpisodesPanel)     return <EpisodesPanel/>;
    if (viewId === "vault" && window.VaultPanel)           return <VaultPanel/>;
    if (viewId === "board" && window.StoryboardPanel)      return <StoryboardPanel/>;
    if (viewId === "generate" && window.GeneratePanel)     return <GeneratePanel/>;
    if (viewId === "branch" && window.BranchTreePanel)     return <BranchTreePanel/>;
    if (window.ChatPanel) return <ChatPanel key={filmId}/>;
    return null;
  };

  const tabs = [
    { id: "home",    icon: "film",  label: "Slate" },
    { id: "station", icon: "wand",  label: "Studio" },
    { id: "board",   icon: "board", label: "Board" },
    { id: "crew",    icon: "actor", label: "Crew" },
  ];

  return (
    <div data-theme="dark" style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - var(--orb-safe, 0px))", width: "100vw", background: "var(--c-bg)", color: "var(--c-ink)", overflow: "hidden", position: "relative" }}>
      <style>{MOB_CSS}</style>
      {window.StudioSearch && <window.StudioSearch onOpenFilm={openFilm}/>}

      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px 8px 14px", minHeight: 54, borderBottom: "1px solid var(--c-line)", background: "var(--c-panel)", flexShrink: 0 }}>
        {page ? (
          <button onClick={() => setPage(null)} aria-label="Back" style={{ width: 40, height: 40, marginLeft: -8, border: "none", background: "transparent", color: "var(--c-ink-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="chev-l" size={16}/>
          </button>
        ) : <CinaBadge size={26}/>}

        {page ? (
          <div className="t-display" style={{ flex: 1, fontSize: "var(--fs-lead)", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pages[page].label}</div>
        ) : tab === "home" ? (
          <button onClick={() => setSheet("films")} style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer", padding: 0 }}>
            <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em" }}>STUDIO SLATE</div>
            <div className="t-display" style={{ fontSize: "var(--fs-body)", fontStyle: "italic", color: "var(--c-ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{film.title} ▾</div>
          </button>
        ) : (
          <button onClick={() => setSheet("films")} style={{ flex: 1, minWidth: 0, minHeight: 40, border: "none", background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer", padding: 0 }}>
            <div className="t-display" style={{ fontSize: "var(--fs-lead)", fontStyle: "italic", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{film.title} <span style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-3)", fontStyle: "normal" }}>▾</span></div>
            <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-3)", letterSpacing: ".14em", textTransform: "uppercase" }}>{film.code} · {film.status}</div>
          </button>
        )}

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("cina:studio-search"))}
          aria-label="Search studio"
          style={{ width: 34, height: 34, border: "1px solid var(--c-line)", borderRadius: 0, background: "transparent", color: "var(--c-ink-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <Icon name="search" size={14}/>
        </button>
        <a href="index.html" className="t-mono" style={{ height: 34, display: "flex", alignItems: "center", padding: "0 8px", border: "1px solid var(--c-line)", fontSize: "var(--fs-label)", letterSpacing: ".12em", color: "var(--c-ink-3)", textDecoration: "none", whiteSpace: "nowrap" }}>WATCH ↗</a>
      </header>

      {(tab === "station" || tab === "board") && !page && (
        <div className="mob-strip" role="tablist" aria-label="Production stations">
          {stations.map(s => {
            const on = currentStation === s.id;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={on}
                className="mob-strip__btn"
                onClick={() => {
                  setActiveView(s.id);
                  setTab(s.id === "board" ? "board" : "station");
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {page ? (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative" }}>{pages[page].el}</div>
        ) : (
          <>
            {tab === "home" && (
              <div className="mob-home">
                <Dashboard
                  activeFilmId={filmId}
                  onOpenFilm={openFilm}
                  onNewFilm={() => setPage("new")}
                  onOpenVault={() => { setActiveView("vault"); setTab("station"); }}
                  onOpenSite={() => setPage("site")}
                  onOpenPromo={() => setPage("promo")}
                  onOpenAnalytics={() => setPage("analytics")}
                />
              </div>
            )}
            {tab === "station" && (
              <div className="mob-stage">
                {renderStation(activeView)}
              </div>
            )}
            {tab === "board" && (
              <div className="mob-stage">
                {window.StoryboardPanel ? <StoryboardPanel/> : <MobileBoard/>}
              </div>
            )}
            {tab === "crew" && <MobileCrew/>}
          </>
        )}
      </div>

      {!page && (
        <nav style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--c-line)", background: "var(--c-panel)", paddingBottom: "env(safe-area-inset-bottom, 0px)", flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} className="mob-tab" onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
              style={{ color: tab === t.id ? "var(--c-amber)" : "var(--c-ink-3)" }}>
              <Icon name={t.icon} size={18}/>{t.label}
            </button>
          ))}
        </nav>
      )}

      {sheet === "films" && (
        <div onClick={() => setSheet(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.64)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "var(--c-panel)", borderTop: "1px solid var(--c-line)", padding: "14px 16px calc(14px + env(safe-area-inset-bottom, 0px))", maxHeight: "78vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 3, background: "var(--c-line-2)", margin: "0 auto 12px" }}/>
            <div className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".16em", color: "var(--c-ink-3)", marginBottom: 6 }}>SWITCH PRODUCTION</div>
            {window.PROJECTS.map(p => (
              <button key={p.id} className="mob-sheet-row" onClick={() => { setFilmId(p.id); setSheet(null); }}>
                <span style={{ width: 8, height: 8, background: p.id === filmId ? "var(--c-amber)" : "var(--c-line-2)", flexShrink: 0 }}/>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="t-display" style={{ display: "block", fontStyle: "italic", fontSize: "var(--fs-lead)", color: p.id === filmId ? "var(--c-amber)" : "var(--c-ink)" }}>{p.title}</span>
                  <span className="t-mono" style={{ display: "block", fontSize: "var(--fs-label)", letterSpacing: ".14em", color: "var(--c-ink-3)", textTransform: "uppercase", marginTop: 2 }}>{p.code} · {p.status}</span>
                </span>
              </button>
            ))}
            <div className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".16em", color: "var(--c-ink-3)", margin: "12px 0 6px" }}>STUDIO SURFACES</div>
            <button className="mob-sheet-row" onClick={() => { setSheet(null); setPage("analytics"); }}>
              <Icon name="trend" size={14}/><span className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".14em" }}>DIRECTOR ANALYTICS</span>
            </button>
            <button className="mob-sheet-row" onClick={() => { setSheet(null); setPage("site"); }}>
              <Icon name="grid" size={14}/><span className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".14em" }}>SITE BUILDER</span>
            </button>
            <button className="mob-sheet-row" onClick={() => { setSheet(null); setPage("promo"); }}>
              <Icon name="sparkles" size={14}/><span className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".14em" }}>PROMOTION</span>
            </button>
            <button className="mob-sheet-row" onClick={() => { setSheet(null); setPage("new"); }} style={{ color: "var(--c-amber)" }}>
              <Icon name="plus" size={14}/><span className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".16em" }}>NEW PRODUCTION</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileBoard() {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
      <SectionHead title="Scene 14 · Darkroom" count={`${window.STORYBOARD.length} shots`}/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        {window.STORYBOARD.map((f) => (
          <div key={f.id} style={{
            border: "1px solid var(--c-line)", borderRadius: 0, overflow: "hidden",
            background: "var(--c-panel)",
          }}>
            <div style={{ aspectRatio: "16/9", position: "relative" }}>
              <FrameThumb kind={f.thumb} usePhoto/>
              <div style={{
                position: "absolute", top: 4, left: 4,
                padding: "1px 4px", borderRadius: 0,
                background: "rgba(8,8,10,.78)",
                color: "var(--c-ink-2)", fontSize: "var(--fs-label)", fontFamily: "var(--f-mono)",
              }}>{f.scene}{f.shot} · {f.type}</div>
            </div>
            <div style={{ padding: "6px 8px" }}>
              <div style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-2)", lineHeight: 1.35,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileCrew() {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
      <SectionHead title="Crew"/>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {window.AGENTS.map(a => (
          <div key={a.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: 12, background: "var(--c-panel)", border: "1px solid var(--c-line)", borderRadius: 0,
          }}>
            <AgentBadge agent={a.id} size={32}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>{a.name}</span>
                <StatusPill status={a.status}/>
              </div>
              <div style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-3)", marginTop: 2 }}>{a.role}</div>
              <div style={{ marginTop: 6, height: 2, background: "var(--c-line)", overflow: "hidden" }}>
                <div style={{ width: `${a.load * 100}%`, height: "100%", background: a.color }}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MobileApp });
