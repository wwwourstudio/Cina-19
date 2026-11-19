// builder-toolbar.jsx — Studio Builder architectural topbar, Page switcher, Cart preview trigger & section toolbar.

const { useState: usbTb, useEffect: uebTb, useRef: urbTb } = React;

function BuilderToolbar({
  page,
  activePage,
  onSwitchPage,
  onOpenPageSeo,
  editMode,
  setEditMode,
  previewMode,
  setPreviewMode,
  dirty,
  publish,
  viewLive,
  undo,
  redo,
  canUndo,
  canRedo,
  openVersions,
  compactUI,
  onSections,
  onDesign,
  onPlan,
}) {
  const pagesList = Array.isArray(page.pages) && page.pages.length
    ? page.pages
    : [{ id: "home", title: "Home", slug: "", isHome: true, sections: page.sections || [] }];
  const curPage = activePage || pagesList[0];
  const used = (curPage.sections || page.sections || []).length;
  const lim = wbTier(page);
  const atCap = lim.maxSections !== Infinity && used >= lim.maxSections;

  const [cartCount, setCartCount] = usbTb(() => (window.cinaCart && typeof window.cinaCart.count === "function" ? window.cinaCart.count() : 0));
  uebTb(() => {
    const sync = (items) => {
      if (Array.isArray(items)) {
        setCartCount(items.reduce((n, x) => n + (Number(x.qty) || 1), 0));
      } else if (window.cinaCart && typeof window.cinaCart.count === "function") {
        setCartCount(window.cinaCart.count());
      }
    };
    const unsub = window.cinaCart && typeof window.cinaCart.subscribe === "function"
      ? window.cinaCart.subscribe(sync)
      : null;
    const onEvt = () => sync();
    window.addEventListener("cina:cart-updated", onEvt);
    sync();
    return () => {
      if (unsub) unsub();
      window.removeEventListener("cina:cart-updated", onEvt);
    };
  }, []);

  const [pageMenuOpen, setPageMenuOpen] = usbTb(false);
  const pageMenuRef = urbTb(null);
  uebTb(() => {
    if (!pageMenuOpen) return;
    const onDown = (e) => {
      if (pageMenuRef.current && !pageMenuRef.current.contains(e.target)) setPageMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [pageMenuOpen]);

  const live = () => {
    if (viewLive) viewLive();
    else {
      const id = (page.domain || "").split(".")[0] || "voss";
      const dest = curPage && curPage.slug ? `/site/${id}/${curPage.slug}` : `/site/${id}`;
      if (window.navigate) window.navigate(dest);
      else window.location.hash = `#${dest}`;
    }
  };

  const devices = [
    ["desktop", "Desktop", "Desktop · fluid width", <svg key="d" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4" width="19" height="12" rx="1.5"/><path d="M8.5 20h7M12 16v4"/></svg>],
    ["tablet",  "Tablet",  "Tablet · 768px",         <svg key="t" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M11 18.5h2"/></svg>],
    ["phone",   "Phone",   "Mobile · 390px",         <svg key="p" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.2"/><path d="M11 18.5h2"/></svg>],
  ];

  return (
    <div className="builder-toolbar" role="toolbar" aria-label="Site builder toolbar">
      <style>{`
        .builder-toolbar{position:relative;z-index:20;height:52px;min-height:52px;padding:0 12px;border-bottom:1px solid var(--c-line);display:flex;align-items:center;gap:8px;background:var(--c-panel);flex-shrink:0}
        .btb{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border-radius:2px;border:1px solid var(--c-line-2);background:transparent;color:var(--c-ink-2);font:500 var(--fs-label)/1 var(--f-sans);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:border-color .15s,color .15s,background .15s}
        .btb:hover:not(:disabled){color:var(--c-ink);border-color:var(--c-ink-3)}
        .btb:disabled{opacity:.38;cursor:default}
        .btb--quiet{border-color:transparent;padding:0 8px}
        .btb--primary{background:var(--c-amber);border-color:var(--c-amber);color:var(--c-on-amber);font-weight:600}
        .btb--primary:hover:not(:disabled){color:var(--c-on-amber);border-color:var(--c-amber-x);background:var(--c-amber-x)}
        .btb-seg{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--c-line);border-radius:2px;background:var(--c-bg);flex-shrink:0}
        .btb-seg .btb{border-color:transparent;height:24px;padding:0 8px}
        .btb-seg .btb[aria-pressed="true"]{background:var(--c-panel-3);color:var(--c-ink)}
        .btb-div{width:1px;height:20px;background:var(--c-line);flex-shrink:0}
        .btb-save{display:inline-flex;align-items:center;gap:6px;font-family:var(--f-mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--c-ink-3);white-space:nowrap;flex-shrink:0}
        .btb-save i{width:6px;height:6px;border-radius:50%;background:var(--c-good)}
        .btb-save[data-dirty="1"] i{background:var(--c-amber)}
        .btb-page-pop{position:absolute;top:calc(100% + 6px);left:0;width:250px;background:var(--c-panel);border:1px solid var(--c-line-2);border-radius:2px;box-shadow:0 18px 44px rgba(0,0,0,.72);padding:6px;z-index:60}
        @media (max-width:1380px){.builder-toolbar .btb-opt{display:none}}
        @media (max-width:1120px){.builder-toolbar .btb-x{display:none}}
        @media (max-width:920px){.builder-toolbar .btb-x2{display:none}.builder-toolbar{gap:5px;padding:0 8px}}
      `}</style>

      {compactUI && (
        <button className="btb" onClick={onSections} title="Pages & sections rail">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          Workspace
        </button>
      )}

      {/* Active Page Selector */}
      <div ref={pageMenuRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          className="btb"
          onClick={() => setPageMenuOpen(o => !o)}
          style={{ borderColor: pageMenuOpen ? "var(--c-amber)" : "var(--c-line-2)", background: "var(--c-bg)", gap: 8 }}
          title="Switch active page or edit page SEO"
        >
          <span className="t-mono" style={{ fontSize: 10, color: "var(--c-amber)", letterSpacing: ".12em", textTransform: "uppercase" }}>PAGE</span>
          <span style={{ fontWeight: 600, color: "var(--c-ink)", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis" }}>{curPage.title}</span>
          <span className="t-mono btb-opt" style={{ fontSize: 10, color: "var(--c-ink-4)" }}>{curPage.isHome ? "/" : `/${curPage.slug}`}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {pageMenuOpen && (
          <div className="btb-page-pop" role="menu">
            <div className="t-mono" style={{ fontSize: 10, color: "var(--c-ink-4)", letterSpacing: ".14em", padding: "4px 8px 6px" }}>SITE PAGES · {pagesList.length}</div>
            {pagesList.map(pg => {
              const on = pg.id === curPage.id;
              return (
                <button
                  key={pg.id}
                  onClick={() => { if (onSwitchPage) onSwitchPage(pg.id); setPageMenuOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
                    background: on ? "rgba(var(--accent-rgb),.1)" : "transparent",
                    border: `1px solid ${on ? "rgba(var(--accent-rgb),.35)" : "transparent"}`,
                    borderRadius: 2, cursor: "pointer", color: on ? "var(--c-ink)" : "var(--c-ink-2)", textAlign: "left",
                  }}
                >
                  <span style={{ color: on ? "var(--c-amber)" : "var(--c-ink-4)", fontSize: 11, width: 12 }}>{pg.isHome ? "⌂" : "•"}</span>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: on ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pg.title}</span>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--c-ink-4)" }}>{pg.isHome ? "/" : `/${pg.slug}`}</span>
                </button>
              );
            })}
            <div style={{ borderTop: "1px solid var(--c-line)", marginTop: 6, paddingTop: 6 }}>
              <button
                onClick={() => { setPageMenuOpen(false); if (onOpenPageSeo) onOpenPageSeo(); }}
                style={{
                  width: "100%", padding: "7px 8px", background: "var(--c-bg)", border: "1px solid var(--c-line-2)",
                  borderRadius: 2, color: "var(--c-amber)", cursor: "pointer", textAlign: "left",
                  fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase",
                }}
              >
                Active page SEO &amp; slug →
              </button>
            </div>
          </div>
        )}
      </div>

      <span className="btb-div"/>

      {/* Undo / Redo / Versions */}
      <button className="btb btb--quiet" onClick={undo} disabled={!canUndo} title="Undo · ⌘Z" aria-label="Undo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        <span className="btb-opt">Undo</span>
      </button>
      <button className="btb btb--quiet" onClick={redo} disabled={!canRedo} title="Redo · ⌘⇧Z" aria-label="Redo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
        <span className="btb-opt">Redo</span>
      </button>
      {openVersions && (
        <button className="btb btb--quiet" onClick={openVersions} title="Published snapshots history" aria-label="Versions">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
          <span className="btb-opt">History</span>
        </button>
      )}

      <span className="btb-div btb-x"/>

      {/* Viewport Switcher */}
      <div className="btb-seg" role="group" aria-label="Preview viewport">
        {devices.map(([k, label, title, icon]) => (
          <button key={k} className="btb" aria-pressed={previewMode === k} onClick={() => setPreviewMode(k)} title={title} aria-label={label}>
            {icon}
            <span className="btb-opt">{label}</span>
          </button>
        ))}
      </div>

      {/* Edit vs Interactive Preview mode toggle */}
      {setEditMode && (
        <div className="btb-seg" role="group" aria-label="Canvas interaction mode">
          <button className="btb" aria-pressed={!!editMode} onClick={() => setEditMode(true)} title="Direct click-to-edit copy & section controls">
            <span>Edit</span>
          </button>
          <button className="btb" aria-pressed={!editMode} onClick={() => setEditMode(false)} title="Interactive preview — test links, FAQ & storefront actions">
            <span>Preview</span>
          </button>
        </div>
      )}

      <span className="btb-save btb-x" data-dirty={dirty ? "1" : "0"} title={dirty ? "Unsaved changes in working draft" : "Published changes are live"}>
        <i/>
        <span>{dirty ? "Draft" : "Saved"}</span>
      </span>

      <span style={{ flex: 1, minWidth: 4 }}/>

      {/* Cart Drawer Preview */}
      <button
        className="btb"
        onClick={() => window.cinaCart && window.cinaCart.open(page.theme?.accent)}
        title="Preview studio merch shopping bag & checkout flow"
        style={{ borderColor: cartCount > 0 ? "var(--c-amber)" : "var(--c-line-2)", color: cartCount > 0 ? "var(--c-ink)" : "var(--c-ink-2)" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>
        </svg>
        <span className="t-mono" style={{ fontSize: 10.5, letterSpacing: ".08em", fontVariantNumeric: "tabular-nums" }}>
          BAG{cartCount > 0 ? ` · ${cartCount}` : ""}
        </span>
      </button>

      {/* Plan selector (crisp button, zero pill radius) */}
      <button
        className="btb btb-x2"
        onClick={onPlan}
        title={lim.blurb}
        style={{ borderColor: atCap ? "var(--c-warn)" : "var(--c-line-2)", color: atCap ? "var(--c-warn)" : "var(--c-ink-2)" }}
      >
        <span className="t-mono" style={{ fontSize: 10.5, letterSpacing: ".08em" }}>{lim.label.toUpperCase()}</span>
        <span className="btb-opt t-mono" style={{ fontSize: 10, color: "var(--c-ink-4)" }}>{lim.maxSections === Infinity ? "∞" : `${used}/${lim.maxSections}`}</span>
      </button>

      <button className="btb" onClick={live} title="Open live visitor view">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
        <span className="btb-x2">View live</span>
      </button>

      <button className={"btb" + (dirty ? " btb--primary" : "")} onClick={publish} disabled={!dirty} title={dirty ? "Publish changes live" : "All changes published"}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6M6 11l6-6 6 6"/></svg>
        <span>{dirty ? "Publish" : "Live"}</span>
      </button>

      {compactUI && (
        <button className="btb" onClick={onDesign} title="Design & inspector">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          Inspector
        </button>
      )}
    </div>
  );
}

function BuilderPlanSheet({ page, onPick, onClose }) {
  const used = (page.sections || []).length;
  return (
    <CinaSheet title="Site Plan" kicker="Studio publishing tier" onClose={onClose} width={420}>
      <p style={{ margin: "0 0 18px", color: "var(--c-ink-2)", lineHeight: 1.55 }}>
        {page.tier === "free" ? `Free sites support up to ${WB_TIERS.free.maxSections} sections per page. Active page uses ${used}.` : `Active tier: ${wbTier(page).label}. Multi-page sections are unlimited.`}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(WB_TIERS).map(([id, t]) => {
          const on = (page.tier || "free") === id;
          return (
            <button key={id} onClick={() => onPick(id)} style={{
              all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
              padding: 16, borderRadius: 2,
              border: `1px solid ${on ? "var(--c-amber)" : "var(--c-line-2)"}`,
              background: on ? "rgba(var(--accent-rgb),.06)" : "transparent",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "var(--f-display)", fontSize: "var(--fs-lead)", color: "var(--c-ink)" }}>{t.label}</span>
                {on && <span className="t-mono" style={{ fontSize: 10, color: "var(--c-amber)", letterSpacing: ".12em", border: "1px solid rgba(var(--accent-rgb),.4)", padding: "2px 6px", borderRadius: 2 }}>ACTIVE</span>}
              </span>
              <span style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-3)", lineHeight: 1.5 }}>{t.blurb}</span>
            </button>
          );
        })}
      </div>
    </CinaSheet>
  );
}

function DomainConnectV2({ page, onUpdate }) {
  const tier = wbTier(page);
  const dc = page.customDomain;
  const [host, setHost] = usbTb(dc ? dc.host : "");
  const [checking, setChecking] = usbTb(false);
  const clean = (host || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const isApex = clean.split(".").filter(Boolean).length === 2;
  const apexBlocked = isApex && !tier.apex;
  const valid = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean);
  const mono = { fontFamily: "var(--f-mono)", letterSpacing: ".08em" };
  const recRow = (kind, name, value) => (
    <div style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: 8, padding: "6px 8px", background: "var(--c-panel-2)", borderRadius: 2 }}>
      <span style={{ ...mono, fontSize: "var(--fs-label)", color: "var(--c-amber)" }}>{kind}</span>
      <span style={{ ...mono, fontSize: "var(--fs-label)", color: "var(--c-ink-2)", wordBreak: "break-all" }}>{name} → {value}</span>
    </div>
  );
  const check = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      onUpdate({ customDomain: { host: clean, status: "verified", at: Date.now() } });
      if (window.toast) window.toast({ title: "DOMAIN CONNECTED", text: `${clean} now points at your site · SSL active.`, kind: "good" });
    }, 1200);
  };
  return (
    <FieldV2 label="CUSTOM DOMAIN">
      {dc && dc.status === "verified" ? (
        <div style={{ padding: "10px 12px", background: "var(--c-bg)", border: "1px solid rgba(106,163,122,.4)", borderRadius: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--c-good)", flexShrink: 0 }}/>
            <span style={{ ...mono, fontSize: "var(--fs-label)", color: "var(--c-ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dc.host}</span>
            <span style={{ ...mono, fontSize: "var(--fs-label)", color: "var(--c-good)" }}>SSL ACTIVE</span>
          </div>
          <button onClick={() => { onUpdate({ customDomain: null }); setHost(""); }} style={{ marginTop: 8, padding: "5px 9px", background: "transparent", border: "1px solid var(--c-line-2)", borderRadius: 2, color: "var(--c-ink-3)", cursor: "pointer", ...mono, fontSize: "var(--fs-label)" }}>DISCONNECT</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={host} placeholder={tier.apex ? "yourdomain.com" : "films.yourdomain.com"} onChange={e => setHost(e.target.value)} style={inpV2}/>
          {apexBlocked && (
            <div style={{ ...mono, fontSize: "var(--fs-label)", color: `var(--c-warn, ${tkc("warn")})`, lineHeight: 1.5 }}>Apex domains ({clean}) need Enterprise — use a subdomain, or <button onClick={() => onUpdate({ tier: "enterprise" })} style={{ background: "transparent", border: "none", color: "var(--c-amber)", cursor: "pointer", ...mono, fontSize: "var(--fs-label)", padding: 0, textDecoration: "underline" }}>upgrade</button>.</div>
          )}
          {valid && !apexBlocked && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ ...mono, fontSize: "var(--fs-label)", color: "var(--c-ink-4)", letterSpacing: ".14em" }}>ADD AT YOUR DNS PROVIDER</div>
              {isApex ? recRow("A", "@", "76.76.21.21") : recRow("CNAME", clean.split(".")[0], `${page.domain}.site`)}
              <button onClick={check} disabled={checking} style={{ marginTop: 4, padding: "8px 10px", background: checking ? "var(--c-panel-2)" : "var(--c-amber)", border: "none", borderRadius: 2, color: checking ? "var(--c-ink-3)" : tkc("on-amber"), cursor: checking ? "default" : "pointer", ...mono, fontSize: "var(--fs-label)", fontWeight: 700 }}>{checking ? "VERIFYING DNS…" : "VERIFY DNS & CONNECT"}</button>
            </div>
          )}
        </div>
      )}
    </FieldV2>
  );
}

// ─── Floating Section Toolbar ────────────────────────────────────────────

function SectionToolbar({ accent, sectionTitle, onInsertAfter, onMove, onRemove, onDuplicate, onDragStart, onDragEnd }) {
  const tbRef = urbTb(null);
  const [tbTop, setTbTop] = usbTb(8);
  uebTb(() => {
    const el = tbRef.current; if (!el) return;
    const sec = el.offsetParent;
    const hdr = sec && sec.parentElement ? sec.parentElement.querySelector("header") : null;
    const update = () => {
      if (!sec || !hdr) { setTbTop(8); return; }
      const hb = hdr.getBoundingClientRect().bottom;
      const sr = sec.getBoundingClientRect();
      setTbTop(sr.top + 8 < hb ? Math.min(hb - sr.top + 8, Math.max(8, sr.height - 34)) : 8);
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, []);
  const btn = {
    height: 24, minWidth: 26, padding: "0 7px", fontSize: "var(--fs-label)", color: tkc("white"),
    background: "rgba(10,10,12,0.85)", border: `1px solid ${accent}66`,
    borderRadius: 2, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div ref={tbRef} onClick={e => e.stopPropagation()} style={{
      position: "absolute", top: tbTop, right: 8, display: "flex", alignItems: "center", gap: 4, zIndex: 12,
      backdropFilter: "blur(8px)",
    }}>
      {sectionTitle && (
        <span style={{
          height: 24, padding: "0 8px", display: "inline-flex", alignItems: "center",
          background: accent, color: tkc("bg"), borderRadius: 2,
          fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase",
        }}>
          {sectionTitle}
        </span>
      )}
      {onDragStart && (
        <button
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          style={{ ...btn, cursor: "grab", borderColor: accent, color: accent, letterSpacing: "-1px" }}
          title="Drag section to reorder">⠿</button>
      )}
      <button onClick={() => onMove(-1)} style={btn} title="Move section up">↑</button>
      <button onClick={() => onMove(1)}  style={btn} title="Move section down">↓</button>
      <button onClick={onDuplicate}      style={btn} title="Duplicate · ⌘D">⧉</button>
      <button onClick={onInsertAfter}    style={btn} title="Add section below">+</button>
      <button onClick={onRemove}         style={{ ...btn, color: tkc("amber-x") }} title="Delete section · ⌫">×</button>
    </div>
  );
}

Object.assign(window, { BuilderToolbar, BuilderPlanSheet, DomainConnectV2, SectionToolbar });
