// builder-inspector.jsx — Global Design System, Active Page SEO, Chrome & Domain Inspector.

const { useState: usbIn, useEffect: uebIn } = React;

function wbHexToRgb(hex) {
  const s = String(hex || "").replace("#", "").trim();
  const full = s.length === 3 ? s.split("").map(c => c + c).join("") : s;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return [12, 12, 14];
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function wbRelLum(hex) {
  const [r, g, b] = wbHexToRgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function wbContrast(c1, c2) {
  const l1 = wbRelLum(c1), l2 = wbRelLum(c2);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// ─── Global Design System & Page SEO Inspector ───────────────────────────

function ThemeInspectorV2({
  page,
  activePage,
  activeTab,
  onTabChange,
  onUpdate,
  onTheme,
  onHeader,
  onFooter,
  onUpdatePageMeta,
  onOpenLogoStudio,
  previewMode,
}) {
  const t = page.theme || {};
  const [layoutBP, setLayoutBP] = usbIn(previewMode === "phone" ? "mobile" : previewMode === "tablet" ? "tablet" : "desktop");
  uebIn(() => { setLayoutBP(previewMode === "phone" ? "mobile" : previewMode === "tablet" ? "tablet" : "desktop"); }, [previewMode]);

  const bpKey = layoutBP === "mobile" ? "Mobile" : layoutBP === "tablet" ? "Tablet" : "";
  const fsKey = "fontScale" + bpKey, spKey = "spacing" + bpKey;
  const fsVal = t[fsKey] != null ? t[fsKey] : (t.fontScale || 1);
  const spVal = t[spKey] != null ? t[spKey] : (t.spacing || 1);
  const bpOverridden = bpKey && (t[fsKey] != null || t[spKey] != null);

  const [tab, setTab] = usbIn(activeTab || "colors");
  uebIn(() => { if (activeTab) setTab(activeTab); }, [activeTab]);
  const pickTab = (id) => { setTab(id); if (onTabChange) onTabChange(id); };

  const curPg = activePage || (page.pages && page.pages[0]) || { id: "home", title: "Home", slug: "", isHome: true, inMenu: true, seo: page.seo || {} };
  const pgSeo = curPg.seo || {};
  const contrast = wbContrast(t.bg, t.ink);
  const palettes = window.WB_GLOBAL_PALETTES || [];

  const TABS = [
    ["colors",   "Colors"],
    ["type",     "Type"],
    ["layout",   "Spacing & UI"],
    ["seo",      "Page SEO"],
    ["chrome",   "Header & Footer"],
    ["identity", "Domain"],
  ];

  const curBtnPreview = wbBtnCss ? wbBtnCss(t, t.accent, "primary") : { background: t.accent, color: t.bg };
  const secBtnPreview = wbBtnCss ? wbBtnCss(t, t.accent, "secondary") : { border: `1px solid ${t.accent}`, color: t.accent };

  return (
    <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingBottom: 14 }}>
        <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em" }}>DESIGN SYSTEM</div>
        <div className="t-display" style={{ fontStyle: "italic", fontSize: "var(--fs-title)", fontWeight: 500, marginTop: 4 }}>Global Styles &amp; SEO</div>
        <div style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-3)", marginTop: 4, lineHeight: 1.5 }}>
          Sitewide palettes, typography scale, spacing rhythm, and page SEO. Click copy directly on the canvas to edit text.
        </div>
      </div>

      <CinaTabs tabs={TABS} value={tab} onChange={pickTab} style={{ margin: "0 -16px", padding: "0 8px" }}/>

      {/* ─── COLORS ──────────────────────────────────────────────── */}
      <InsGroup label="Color Palette" tabbed open={tab === "colors"}>
        <FieldV2 label="CURATED PALETTES">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {palettes.map(p => {
              const on = String(t.bg).toLowerCase() === p.bg.toLowerCase() && String(t.accent).toLowerCase() === p.accent.toLowerCase();
              return (
                <button
                  key={p.id}
                  onClick={() => onTheme({ bg: p.bg, ink: p.ink, accent: p.accent })}
                  title={p.mood}
                  style={{
                    padding: "9px 10px", textAlign: "left", cursor: "pointer", borderRadius: 2,
                    background: p.bg, color: p.ink,
                    border: `1.5px solid ${on ? p.accent : "var(--c-line-2)"}`,
                    display: "flex", flexDirection: "column", gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span className="t-mono" style={{ fontSize: 10.5, letterSpacing: ".1em", fontWeight: 700 }}>{p.name.toUpperCase()}</span>
                    <span style={{ display: "inline-flex", gap: 3 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.ink, border: "1px solid rgba(128,128,128,.3)" }}/>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.accent }}/>
                    </span>
                  </div>
                  <span style={{ fontSize: 10.5, opacity: 0.72, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.mood}</span>
                </button>
              );
            })}
          </div>
        </FieldV2>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px",
          background: "var(--c-bg)", border: "1px solid var(--c-line)", borderRadius: 2,
        }}>
          <span className="t-mono" style={{ fontSize: 10.5, color: "var(--c-ink-3)", letterSpacing: ".12em" }}>TEXT CONTRAST</span>
          <span className="t-mono t-num" style={{
            fontSize: 11, fontWeight: 700,
            color: contrast >= 4.5 ? "var(--c-good)" : "var(--c-warn)",
          }}>
            {contrast.toFixed(1)}:1 · {contrast >= 7 ? "AAA" : contrast >= 4.5 ? "AA PASS" : "LOW"}
          </span>
        </div>

        <FieldV2 label="CUSTOM COLOR TOKENS">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            <ColorRow label="CANVAS BACKGROUND" value={t.bg || "#0A0A0C"} onChange={v => onTheme({ bg: v })}/>
            <ColorRow label="PRIMARY INK"       value={t.ink || "#F3EFEA"} onChange={v => onTheme({ ink: v })}/>
            <ColorRow label="ACCENT"            value={t.accent || "#E48D3C"} onChange={v => onTheme({ accent: v })}/>
          </div>
          <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)", letterSpacing: ".14em", margin: "12px 0 6px" }}>SURFACE SWATCHES</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 5 }}>
            {WB_BG_SWATCHES.map(c => (
              <button key={c} onClick={() => onTheme({ bg: c })} title={c} style={{
                aspectRatio: "1", borderRadius: 2, cursor: "pointer", background: c,
                border: (t.bg || "").toLowerCase() === c.toLowerCase() ? "2px solid var(--c-amber)" : "1px solid var(--c-line-2)",
              }}/>
            ))}
          </div>
          <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)", letterSpacing: ".14em", margin: "12px 0 6px" }}>ACCENT SWATCHES</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 5 }}>
            {WB_ACCENT_SWATCHES.map(c => (
              <button key={c} onClick={() => onTheme({ accent: c })} title={c} style={{
                aspectRatio: "1", borderRadius: 2, cursor: "pointer", background: c,
                border: (t.accent || "").toLowerCase() === c.toLowerCase() ? "2px solid var(--c-amber)" : "1px solid var(--c-line-2)",
              }}/>
            ))}
          </div>
        </FieldV2>
      </InsGroup>

      {/* ─── TYPOGRAPHY ──────────────────────────────────────────── */}
      <InsGroup label="Typography" tabbed open={tab === "type"}>
        <div style={{
          padding: "14px", background: t.bg, color: t.ink, border: "1px solid var(--c-line-2)", borderRadius: 2,
        }}>
          <div className="t-mono" style={{ fontSize: 10, color: t.accent, letterSpacing: ".14em", marginBottom: 4 }}>TYPE SPECIMEN</div>
          <div style={{ fontFamily: wbFont(t.headlineFont), fontStyle: "italic", fontSize: 22 * (t.fontScale || 1), lineHeight: 1.08 }}>
            {page.studioName}
          </div>
          <div style={{ fontFamily: wbFont(t.bodyFont), fontSize: 12.5 * (t.fontScale || 1), opacity: 0.78, marginTop: 6, lineHeight: 1.45 }}>
            The quick frame jumps over grain, framing silence with sharp typography.
          </div>
        </div>

        <FieldV2 label="CURATED FONT PAIRINGS">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {WB_FONT_PAIRINGS.map(pr => {
              const active = t.headlineFont === pr.headline && t.bodyFont === pr.body;
              return (
                <button
                  key={pr.name}
                  onClick={() => onTheme({ headlineFont: pr.headline, bodyFont: pr.body })}
                  title={`${WB_FONTS[pr.headline].label} headlines · ${WB_FONTS[pr.body].label} body`}
                  style={{
                    padding: "9px 10px 7px", textAlign: "left", cursor: "pointer", borderRadius: 2,
                    background: active ? "rgba(var(--accent-rgb),.10)" : "var(--c-bg)",
                    border: `1px solid ${active ? "var(--c-amber)" : "var(--c-line-2)"}`,
                    color: "var(--c-ink)",
                  }}
                >
                  <span style={{ display: "block", fontFamily: wbFont(pr.headline), fontStyle: "italic", fontSize: "var(--fs-lead)", lineHeight: 1.1 }}>Ag</span>
                  <span className="t-mono" style={{ display: "block", fontSize: 10, letterSpacing: ".12em", color: active ? "var(--c-amber)" : "var(--c-ink-4)", marginTop: 4, textTransform: "uppercase" }}>{pr.name}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            <SelectV2 label="Headline font" value={t.headlineFont || "display"} onChange={v => onTheme({ headlineFont: v })} options={Object.entries(WB_FONTS).map(([k, f]) => [k, f.label])}/>
            <SelectV2 label="Body font"     value={t.bodyFont || "sans"}        onChange={v => onTheme({ bodyFont: v })}     options={Object.entries(WB_FONTS).map(([k, f]) => [k, f.label])}/>
          </div>
        </FieldV2>

        <FieldV2 label={`BASE TYPE SCALE${bpKey ? " · " + layoutBP.toUpperCase() : ""}`}>
          <SliderV2 label="Text scale" min={0.7} max={1.5} step={0.05} value={fsVal} onChange={v => onTheme({ [fsKey]: v })} fmt={v => v.toFixed(2) + "×"}/>
        </FieldV2>
      </InsGroup>

      {/* ─── SPACING, GRID & BUTTON SHAPES ───────────────────────── */}
      <InsGroup label="Spacing & Shapes" tabbed open={tab === "layout"}>
        <FieldV2 label="DEVICE BREAKPOINT OVERRIDES">
          <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--c-bg)", border: "1px solid var(--c-line-2)", borderRadius: 2, marginBottom: 10 }}>
            {[["desktop", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]].map(([id, l]) => (
              <button key={id} onClick={() => setLayoutBP(id)} style={{
                flex: 1, height: 26, borderRadius: 2, cursor: "pointer", border: "none",
                background: layoutBP === id ? "var(--c-amber)" : "transparent",
                color: layoutBP === id ? tkc("on-amber") : "var(--c-ink-3)",
                fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase",
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, color: bpOverridden ? "var(--c-amber)" : "var(--c-ink-4)" }}>
              {layoutBP === "desktop" ? "Global fluid baseline." : bpOverridden ? `Overriding ${layoutBP} spacing & type.` : `Inherits desktop on ${layoutBP}.`}
            </span>
            {bpOverridden && (
              <button onClick={() => onTheme({ [fsKey]: null, [spKey]: null })} style={{ marginLeft: "auto", ...smBtnV2, padding: "3px 7px" }}>Reset</button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
            {[["Compact", 0.75], ["Editorial", 1.0], ["Airy", 1.35]].map(([lbl, val]) => {
              const on = Math.abs(spVal - val) < 0.04;
              return (
                <button key={lbl} onClick={() => onTheme({ [spKey]: val })} style={{
                  padding: "7px 6px", borderRadius: 2, cursor: "pointer",
                  background: on ? "rgba(var(--accent-rgb),.12)" : "var(--c-bg)",
                  border: `1px solid ${on ? "var(--c-amber)" : "var(--c-line-2)"}`,
                  color: on ? "var(--c-amber)" : "var(--c-ink-2)",
                  fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase",
                }}>{lbl}</button>
              );
            })}
          </div>

          <SliderV2 label="Section spacing" min={0.5} max={1.8} step={0.05} value={spVal} onChange={v => onTheme({ [spKey]: v })} fmt={v => v.toFixed(2) + "×"}/>
          <SliderV2 label="Container width" min={720} max={1440} step={20} value={t.columnWidth || 1180} onChange={v => onTheme({ columnWidth: v })} fmt={v => v + "px"}/>
          <SliderV2 label="Film grain"      min={0}   max={1}    step={0.05} value={t.grain ?? 0.35} onChange={v => onTheme({ grain: v })} fmt={v => Math.round(v * 100) + "%"}/>
        </FieldV2>

        <FieldV2 label="CARD & MEDIA CORNERS">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, marginBottom: 8 }}>
            {[["Sharp", 0], ["Crisp", 2], ["Soft", 6], ["Round", 12]].map(([l, v]) => {
              const on = (t.radius ?? 2) === v;
              return (
                <button key={l} onClick={() => onTheme({ radius: v })} style={{
                  padding: "6px 4px", borderRadius: 2, cursor: "pointer",
                  background: on ? "rgba(var(--accent-rgb),.12)" : "var(--c-bg)",
                  border: `1px solid ${on ? "var(--c-amber)" : "var(--c-line-2)"}`,
                  color: on ? "var(--c-amber)" : "var(--c-ink-2)",
                  fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".08em",
                }}>{l}</button>
              );
            })}
          </div>
          <SliderV2 label="Corner radius" min={0} max={20} step={1} value={t.radius ?? 2} onChange={v => onTheme({ radius: v })} fmt={v => v + "px"}/>
        </FieldV2>

        <FieldV2 label="GLOBAL BUTTON SYSTEM">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 8 }}>
            {[["solid", "Solid"], ["outline", "Outline"], ["underline", "Editorial"]].map(([k, l]) => {
              const on = (t.btnStyle || "solid") === k;
              return (
                <button key={k} onClick={() => onTheme({ btnStyle: k })} style={{
                  padding: "7px 6px", borderRadius: 2, cursor: "pointer",
                  background: on ? "rgba(var(--accent-rgb),.12)" : "var(--c-bg)",
                  border: `1px solid ${on ? "var(--c-amber)" : "var(--c-line-2)"}`,
                  color: on ? "var(--c-amber)" : "var(--c-ink-2)",
                  fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase",
                }}>{l}</button>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 10 }}>
            {[["Square 0", 0], ["Crisp 2", 2], ["Pill", 999]].map(([l, v]) => {
              const on = (t.btnRadius ?? 2) === v;
              return (
                <button key={l} onClick={() => onTheme({ btnRadius: v })} style={{
                  padding: "6px 4px", borderRadius: 2, cursor: "pointer",
                  background: on ? "rgba(var(--accent-rgb),.12)" : "var(--c-bg)",
                  border: `1px solid ${on ? "var(--c-amber)" : "var(--c-line-2)"}`,
                  color: on ? "var(--c-amber)" : "var(--c-ink-2)",
                  fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".08em",
                }}>{l}</button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, padding: 12, background: t.bg, border: "1px solid var(--c-line)", borderRadius: 2, justifyContent: "center" }}>
            <span style={{ padding: "7px 14px", fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase", ...curBtnPreview }}>Primary CTA</span>
            <span style={{ padding: "7px 14px", fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase", ...secBtnPreview }}>Secondary</span>
          </div>
        </FieldV2>
      </InsGroup>

      {/* ─── ACTIVE PAGE SETTINGS & SEO ──────────────────────────── */}
      <InsGroup label="Active Page SEO" tabbed open={tab === "seo"}>
        <div style={{ padding: "10px 12px", background: "var(--c-bg)", border: "1px solid rgba(var(--accent-rgb),.3)", borderRadius: 2 }}>
          <div className="t-mono" style={{ fontSize: 10, color: "var(--c-amber)", letterSpacing: ".12em" }}>
            EDITING PAGE · {curPg.isHome ? "HOME (/)" : `/${curPg.slug}`}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--c-ink)", fontWeight: 600, marginTop: 2 }}>{curPg.title}</div>
        </div>

        <FieldV2 label="NAVIGATION TITLE">
          <input
            value={curPg.title || ""}
            onChange={e => onUpdatePageMeta && onUpdatePageMeta(curPg.id, { title: e.target.value })}
            style={inpV2}
          />
        </FieldV2>

        <FieldV2 label="URL SLUG">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{
              padding: "8px 10px", background: "var(--c-panel-2)", border: "1px solid var(--c-line-2)", borderRight: "none",
              color: "var(--c-ink-4)", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)",
            }}>{page.domain}/</span>
            <input
              value={curPg.isHome ? "" : (curPg.slug || "")}
              disabled={!!curPg.isHome}
              placeholder={curPg.isHome ? "(home root)" : "work"}
              onChange={e => onUpdatePageMeta && onUpdatePageMeta(curPg.id, { slug: wbSlugify ? wbSlugify(e.target.value) : e.target.value })}
              style={{ ...inpV2, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, opacity: curPg.isHome ? 0.55 : 1, fontFamily: "var(--f-mono)" }}
            />
          </div>
        </FieldV2>

        <div style={{ display: "flex", gap: 8 }}>
          <ToggleV2 label="Show in header menu" value={curPg.inMenu !== false} onChange={v => onUpdatePageMeta && onUpdatePageMeta(curPg.id, { inMenu: v })}/>
          <ToggleV2 label="Allow search index" value={!pgSeo.noIndex} onChange={v => onUpdatePageMeta && onUpdatePageMeta(curPg.id, { seo: { ...pgSeo, noIndex: !v } })}/>
        </div>

        <FieldV2 label="SEO TITLE TAG">
          <input
            value={pgSeo.title || ""}
            placeholder={`${curPg.title} · ${page.studioName}`}
            onChange={e => onUpdatePageMeta && onUpdatePageMeta(curPg.id, { seo: { ...pgSeo, title: e.target.value } })}
            style={inpV2}
          />
        </FieldV2>

        <FieldV2 label="META DESCRIPTION">
          <textarea
            value={pgSeo.description || ""}
            placeholder="Describe what visitors will find on this page (recommended 120–155 chars)."
            rows={3}
            onChange={e => onUpdatePageMeta && onUpdatePageMeta(curPg.id, { seo: { ...pgSeo, description: e.target.value } })}
            style={{ ...inpV2, resize: "vertical", fontFamily: "var(--f-sans)", lineHeight: 1.45 }}
          />
        </FieldV2>

        {/* Live OpenGraph / Search Result Preview */}
        <FieldV2 label="SOCIAL & SEARCH UNFURL PREVIEW">
          <div style={{ border: "1px solid var(--c-line-2)", borderRadius: 2, overflow: "hidden", background: "var(--c-bg)" }}>
            <div style={{
              aspectRatio: "1200/630",
              background: pgSeo.ogImage ? `url(${pgSeo.ogImage}) center/cover` : `linear-gradient(135deg, ${t.accent}44, ${t.bg} 85%)`,
              display: "flex", alignItems: "flex-end", padding: 12,
            }}>
              {!pgSeo.ogImage && (
                <div>
                  <div className="t-mono" style={{ fontSize: 10, color: t.accent, letterSpacing: ".14em" }}>{page.studioName}</div>
                  <div style={{ fontFamily: wbFont(t.headlineFont), fontStyle: "italic", fontSize: 22, color: t.ink }}>{curPg.title}</div>
                </div>
              )}
            </div>
            <div style={{ padding: "10px 12px", borderTop: "1px solid var(--c-line)" }}>
              <div className="t-mono" style={{ fontSize: 10, color: "var(--c-good)", letterSpacing: ".06em" }}>
                https://{page.domain}{curPg.isHome ? "" : `/${curPg.slug}`}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--c-ink)", marginTop: 3 }}>
                {pgSeo.title || `${curPg.title} · ${page.studioName}`}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--c-ink-3)", marginTop: 2, lineHeight: 1.4 }}>
                {pgSeo.description || page.seo?.description || "Official studio page built on Cina."}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              onClick={() => window.openMediaLibrary && window.openMediaLibrary({
                type: "image",
                onPick: (src) => onUpdatePageMeta && onUpdatePageMeta(curPg.id, { seo: { ...pgSeo, ogImage: src } }),
              })}
              style={{ flex: 1, ...smBtnV2 }}
            >
              {pgSeo.ogImage ? "Change OG Image" : "Choose OG Image"}
            </button>
            {pgSeo.ogImage && (
              <button onClick={() => onUpdatePageMeta && onUpdatePageMeta(curPg.id, { seo: { ...pgSeo, ogImage: null } })} style={smBtnV2}>✕</button>
            )}
          </div>
        </FieldV2>
      </InsGroup>

      {/* ─── HEADER & FOOTER CHROME ──────────────────────────────── */}
      <InsGroup label="Header & Footer" tabbed open={tab === "chrome"}>
        <FieldV2 label="HEADER LAYOUT">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 5 }}>
            {HEADER_PRESETS.map(p => (
              <button key={p.id} onClick={() => onHeader({ preset: p.id })} title={p.blurb} style={{
                padding: "8px 10px", textAlign: "left",
                background: page.header?.preset === p.id ? "rgba(var(--accent-rgb),.10)" : "var(--c-bg)",
                border: `1px solid ${page.header?.preset === p.id ? "var(--c-amber)" : "var(--c-line-2)"}`,
                borderRadius: 2, cursor: "pointer", color: "inherit",
              }}>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, color: page.header?.preset === p.id ? "var(--c-amber)" : "var(--c-ink-2)", letterSpacing: ".06em", fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--c-ink-3)", marginTop: 2, lineHeight: 1.3 }}>{p.blurb}</div>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <ToggleV2 label="Sticky bar" value={!!page.header?.sticky} onChange={v => onHeader({ sticky: v })}/>
            <ToggleV2 label="Transparent" value={!!page.header?.transparent} onChange={v => onHeader({ transparent: v })}/>
          </div>
        </FieldV2>

        <FieldV2 label="FOOTER PRESET">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 5 }}>
            {FOOTER_PRESETS.map(p => (
              <button key={p.id} onClick={() => onFooter({ preset: p.id })} style={{
                padding: "8px 10px", textAlign: "left",
                background: page.footer?.preset === p.id ? "rgba(var(--accent-rgb),.10)" : "var(--c-bg)",
                border: `1px solid ${page.footer?.preset === p.id ? "var(--c-amber)" : "var(--c-line-2)"}`,
                borderRadius: 2, cursor: "pointer", color: "inherit",
              }}>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, color: page.footer?.preset === p.id ? "var(--c-amber)" : "var(--c-ink-2)", letterSpacing: ".06em", fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--c-ink-3)", marginTop: 2, lineHeight: 1.3 }}>{p.blurb}</div>
              </button>
            ))}
          </div>
        </FieldV2>

        <FieldV2 label="DEFAULT REVEAL MOTION">
          <SelectV2
            value={page.defaultAnimation || "fade-up"}
            onChange={v => onUpdate({ defaultAnimation: v })}
            options={[
              ["none", "None"],
              ["fade-in", "Fade in"],
              ["fade-up", "Fade up"],
              ["fade-down", "Fade down"],
              ["slide-left", "Slide from left"],
              ["slide-right", "Slide from right"],
              ["zoom", "Zoom in"],
              ["blur", "Blur reveal"],
            ]}
          />
        </FieldV2>
      </InsGroup>

      {/* ─── IDENTITY & DOMAIN ───────────────────────────────────── */}
      <InsGroup label="Site Identity & Domain" tabbed open={tab === "identity"}>
        <FieldV2 label="STUDIO NAME">
          <input value={page.studioName || ""} onChange={e => onUpdate({ studioName: e.target.value })} style={inpV2}/>
        </FieldV2>

        <FieldV2 label="CINA HANDLE">
          <div style={{ display: "flex", minWidth: 0 }}>
            <input
              value={(page.domain || "voss.cina").replace(".cina", "")}
              disabled={wbTier(page).customDomain === false}
              onChange={e => onUpdate({ domain: e.target.value.replace(/\s/g, "").toLowerCase() + ".cina" })}
              style={{ ...inpV2, flex: 1, minWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
            <span style={{
              padding: "8px 10px", background: "var(--c-panel-2)", border: "1px solid var(--c-line-2)", borderLeft: "none",
              color: "var(--c-ink-3)", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)",
              borderTopRightRadius: 2, borderBottomRightRadius: 2, display: "flex", alignItems: "center",
            }}>.cina</span>
          </div>
        </FieldV2>

        {wbTier(page).customDomain && <DomainConnectV2 page={page} onUpdate={onUpdate}/>}

        <FieldV2 label="BRAND WORDMARK / LOGO">
          <div style={{
            padding: 12, background: "var(--c-bg)", border: "1px solid var(--c-line-2)", borderRadius: 2,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: page.logo?.kind === "monogram" ? "50%" : 2,
              background: page.logo?.src ? `url(${page.logo.src}) center/contain no-repeat` : `linear-gradient(135deg, ${t.accent}, ${t.accent}55)`,
              color: "var(--c-void)", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: 18, fontWeight: 600, flexShrink: 0,
            }}>
              {!page.logo?.src && (page.logo?.text || page.studioName || "S")[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "var(--c-ink)" }}>{page.logo?.kind === "image" ? "Custom mark" : page.logo?.kind === "monogram" ? "Monogram" : "Wordmark"}</div>
              <div className="t-mono" style={{ fontSize: 10.5, color: "var(--c-ink-3)", marginTop: 2 }}>{page.logo?.text || page.studioName}</div>
            </div>
            <button onClick={onOpenLogoStudio} style={{
              padding: "7px 12px", background: "var(--c-amber)", color: "var(--c-on-amber)",
              border: "none", borderRadius: 2, cursor: "pointer", flexShrink: 0,
              fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700,
            }}>EDIT LOGO</button>
          </div>
        </FieldV2>

        <FieldV2 label="ANALYTICS & CUSTOM CSS">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={page.analyticsId || ""}
              placeholder="Measurement ID · G-XXXXXXX"
              onChange={e => onUpdate({ analyticsId: e.target.value })}
              style={inpV2}
            />
            {page.tier === "enterprise" ? (
              <textarea
                value={page.customCss || ""}
                rows={4}
                placeholder={"/* Custom site CSS */\nh1 { letter-spacing: -0.04em; }"}
                onChange={e => onUpdate({ customCss: e.target.value })}
                spellCheck={false}
                style={{ ...inpV2, resize: "vertical", fontFamily: "var(--f-mono)", fontSize: 11.5 }}
              />
            ) : (
              <button onClick={() => onUpdate({ tier: "enterprise" })} style={{ ...smBtnV2, width: "100%" }}>
                Enable Enterprise Custom CSS Injection
              </button>
            )}
          </div>
        </FieldV2>
      </InsGroup>
    </div>
  );
}

// Keep SectionInspectorV2 as fallback alias
function SectionInspectorV2(props) {
  if (window.SectionInspectorV3) return React.createElement(window.SectionInspectorV3, props);
  return null;
}

Object.assign(window, { ThemeInspectorV2, SectionInspectorV2 });
