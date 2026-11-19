// builder-blocks.jsx — Studio Builder content blocks + WbInlineText direct canvas editing + Storefront integration.

const { useState: usbBl, useEffect: uebBl, useRef: urbBl } = React;

// ─── Direct Click-to-Edit Inline Copy Component ─────────────────────────
// Renders identically to static typography when idle or on live sites; when
// `editable` is true (builder Edit Canvas mode), clicking focuses inline and
// commits directly to section props while staying synced with Right Inspector.
function WbInlineText({ value, onCommit, editable, multiline = false, placeholder = "Click to edit…", tag = "span", style = {}, className = "" }) {
  const [editing, setEditing] = usbBl(false);
  const [draft, setDraft] = usbBl(value || "");
  const ref = urbBl(null);

  uebBl(() => {
    if (!editing) setDraft(value || "");
  }, [value, editing]);

  uebBl(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (typeof ref.current.select === "function") ref.current.select();
    }
  }, [editing]);

  if (!editable || !onCommit) {
    const Tag = tag;
    return <Tag className={className} style={style}>{value || placeholder}</Tag>;
  }

  const commit = () => {
    setEditing(false);
    if (draft !== (value || "")) onCommit(draft);
  };

  if (editing) {
    const shared = {
      ...style,
      margin: 0,
      width: "100%",
      maxWidth: "100%",
      background: "rgba(10,10,12,0.55)",
      color: style.color || "inherit",
      outline: "1.5px dashed var(--c-amber)",
      outlineOffset: 4,
      border: "none",
      padding: "2px 4px",
      boxSizing: "border-box",
      font: "inherit",
      fontFamily: style.fontFamily || "inherit",
      fontSize: style.fontSize || "inherit",
      fontStyle: style.fontStyle || "inherit",
      fontWeight: style.fontWeight || "inherit",
      lineHeight: style.lineHeight || "inherit",
      letterSpacing: style.letterSpacing || "inherit",
      textTransform: style.textTransform || "none",
      textAlign: style.textAlign || "inherit",
    };
    if (multiline) {
      return (
        <textarea
          ref={ref}
          value={draft}
          rows={Math.max(2, Math.min(6, String(draft).split("\n").length + 1))}
          onChange={e => { setDraft(e.target.value); onCommit(e.target.value); }}
          onBlur={commit}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => {
            if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); commit(); }
          }}
          style={{ ...shared, resize: "vertical" }}
        />
      );
    }
    return (
      <input
        ref={ref}
        type="text"
        value={draft}
        onChange={e => { setDraft(e.target.value); onCommit(e.target.value); }}
        onBlur={commit}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
        }}
        style={shared}
      />
    );
  }

  const Tag = tag;
  return (
    <Tag
      className={className + " wb-editable-node"}
      title="Click to edit text inline"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      style={{
        ...style,
        cursor: "text",
        borderRadius: 2,
        transition: "outline-color .15s ease",
      }}
    >
      {value || <span style={{ opacity: 0.45 }}>{placeholder}</span>}
    </Tag>
  );
}

// ─── Parallax hero ──────────────────────────────────────────────────────

function ParallaxHero({ section, t, headlineFont, accent, maxColumn, narrow, editable, onInlineEdit }) {
  const [scrollY, setScrollY] = usbBl(0);
  const rootRef = urbBl(null);
  uebBl(() => {
    let el = rootRef.current && rootRef.current.parentElement;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) break;
      el = el.parentElement;
    }
    const target = el && el !== document.body ? el : window;
    const read = () => setScrollY(target === window ? window.scrollY : target.scrollTop);
    target.addEventListener("scroll", read, { passive: true });
    read();
    return () => target.removeEventListener("scroll", read);
  }, []);
  const drift = (section.props.parallax || 0.4) * scrollY;
  const btnCss = window.wbBtnCss ? wbBtnCss(t, accent, "primary") : { background: accent, color: t.bg, borderRadius: 2 };
  return (
    <div ref={rootRef} style={{ position: "relative", minHeight: 600, color: t.ink, overflow: "hidden" }}>
      <BgImage id={section.props.bgImage || "noir-rain"} src={section.props.bgSrc} overlay={section.props.overlay ?? 0.55} parallaxY={-drift}/>
      <div style={{
        position: "relative", maxWidth: maxColumn, margin: "0 auto", padding: narrow ? "120px 24px 80px" : "170px 32px 110px",
        zIndex: 2,
      }}>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-body)", color: accent, letterSpacing: ".16em", marginBottom: 20, textTransform: "uppercase", fontWeight: 700 }}>
          <WbInlineText value={section.props.kicker} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ kicker: v })}/>
        </div>
        <h1 style={{
          fontFamily: headlineFont, fontStyle: "italic",
          fontSize: `clamp(${(narrow ? 52 : 72) * t.fontScale}px, ${narrow ? 14 : 8.5}cqi, ${138 * t.fontScale}px)`, fontWeight: 400, lineHeight: 0.94,
          margin: "0 0 26px", letterSpacing: "-0.025em", color: t.ink,
          textShadow: "0 4px 24px rgba(0,0,0,.45)",
        }}>
          <WbInlineText value={section.props.title} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ title: v })}/>
        </h1>
        <p style={{ fontSize: 21 * t.fontScale, color: t.ink, opacity: 0.88, maxWidth: 640, lineHeight: 1.48, textShadow: "0 2px 12px rgba(0,0,0,.4)" }}>
          <WbInlineText value={section.props.sub} editable={editable} multiline onCommit={v => onInlineEdit && onInlineEdit({ sub: v })}/>
        </p>
        {section.props.cta && (
          <a href={section.props.cta.href || "#"} onClick={(e) => {
            if (editable) { e.preventDefault(); return; }
            const h = section.props.cta.href || "";
            if (h.startsWith("#")) { e.preventDefault(); wbScrollToSectionV2(h.slice(1)); }
            else if (/^https?:\/\//.test(h)) { e.preventDefault(); window.open(h, "_blank", "noopener"); }
          }} style={{
            display: "inline-block", marginTop: 30,
            padding: "13px 24px", textDecoration: "none",
            fontFamily: "var(--f-mono)", fontSize: "var(--fs-body)", letterSpacing: ".14em",
            fontWeight: 700, textTransform: "uppercase",
            ...btnCss,
          }}>
            <WbInlineText value={section.props.cta.label} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ cta: { ...(section.props.cta || {}), label: v } })}/> →
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Video hero ─────────────────────────────────────────────────────────

function VideoHero({ section, t, headlineFont, accent, editable, onInlineEdit }) {
  return (
    <div style={{ position: "relative", minHeight: 560, overflow: "hidden", color: t.ink }}>
      <BgImage id="smoke" overlay={0.4}/>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, pointerEvents: "none" }}>
        <div style={{
          width: 84, height: 84, borderRadius: "50%",
          background: "rgba(0,0,0,.6)", backdropFilter: "blur(10px)",
          border: `1.5px solid ${accent}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--fs-head)", color: accent,
        }}>▶</div>
      </div>
      <div style={{
        position: "relative", zIndex: 3, padding: "260px 40px 44px",
        background: "linear-gradient(180deg, transparent, rgba(0,0,0,.85))",
      }}>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8 }}>
          <WbInlineText value={section.props.kicker} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ kicker: v })}/>
        </div>
        <h1 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 78 * t.fontScale, fontWeight: 400, margin: 0, lineHeight: 0.96, letterSpacing: "-0.02em", color: t.ink }}>
          <WbInlineText value={section.props.title} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ title: v })}/>
        </h1>
        <p style={{ fontSize: 16 * t.fontScale, opacity: 0.82, marginTop: 12, maxWidth: 540 }}>
          <WbInlineText value={section.props.sub} editable={editable} multiline onCommit={v => onInlineEdit && onInlineEdit({ sub: v })}/>
        </p>
      </div>
    </div>
  );
}

// ─── Branched shelf ─────────────────────────────────────────────────────

function BranchedShelf({ t, accent, headlineFont, section, editable, onInlineEdit }) {
  const allFilms = [
    { id: "frequency", title: "Frequency 88.6", forks: 4, cuts: 81, room: 2840, status: "LIVE" },
    { id: "marauder",  title: "Marauder",       forks: 4, cuts: 81, room: 1410, status: "LIVE" },
    { id: "swallows",  title: "The Swallows",   forks: 4, cuts: 81, room: 982,  status: "LIVE" },
  ];
  const films = allFilms.slice(0, section.props.count || 3);
  const rad = window.wbRadiusPx ? wbRadiusPx(t) : 2;
  const btnCss = window.wbBtnCss ? wbBtnCss(t, accent, "primary") : { background: accent, color: t.bg, borderRadius: 2 };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 26 }}>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>● BRANCHED CINEMA</div>
          <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 44 * t.fontScale, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>
            <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
          </h2>
        </div>
        <a href="#" onClick={(e) => { e.preventDefault(); wbGo(e, "/branches"); }} style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", textDecoration: "none", fontWeight: 700 }}>ALL ROOMS →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 18 }}>
        {films.map((f, i) => (
          <div key={f.id} onClick={(e) => wbGo(e, `/film/${f.id}`)} style={{
            background: `${accent}08`, border: `1px solid ${accent}33`, borderRadius: rad, overflow: "hidden", cursor: "pointer",
          }}>
            <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", background: `linear-gradient(${i * 73}deg, ${accent}66, ${tkc("black")} 80%)` }}>
              {window.FrameThumb && <FrameThumb kind={(typeof getFilm === "function" && getFilm(f.id)?.thumb) || f.id} usePhoto/>}
              <div style={{ position: "absolute", top: 10, left: 10, padding: "2px 7px", background: "rgba(10,10,12,.75)", border: `1px solid ${accent}55`, fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em" }}>● {f.status}</div>
              <div style={{ position: "absolute", top: 10, right: 10, padding: "2px 7px", background: "rgba(0,0,0,.7)", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: tkc("white"), letterSpacing: ".14em", fontVariantNumeric: "tabular-nums" }}>{f.room.toLocaleString()} watching</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-title)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.01em" }}>{f.title}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", marginTop: 8, fontWeight: 700 }}>{f.forks} FORKS · {f.cuts} CUTS</div>
              <button onClick={(e) => wbGo(e, `/film/${f.id}`)} style={{
                marginTop: 12, width: "100%", padding: "10px 14px", cursor: "pointer",
                fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase",
                ...btnCss,
              }}>Join room →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Episodes shelf ─────────────────────────────────────────────────────

function EpisodesShelf({ t, accent, headlineFont, section, editable, onInlineEdit }) {
  const allEps = [
    { n: "01", title: "The Booth",  runtime: "24m", drop: "JUN 14" },
    { n: "02", title: "The Voice",  runtime: "26m", drop: "JUN 21" },
    { n: "03", title: "The Door",   runtime: "22m", drop: "JUN 28" },
    { n: "04", title: "The Choice", runtime: "24m", drop: "JUL 05" },
  ];
  const eps = allEps.slice(0, section.props.count || 4);
  const btnCss = window.wbBtnCss ? wbBtnCss(t, accent, "secondary") : { background: "transparent", color: accent, border: `1px solid ${accent}`, borderRadius: 2 };
  return (
    <div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>SERIES · WEEKLY DROPS</div>
      <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 44 * t.fontScale, fontWeight: 500, margin: "0 0 26px", letterSpacing: "-0.02em" }}>
        <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
      </h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {eps.map((ep, i) => (
          <div key={ep.n} style={{
            display: "grid", gridTemplateColumns: "54px 1.5fr 1fr 72px auto", gap: 18, alignItems: "center",
            padding: "16px 0", borderTop: i === 0 ? `1px solid ${accent}55` : "none",
            borderBottom: `1px solid ${accent}22`,
          }}>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-title)", color: accent, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{ep.n}</div>
            <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-title)", fontWeight: 500, lineHeight: 1.1 }}>{ep.title}</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", opacity: 0.55, letterSpacing: ".14em" }}>DROPS {ep.drop}</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".08em", fontVariantNumeric: "tabular-nums" }}>{ep.runtime}</div>
            <button onClick={(e) => wbGo(e, "/series/ll")} style={{
              padding: "8px 14px", cursor: "pointer", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase",
              ...btnCss,
            }}>Watch</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trailers shelf ─────────────────────────────────────────────────────

function TrailersShelf({ t, accent, headlineFont, section, editable, onInlineEdit }) {
  const allTrailers = [
    { id: "ll-60", film: "Last Light",     len: "60s", vibe: "Slow burn" },
    { id: "ll-90", film: "Last Light",     len: "90s", vibe: "Score-forward" },
    { id: "ff-30", film: "Frequency 88.6", len: "30s", vibe: "Cold noir" },
    { id: "sw-60", film: "The Swallows",   len: "60s", vibe: "Patient" },
  ];
  const trailers = allTrailers.slice(0, section.props.count || 4);
  const rad = window.wbRadiusPx ? wbRadiusPx(t) : 2;
  return (
    <div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>TRAILERS · CUTS UNDER 90s</div>
      <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 44 * t.fontScale, fontWeight: 500, margin: "0 0 26px", letterSpacing: "-0.02em" }}>
        <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 14 }}>
        {trailers.map((tr, i) => {
          const trFilm = (window.CATALOG || []).find(f => f.title === tr.film);
          return (
            <div key={tr.id} onClick={(e) => trFilm && wbGo(e, `/film/${trFilm.id}`)} style={{
              background: `${accent}06`, border: `1px solid ${accent}22`, borderRadius: rad, overflow: "hidden", cursor: "pointer",
            }}>
              <div style={{ position: "relative", aspectRatio: "21/9", overflow: "hidden", background: `linear-gradient(${(i * 89) % 360}deg, ${accent}55, ${tkc("black")} 75%)` }}>
                {trFilm && window.FrameThumb && <FrameThumb kind={trFilm.thumb} usePhoto/>}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55), transparent 60%)" }}/>
                <div style={{
                  position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                  width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,.6)", color: accent,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-lead)", border: `1.5px solid ${accent}`,
                }}>▶</div>
                <div style={{ position: "absolute", bottom: 8, right: 10, fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: tkc("white"), letterSpacing: ".14em" }}>{tr.len}</div>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-lead)", fontWeight: 500, color: t.ink }}>{tr.film}</div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", marginTop: 4, textTransform: "uppercase" }}>{tr.vibe} · {tr.len}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Holders ─────────────────────────────────────────────────────────────

function HoldersBlock({ t, accent, headlineFont, section, editable, onInlineEdit }) {
  const sample = Array.from({ length: 28 }).map((_, i) => ({
    handle: ["@maela","@orin","@bex","@p_chen","@a_kindt","@mosshouse","@quiet","@v_arrow","@ji_lin","@aurora","@laila","@sten"][i % 12] + (i > 11 ? i : ""),
    color: ["var(--c-amber)",tkc("bad"),tkc("cat-1"),tkc("cat-2"),tkc("ink-3")][i % 5],
    tier: i < 4 ? "executive" : i < 12 ? "producer" : "associate",
  }));
  const rad = window.wbRadiusPx ? wbRadiusPx(t) : 2;
  const btnCss = window.wbBtnCss ? wbBtnCss(t, accent, "primary") : { background: accent, color: t.bg, borderRadius: 2 };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>HOLDERS · PATRON CAP TABLE</div>
          <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 44 * t.fontScale, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>
            <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
          </h2>
        </div>
        <button onClick={(e) => { const cid = section.props.creatorId || "voss"; const f = (window.CATALOG || []).find(x => x.nft && (x.creatorId === cid || String(x.creator || "").toLowerCase().includes(cid))); wbGo(e, f ? `/nft/${f.nft}` : "/auctions"); }} style={{
          padding: "10px 18px", cursor: "pointer", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase",
          ...btnCss,
        }}>Become a holder →</button>
      </div>
      <div style={{
        padding: 22, background: `${accent}08`, border: `1px solid ${accent}33`, borderRadius: rad,
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 22,
      }}>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em" }}>EXECUTIVE · 4</div>
          <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-head)", fontWeight: 500, marginTop: 4 }}>$2,000</div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", opacity: 0.6, letterSpacing: ".12em", marginTop: 4 }}>15% rev · ×10 vote · credit</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em" }}>PRODUCER · 8</div>
          <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-head)", fontWeight: 500, marginTop: 4 }}>$320</div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", opacity: 0.6, letterSpacing: ".12em", marginTop: 4 }}>5% rev · ×5 vote · perks</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em" }}>ASSOCIATE · 200</div>
          <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-head)", fontWeight: 500, marginTop: 4 }}>$48</div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", opacity: 0.6, letterSpacing: ".12em", marginTop: 4 }}>0.5% rev · ×2 vote</div>
        </div>
      </div>
      <div style={{ marginTop: 22 }}>
        <div className="t-label" style={{ marginBottom: 10, color: accent, letterSpacing: ".14em" }}>CURRENT CAP TABLE · {sample.length} OF 212</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))", gap: 4 }}>
          {sample.map((h, i) => (
            <div key={i} title={`${h.handle} · ${h.tier}`} style={{
              aspectRatio: "1/1", borderRadius: rad,
              background: `linear-gradient(135deg, ${h.color}55, ${h.color}18)`,
              border: h.tier === "executive" ? `1.5px solid var(--c-amber)` : `1px solid ${h.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: h.color, fontWeight: 700,
            }}>{h.handle.slice(1, 3).toUpperCase()}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Newsletter block ───────────────────────────────────────────────────

function NewsletterBlock({ section, t, accent, headlineFont, editable, onInlineEdit }) {
  const [nlEmail, setNlEmail] = usbBl("");
  const [nlDone, setNlDone] = usbBl(false);
  const rad = window.wbRadiusPx ? wbRadiusPx(t) : 2;
  const btnCss = window.wbBtnCss ? wbBtnCss(t, accent, "primary") : { background: accent, color: t.bg };
  const subscribe = () => {
    const v = nlEmail.trim();
    if (!v || !v.includes("@")) return;
    wbInboxPush("subscribers", { email: v });
    setNlDone(true);
    if (window.toast) window.toast({ title: "SUBSCRIBED", text: v, kind: "good" });
  };
  return (
    <div style={{
      padding: "clamp(22px, 5cqi, 40px)",
      background: `linear-gradient(135deg, ${accent}14, transparent 75%)`,
      border: `1px solid ${accent}44`,
      borderRadius: rad,
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "24px 36px", alignItems: "center",
    }}>
      <div>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>NEWSLETTER</div>
        <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 40 * t.fontScale, fontWeight: 500, margin: 0, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
        </h2>
        <p style={{ fontSize: 14 * t.fontScale, opacity: 0.72, marginTop: 12, maxWidth: 480, lineHeight: 1.55 }}>
          <WbInlineText value={section.props.sub} editable={editable} multiline onCommit={v => onInlineEdit && onInlineEdit({ sub: v })}/>
        </p>
      </div>
      {nlDone ? (
        <div style={{ minWidth: 0, width: "100%", padding: "16px 18px", border: `1px solid ${accent}55`, borderRadius: rad, textAlign: "center", fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-lead)", color: accent }}>You're on the list.</div>
      ) : (
        <div style={{ display: "flex", minWidth: 0, width: "100%" }}>
          <input
            value={nlEmail} type="email" placeholder="you@domain.com"
            onChange={e => setNlEmail(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); subscribe(); } }}
            style={{
              flex: 1, minWidth: 0, padding: "14px 16px", background: "rgba(0,0,0,.28)",
              border: `1px solid ${accent}55`, borderRight: "none", outline: "none",
              fontFamily: "var(--f-mono)", fontSize: "var(--fs-body)", color: t.ink,
            }}/>
          <button onClick={(e) => { e.stopPropagation(); subscribe(); }} style={{
            padding: "14px 20px", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase",
            display: "flex", alignItems: "center", cursor: "pointer",
            ...btnCss, borderRadius: 0,
          }}>SUBSCRIBE</button>
        </div>
      )}
    </div>
  );
}

// ─── Contact block ──────────────────────────────────────────────────────

function ContactBlock({ section, t, accent, headlineFont, editable, onInlineEdit }) {
  const [name, setName] = usbBl("");
  const [email, setEmail] = usbBl("");
  const [msg, setMsg] = usbBl("");
  const cFallback = defaultPropsV2("contact", null);
  const cProps = { ...section.props };
  ["phone", "address", "hours"].forEach(k3 => { if (cProps[k3] === undefined) cProps[k3] = cFallback[k3]; });
  const [sent, setSent] = usbBl(false);
  const rad = window.wbRadiusPx ? wbRadiusPx(t) : 2;
  const btnCss = window.wbBtnCss ? wbBtnCss(t, accent, "primary") : { background: accent, color: t.bg, borderRadius: 2 };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: section.props.formEnabled ? "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" : "1fr", gap: 48, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>GET IN TOUCH</div>
          <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: `clamp(26px, 4.8cqi, ${52 * t.fontScale}px)`, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 14, wordBreak: "break-word" }}>
            <WbInlineText value={section.props.email} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ email: v })}/>
          </div>
          {(cProps.agent || cProps.phone || cProps.address || cProps.hours) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 6 }}>
              {[
                cProps.agent && ["REPRESENTED BY", cProps.agent, "agent"],
                cProps.phone && ["PHONE", cProps.phone, "phone"],
                cProps.address && ["STUDIO", cProps.address, "address"],
                cProps.hours && ["HOURS", cProps.hours, "hours"],
              ].filter(Boolean).map(([k2, v2, fld], i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "11px 0", borderTop: `1px solid ${accent}26` }}>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", width: 118, flexShrink: 0 }}>{k2}</span>
                  <span style={{ fontSize: 13.5 * t.fontScale, opacity: 0.84, flex: 1 }}>
                    <WbInlineText value={v2} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ [fld]: v })}/>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {section.props.formEnabled && (
          <div style={{ padding: 26, background: `${accent}0e`, border: `1px solid ${accent}44`, borderRadius: rad, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", marginBottom: 6, textTransform: "uppercase" }}>
              <WbInlineText value={section.props.formHeadline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ formHeadline: v })}/>
            </div>
            <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-lead)", opacity: 0.8, marginBottom: 18 }}>
              <WbInlineText value={section.props.formSubline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ formSubline: v })}/>
            </div>
            {sent ? (
              <div style={{ padding: 18, textAlign: "center", border: `1px solid ${accent}55`, borderRadius: rad }}>
                <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-lead)", color: accent }}>Sent. Thank you.</div>
                <div style={{ fontSize: "var(--fs-body)", opacity: 0.7, marginTop: 6 }}>I read every message. Reply window: 3–7 days.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={contactInp(t, accent, rad)}/>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={contactInp(t, accent, rad)}/>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Your message" rows={4} style={{ ...contactInp(t, accent, rad), resize: "vertical" }}/>
                <button onClick={(e) => { e.stopPropagation(); wbInboxPush("messages", { name, email, msg }); setSent(true); }} style={{
                  marginTop: 6, padding: "12px 18px", cursor: "pointer",
                  fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em",
                  fontWeight: 700, textTransform: "uppercase", ...btnCss,
                }}>Send the note →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function contactInp(t, accent, rad = 2) {
  return {
    padding: "11px 13px", background: "rgba(0,0,0,.22)",
    border: `1px solid ${accent}44`, borderRadius: rad, color: t.ink,
    fontSize: "var(--fs-body)", fontFamily: "var(--f-sans)", outline: "none",
  };
}

// ─── Storefront Catalog Block (Synced Live with cina:studio-store) ──────

function readSharedStore() {
  try {
    if (window.wbLoadStoreCatalog) return window.wbLoadStoreCatalog();
    const v = JSON.parse(localStorage.getItem("cina:studio-store") || "null");
    if (Array.isArray(v)) return v;
  } catch {}
  return null;
}

function StoreBlock({ section, t, accent, headlineFont, editable, onInlineEdit }) {
  const [tick, setTick] = usbBl(0);
  uebBl(() => {
    const on = () => setTick(x => x + 1);
    window.addEventListener("cina:store-changed", on);
    return () => window.removeEventListener("cina:store-changed", on);
  }, []);

  const shared = readSharedStore();
  const live = shared && shared.filter(p => p.status === "active");
  const products = (live && live.length)
    ? live.map(p => ({ id: p.id, name: p.title, price: p.price, kind: (p.type || "ITEM").toUpperCase(), color: p.swatch || accent, image: (p.images || [])[0] || p.image, glyph: p.glyph, source: p.source, desc: p.desc, colors: p.colors, subscribable: p.subscribable, sellerId: p.creatorId || "studio" }))
    : (section.props.products || []);
  const connected = !!(live && live.length);
  const layout = section.props.layout || "grid";
  const showPrice = section.props.showPrice !== false;
  const cid = section.props.creatorId || "voss";
  const studioFilms = (window.CATALOG || []).filter(f => f.creatorId === cid || String(f.creator || "").toLowerCase().includes(cid));
  const pool = studioFilms.length ? studioFilms : (window.CATALOG || []);
  const stillFor = (p, i) => {
    if (p.image || p.glyph) return null;
    const named = pool.find(f => f.title && String(p.name || "").toLowerCase().includes(f.title.toLowerCase()));
    return (named || pool[i % Math.max(1, pool.length)] || {}).thumb || null;
  };
  const shownProducts = products.slice(0, section.props.limit || 12).map((p, i) => ({ ...p, _still: stillFor(p, i) }));
  const rad = window.wbRadiusPx ? wbRadiusPx(t) : 2;
  const viewBtnCss = window.wbBtnCss ? wbBtnCss(t, accent, "secondary") : { background: "transparent", color: accent, border: `1px solid ${accent}`, borderRadius: 2 };
  const addBtnCss = window.wbBtnCss ? wbBtnCss(t, accent, "primary") : { background: accent, color: t.bg, borderRadius: 2 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>
            STOREFRONT{connected ? ` · ${live.length} EDITIONS LIVE` : ""}
          </div>
          <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 44 * t.fontScale, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>
            <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
          </h2>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.cinaCart && window.cinaCart.open) window.cinaCart.open();
          }}
          style={{
            padding: "8px 14px", cursor: "pointer",
            fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase",
            ...viewBtnCss,
          }}
        >
          Preview bag drawer ↗
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: layout === "row" ? "repeat(auto-fill, minmax(min(100%, 200px), 1fr))" : "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
        gap: 18,
      }}>
        {shownProducts.map((p, i) => (
          <div
            key={p.id || i}
            onClick={(e) => {
              e.stopPropagation();
              if (window.cinaCart && window.cinaCart.quickView) window.cinaCart.quickView(p);
            }}
            style={{
              background: `${accent}06`, border: `1px solid ${accent}28`, borderRadius: rad, overflow: "hidden",
              cursor: "pointer", display: "flex", flexDirection: "column",
            }}
          >
            <div style={{
              aspectRatio: "1/1", position: "relative", overflow: "hidden",
              background: p.color ? `linear-gradient(135deg, ${p.color}, ${tkc("black")} 90%)` : `linear-gradient(135deg, ${accent}99, ${tkc("black")} 80%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {p._still && window.FrameThumb && <span style={{ position: "absolute", inset: 0 }}><FrameThumb kind={p._still} usePhoto/></span>}
              {p._still && <span style={{ position: "absolute", left: 10, top: 10, padding: "3px 7px", background: "rgba(0,0,0,.72)", border: "1px solid rgba(255,255,255,.15)", color: tkc("white"), fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em" }}>{p.kind}</span>}
              {p._still ? null : p.image
                ? <img src={p.image} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}/>
                : p.glyph
                  ? <span style={{ fontSize: "var(--fs-head)", opacity: 0.85 }}>{p.glyph}</span>
                  : <span style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em", color: tkc("white"), opacity: 0.9, fontWeight: 700 }}>{p.kind}</span>}
            </div>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-lead)", fontWeight: 500, color: t.ink, lineHeight: 1.18, minWidth: 0 }}>{p.name}</div>
                {showPrice && <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-body)", color: accent, letterSpacing: ".08em", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>${Number(p.price || 0).toFixed(0)}</div>}
              </div>
              {p.desc && <div style={{ fontSize: 12.5 * t.fontScale, opacity: 0.68, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.desc}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 4 }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.cinaCart && window.cinaCart.quickView) window.cinaCart.quickView(p);
                  }}
                  style={{
                    flex: 1, padding: "7px 10px", cursor: "pointer",
                    fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase",
                    ...viewBtnCss,
                  }}
                >
                  Quick view
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.cinaCart && window.cinaCart.add) {
                      window.cinaCart.add({ name: p.name, price: p.price, kind: p.kind, color: p.color, image: p.image, sellerId: p.sellerId || "studio" });
                    }
                  }}
                  style={{
                    padding: "7px 12px", cursor: "pointer",
                    fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase",
                    ...addBtnCss,
                  }}
                >
                  + Bag
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div style={{
            gridColumn: "1/-1", padding: "36px 20px", textAlign: "center", borderRadius: rad,
            border: `1.5px dashed ${accent}44`, color: accent,
            fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em",
          }}>ADD PRODUCTS IN THE LEFT STORE PANEL TO POPULATE THIS STOREFRONT</div>
        )}
      </div>
    </div>
  );
}

// ─── Blog ────────────────────────────────────────────────────────────────

function readSharedNotebook() {
  try { const v = JSON.parse(localStorage.getItem("cina:studio-notebook") || "null"); if (Array.isArray(v)) return v; } catch {}
  return null;
}

function BlogBlock({ section, t, accent, headlineFont, siteId, editable, onInlineEdit }) {
  const shared = readSharedNotebook();
  const livePosts = shared && shared.filter(p => p.status === "published").map(p => ({
    id: p.id,
    date: (() => { if (!p.date) return ""; const dt = new Date(p.date + "T12:00"); return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); })(),
    read: Math.max(1, Math.round(((p.blocks || []).reduce((n, b) => n + ((b.value || "").split(/\s+/).filter(Boolean).length), 0)) / 200)) + " min",
    title: p.title || "Untitled",
    excerpt: p.dek || ((p.blocks || []).find(b => b.type === "text")?.value || "").slice(0, 150),
  }));
  const fallback = [
    { date: "May 22, 2026", read: "8 min", title: "Why we shoot on safelight", excerpt: "It's not nostalgia. It's that the wait teaches you what the photo is going to be." },
    { date: "May 14, 2026", read: "5 min", title: "Working with Cina v3 for casting", excerpt: "The actor vault changed how we block. We can carry a face across every scene." },
    { date: "May 03, 2026", read: "12 min", title: "Score lessons · 'Last Light'", excerpt: "A note on writing for the held image. Three rules I broke. One I won't again." },
  ];
  const connected = !!(livePosts && livePosts.length);
  let posts = connected ? livePosts : ((section.props.posts && section.props.posts.length) ? section.props.posts : fallback);
  if (connected) {
    if (section.props.sort === "oldest") posts = [...posts].reverse();
    posts = posts.slice(0, section.props.limit || 4);
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", textTransform: "uppercase" }}>
          NOTEBOOK{connected ? ` · ${livePosts.length} PUBLISHED` : ""}
        </div>
      </div>
      <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 52 * t.fontScale, fontWeight: 400, margin: "0 0 28px", letterSpacing: "-0.02em" }}>
        <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
      </h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {posts.map((p, i) => (
          <a key={i} href="#" title="Read the post"
            onClick={(e) => {
              e.preventDefault();
              if (!e.currentTarget.closest("[data-wb-live]")) return;
              e.stopPropagation();
              const to = `/site/${siteId || "voss"}/notebook/${p.id != null ? p.id : i}`;
              if (window.navigate) navigate(to); else window.location.hash = "#" + to;
            }}
            style={{
              display: "block", textDecoration: "none", color: "inherit",
              padding: "24px 0", borderTop: `1px solid ${accent}33`, cursor: "pointer",
            }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase" }}>{p.date}</span>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: t.ink, opacity: 0.45, letterSpacing: ".14em", textTransform: "uppercase" }}>{p.read} read</span>
            </div>
            <h3 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 28 * t.fontScale, fontWeight: 500, margin: "4px 0 8px", letterSpacing: "-0.01em" }}>{p.title}</h3>
            <p style={{ fontSize: 15 * t.fontScale, opacity: 0.72, lineHeight: 1.55, margin: 0, maxWidth: 700 }}>{p.excerpt}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Shop NFT ────────────────────────────────────────────────────────────

function ShopNFTBlock({ section, t, accent, headlineFont, editable, onInlineEdit }) {
  const drops = [
    { tier: "EXECUTIVE", title: "Last Light · Producer", price: "0.8 ETH", ed: 4 },
    { tier: "PRODUCER",  title: "Last Light · Backer",   price: "0.18 ETH", ed: 50 },
    { tier: "ASSOCIATE", title: "Last Light · Holder",   price: "0.04 ETH", ed: 200 },
  ];
  const rad = window.wbRadiusPx ? wbRadiusPx(t) : 2;
  const btnCss = window.wbBtnCss ? wbBtnCss(t, accent, "primary") : { background: accent, color: t.bg, borderRadius: 2 };
  return (
    <div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>OWN A PIECE</div>
      <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 44 * t.fontScale, fontWeight: 500, margin: "0 0 26px", letterSpacing: "-0.02em" }}>
        <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 16 }}>
        {drops.map((d, i) => (
          <div key={i} style={{ padding: 22, background: `${accent}0e`, border: `1px solid ${accent}55`, borderRadius: rad, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", fontWeight: 700 }}>{d.tier}</div>
            <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-title)", fontWeight: 500, lineHeight: 1.2 }}>{d.title}</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", opacity: 0.6, letterSpacing: ".14em" }}>{d.price} · {d.ed} editions</div>
            <button onClick={(e) => {
              if (!e.currentTarget.closest("[data-wb-live]")) return;
              e.stopPropagation();
              if (window.openPay) openPay({ kind: "mint", title: d.title, subtitle: `${d.tier} · ${d.ed} editions · ${d.price}`, accent, priceUSD: Math.round((parseFloat(d.price) || 0) * 3200), perks: ["Revenue share on the film", "Holder rooms and votes", "Your name in the credits"] });
              else if (window.toast) toast({ title: "MINT", text: `${d.title} · ${d.price}`, kind: "good" });
            }} style={{
              marginTop: 4, padding: "10px 14px", cursor: "pointer",
              fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase", ...btnCss,
            }}>Mint →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Actor Vault ─────────────────────────────────────────────────────────

function ActorVaultBlock({ section, t, accent, headlineFont, editable, onInlineEdit }) {
  const cast = [
    { name: "Elias Voss",  role: "Protagonist", color: tkc("ink-3"), refs: 12 },
    { name: "Maren Kell",  role: "Antagonist",  color: tkc("blood"), refs: 8 },
    { name: "Det. Nomura", role: "Supporting",  color: tkc("cat-6"), refs: 5 },
    { name: "The Subject", role: "Victim",      color: tkc("warn"),  refs: 3 },
  ];
  const rad = window.wbRadiusPx ? wbRadiusPx(t) : 2;
  return (
    <div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".16em", marginBottom: 8, textTransform: "uppercase" }}>CAST VAULT</div>
      <h2 style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: 44 * t.fontScale, fontWeight: 500, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
        <WbInlineText value={section.props.headline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ headline: v })}/>
      </h2>
      <p style={{ fontSize: "var(--fs-body)", opacity: 0.65, marginBottom: 24, maxWidth: 600 }}>
        <WbInlineText value={section.props.subline} editable={editable} onCommit={v => onInlineEdit && onInlineEdit({ subline: v })}/>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: 14 }}>
        {cast.map((c) => (
          <div key={c.name} style={{ background: `${c.color}10`, border: `1px solid ${c.color}44`, borderRadius: rad, overflow: "hidden" }}>
            <div style={{ aspectRatio: "3/4", background: `linear-gradient(135deg, ${c.color}66, ${tkc("black")})`, position: "relative" }}>
              <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 7px", background: "rgba(0,0,0,.72)", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: c.color, letterSpacing: ".12em", border: `1px solid ${c.color}` }}>{c.refs} REFS</div>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-lead)", fontWeight: 500, color: t.ink, lineHeight: 1.1 }}>{c.name}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: c.color, letterSpacing: ".14em", marginTop: 4, textTransform: "uppercase" }}>{c.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Footer (preset-driven) ──────────────────────────────────────────────

function FooterBlock({ page, section, t, accent, headlineFont, narrow, editable, onInlineEdit }) {
  const fp = (section && section.props) || {};
  const preset = fp.preset || page.footer?.preset || "stacked-mono";
  const tagline = fp.tagline || "An independent studio making slow films and the occasional branched one.";
  const socials = (fp.socials && fp.socials.length) ? fp.socials : [{ label: "Instagram", href: "#" }, { label: "X", href: "#" }, { label: "RSS", href: "#" }];
  const contacts = (fp.contacts && fp.contacts.length) ? fp.contacts : [{ label: "Studio mail", href: "#" }, { label: "Agent · WME", href: "#" }, { label: "Press", href: "#" }];
  const copyright = fp.copyright || `© 2026 ${page.studioName}`;
  const onLink = (e, href) => {
    const h = href || "";
    if (!h || h === "#") { e.preventDefault(); return; }
    if (h.startsWith("#")) { e.preventDefault(); wbScrollToSectionV2(h.slice(1)); }
    else if (/^https?:\/\//.test(h)) { e.preventDefault(); window.open(h, "_blank", "noopener"); }
  };
  const cid = (page.domain || "").split(".")[0];
  const profileMark = (
    <a key="cina-profile" href="#" title="View this studio on Cina"
      onClick={(e) => { e.preventDefault(); if (e.currentTarget.closest("[data-wb-live]")) { if (window.navigate) window.navigate(`/studios/${cid}`); else window.location.hash = `#/studios/${cid}`; } }}
      style={{ display: "inline-flex", alignItems: "center", gap: 7, color: accent, textDecoration: "none" }}>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".14em" }}>CINA PROFILE</span>
    </a>
  );
  if (preset === "single-line") {
    return (
      <div style={{
        padding: "28px 32px", borderTop: `1px solid ${accent}33`,
        display: "flex", alignItems: narrow ? "flex-start" : "center", justifyContent: "space-between", gap: narrow ? 14 : 18,
        flexDirection: narrow ? "column" : "row",
        fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: t.ink, opacity: 0.75,
        letterSpacing: ".14em", textTransform: "uppercase",
      }}>
        <span style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-lead)", opacity: 1, letterSpacing: "-0.01em" }}>{page.studioName}</span>
        <span>{copyright}</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {profileMark}
          {socials.map((s, i) => <a key={i} href={s.href || "#"} onClick={(e) => onLink(e, s.href)} style={{ color: accent, textDecoration: "none" }}>{s.label}</a>)}
        </div>
      </div>
    );
  }
  if (preset === "directory") {
    return (
      <div style={{ padding: "56px 32px 32px", borderTop: `1px solid ${accent}44` }}>
        <div style={{ maxWidth: t.columnWidth, margin: "0 auto", display: "grid", gridTemplateColumns: narrow ? "1fr 1fr" : "1.5fr 1fr 1fr 1fr", gap: narrow ? 24 : 36 }}>
          <div>
            <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-title)", fontWeight: 500, marginBottom: 10 }}>{page.studioName}</div>
            <p style={{ fontSize: "var(--fs-body)", opacity: 0.65, lineHeight: 1.5, margin: 0 }}>
              <WbInlineText value={tagline} editable={editable} multiline onCommit={v => onInlineEdit && onInlineEdit({ tagline: v })}/>
            </p>
          </div>
          {[
            { h: "WORK", l: ["Films", "Series", "Branched", "Trailers"] },
            { h: "STUDIO", l: ["About", "Notebook", "Store", "Press"] },
            { h: "CONTACT", l: ["Studio mail", "Agent · WME", "Festivals"] },
          ].map((c, i) => (
            <div key={i}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", marginBottom: 10, fontWeight: 700 }}>{c.h}</div>
              {c.l.map(item => (
                <a key={item} href="#" onClick={(e) => e.preventDefault()} style={{
                  display: "block", padding: "5px 0", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: t.ink, opacity: 0.72, letterSpacing: ".08em", textDecoration: "none",
                }}>{item}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, padding: "18px 0 0", borderTop: `1px solid ${accent}22`, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", opacity: 0.55, letterSpacing: ".14em" }}>
          <span>{copyright.toUpperCase()}</span>
          <span>{profileMark}</span>
          <span>{page.domain}</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: "52px 32px", borderTop: `1px solid ${accent}33` }}>
      <div style={{ maxWidth: t.columnWidth, margin: "0 auto", display: "grid", gridTemplateColumns: narrow ? "1fr" : "2fr 1fr 1fr", gap: narrow ? 24 : 36 }}>
        <div>
          <div style={{ fontFamily: headlineFont, fontStyle: "italic", fontSize: "var(--fs-title)", fontWeight: 500, letterSpacing: "-0.01em" }}>{page.studioName}</div>
          <p style={{ fontSize: "var(--fs-body)", opacity: 0.65, lineHeight: 1.5, margin: "8px 0 6px", maxWidth: 420 }}>
            <WbInlineText value={tagline} editable={editable} multiline onCommit={v => onInlineEdit && onInlineEdit({ tagline: v })}/>
          </p>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", opacity: 0.5, letterSpacing: ".14em", marginTop: 8 }}>{page.domain}</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", marginBottom: 8, fontWeight: 700 }}>FOLLOW</div>
          <div style={{ padding: "3px 0 5px" }}>{profileMark}</div>
          {socials.map((s, i) => <a key={i} href={s.href || "#"} onClick={(e) => onLink(e, s.href)} style={{ display: "block", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: t.ink, opacity: 0.7, padding: "3px 0", textDecoration: "none" }}>{s.label}</a>)}
        </div>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: accent, letterSpacing: ".14em", marginBottom: 8, fontWeight: 700 }}>CONTACT</div>
          {contacts.map((s, i) => <a key={i} href={s.href || "#"} onClick={(e) => onLink(e, s.href)} style={{ display: "block", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: t.ink, opacity: 0.7, padding: "3px 0", textDecoration: "none" }}>{s.label}</a>)}
        </div>
      </div>
      <div style={{ marginTop: 28, fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", opacity: 0.45, letterSpacing: ".14em" }}>
        {copyright.toUpperCase()}
      </div>
    </div>
  );
}

Object.assign(window, { WbInlineText, ParallaxHero, VideoHero, BranchedShelf, EpisodesShelf, TrailersShelf, HoldersBlock, NewsletterBlock, ContactBlock, StoreBlock, BlogBlock, ShopNFTBlock, ActorVaultBlock, FooterBlock });
