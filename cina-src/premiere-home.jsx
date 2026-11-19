// premiere-home.jsx — Watch Screening Room Home.
// Full-bleed Tonight's Programme stage with interactive 4-film selector strip,
// zero-radius discovery filter bar, live cinema rooms bento, and curated rails.

function pmHomePicks() {
  const notes = window.PROGRAMMER_NOTES || {};
  return (window.CATALOG || []).filter(f => notes[f.id]).sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4)
    .map(f => ({ id: f.id, film: f, note: notes[f.id].split(/(?<=[.!?])\s/)[0] }));
}

function PmHomeHero() {
  const picks = umPm(pmHomePicks, []);
  const [i, setI] = usPm(0);
  const [paused, setPaused] = usPm(false);
  const [trailerFilm, setTrailerFilm] = usPm(null);

  uePm(() => {
    if (paused || trailerFilm || picks.length < 2) return;
    const t = setTimeout(() => setI(x => (x + 1) % picks.length), 8000);
    return () => clearTimeout(t);
  }, [i, paused, trailerFilm, picks.length]);

  const { film, note } = picks[i] || {};
  if (!film) return null;
  const isSeries = film.kind === "series";
  const play = isSeries ? "Start Season" : film.free ? "Watch Free" : `Watch · $${film.rent}`;
  const who = (window.PROGRAMMER && window.PROGRAMMER.name) || "Ada Beresford";

  return (
    <section className="pm-hero pm-hero--home" data-cina-hero onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {trailerFilm && typeof TrailerModal === "function" && <TrailerModal film={trailerFilm} onClose={() => setTrailerFilm(null)}/>}
      {picks.map((p, k) => (
        <div key={p.id} className={"pm-hero__img" + (k === i ? " is-on" : "")} style={{ opacity: k === i ? 1 : 0 }}>
          <FrameThumb kind={p.film.thumb} usePhoto/>
        </div>
      ))}
      <div className="pm-hero__scrim"></div>
      <div className="pm-hero__body">
        <div className="pm-wrap">
          <div className="pm-hero__grid">
            <div className="pm-hero__main" key={film.id}>
              <span className="pm-k" style={{ color: "var(--c-ink-2)" }}>
                <b>Tonight's Programme · 0{i + 1} / 0{picks.length}</b> — Curated Screening Room
              </span>
              <h1 className="pm-xl">{film.title}</h1>
              <div className="pm-hero__meta">
                <span>{pmCreatorName(film)}</span>
                <span>{(film.genre || [])[0]}</span>
                <span>{isSeries ? `Season ${film.season} · ${film.totalEpisodes} EP` : film.runtime}</span>
                <span style={{ color: "var(--c-amber)" }}>★ {film.rating}</span>
              </div>
              <p className="pm-lede">{film.logline}</p>
              <div className="pm-actions">
                <button className="pm-btn pm-btn--primary" onClick={() => pmGo(pmDest(film))}>
                  <Icon name="play" size={13}/>{play}
                </button>
                {typeof TrailerModal === "function" && (
                  <button className="pm-btn pm-btn--glass" onClick={() => setTrailerFilm(film)}>
                    <Icon name="film" size={14}/>Trailer
                  </button>
                )}
                <PmWatchlistBtn film={film} glass/>
                {window.openCreateParty && (
                  <button className="pm-btn pm-btn--glass pm-btn--icon" title="Watch together in a synced room" aria-label="Start a watch party" onClick={() => openCreateParty(film)}>
                    <Icon name="users" size={15}/>
                  </button>
                )}
              </div>
              <div className="pm-hero__note" key={film.id + "-n"} style={{ animation: "pmRise .55s .08s ease both" }}>
                <p className="pm-note">“{note}”<cite>{who} · Lead Programmer</cite></p>
              </div>
            </div>

            <div className="pm-prog-strip" role="tablist" aria-label="Tonight's 4 featured films">
              <div className="pm-prog-strip__head">
                <span>On the Marquee</span>
                <span style={{ color: "var(--c-amber)" }}>{paused ? "Paused" : "Auto-screening"}</span>
              </div>
              {picks.map((p, k) => {
                const active = k === i;
                return (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={active}
                    className="pm-prog-item"
                    data-on={active ? "1" : "0"}
                    data-paused={active && paused ? "1" : "0"}
                    onClick={() => setI(k)}
                    onDoubleClick={() => pmGo(pmDest(p.film))}
                  >
                    <span className="pm-k" style={{ color: active ? "var(--c-amber)" : "var(--c-ink-4)" }}>
                      0{k + 1}
                    </span>
                    <span className="pm-prog-item__thumb">
                      <FrameThumb kind={p.film.thumb} usePhoto/>
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, textAlign: "left" }}>
                      <span style={{ fontSize: "0.86rem", fontWeight: active ? 600 : 500, color: active ? "var(--c-ink)" : "var(--c-ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.film.title}
                      </span>
                      <span style={{ fontFamily: "var(--f-mono)", fontSize: "0.64rem", letterSpacing: ".08em", color: "var(--c-ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {pmCreatorName(p.film)} · {p.film.kind === "series" ? `S${p.film.season}` : p.film.runtime}
                      </span>
                    </span>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: "0.68rem", color: active ? "var(--c-amber)" : "var(--c-ink-4)" }}>
                      ★ {p.film.rating}
                    </span>
                    <span className="pm-prog-item__bar"><span/></span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PM_UPCOMING_SLATE = [
  {
    id: "up-stillwater",
    title: "Stillwater Echo",
    director: "Elias Voss",
    studio: "Darkroom",
    genre: "Noir Thriller",
    releaseDate: "2026-12-04",
    format: "Feature · 1h 54m",
    thumb: "noir-f",
    color: tkc("cat-3"),
    logline: "An acoustic archivist uncovers a 1978 tape reel recorded inside an abandoned hydro-station beneath Oslo.",
  },
  {
    id: "up-orbital",
    title: "Orbital Nine",
    director: "Lin Hara",
    studio: "Atlas",
    genre: "Sci-Fi",
    releaseDate: "2026-12-18",
    format: "Series · 6 EP",
    thumb: "sci-ship",
    color: tkc("cat-6"),
    logline: "Nine relay technicians maintain an ice-ring beacon whose optical telemetry begins arriving twelve minutes early.",
  },
  {
    id: "up-redmesa",
    title: "Red Mesa",
    director: "Yara Kim",
    studio: "Plains",
    genre: "Western",
    releaseDate: "2027-01-09",
    format: "Feature · 2h 08m",
    thumb: "west-canyon",
    color: tkc("amber-d"),
    logline: "Two estranged sisters ride south to reclaim their surveyor father’s ledger before the winter thaw seals the pass.",
  },
  {
    id: "up-magnetic",
    title: "Magnetic South",
    director: "Tao Reng",
    studio: "Tape",
    genre: "Synth Noir",
    releaseDate: "2027-01-23",
    format: "Feature · 1h 42m",
    thumb: "sci-neon",
    color: tkc("cat-2"),
    logline: "A late-night cassette restorer traces a bootleg broadcast across rain-slicked harbor highways.",
  },
  {
    id: "up-wintertable",
    title: "Winter Table",
    director: "Mira Sten",
    studio: "Kitchen",
    genre: "Drama",
    releaseDate: "2027-02-06",
    format: "Feature · 1h 49m",
    thumb: "window-rain",
    color: tkc("cat-5"),
    logline: "Over one snowbound weekend in Gothenburg, four neighbors cook through a cellar of unlabeled preserves.",
  },
  {
    id: "up-emberline",
    title: "Emberline",
    director: "Soren Vail",
    studio: "Darkroom",
    genre: "Thriller",
    releaseDate: "2027-02-20",
    format: "Limited · 4 EP",
    thumb: "alley-night",
    color: tkc("blood"),
    logline: "When a coastal timber town goes dark, an insurance photographer documents every frame before dawn.",
  },
];

function pmTitleCase(str) {
  const s = String(str || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function pmResolveStudio(film, studios, creators) {
  const parts = String(film?.creator || "").split("·");
  if (parts.length > 1 && parts[1].trim()) return parts[1].trim();
  const house = (studios || []).find(s => (s.members || []).includes(film?.creatorId));
  if (house && house.name) return pmTitleCase(house.name);
  const creator = (creators || []).find(c => c.id === film?.creatorId);
  if (creator && creator.theme) return pmTitleCase(creator.theme);
  return "Independent";
}

function pmFormatFutureDate(iso) {
  try {
    const dt = new Date(iso + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
  } catch {
    return iso;
  }
}

function pmDaysUntil(iso) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(iso + "T00:00:00").getTime();
  return Math.max(1, Math.ceil((target - today) / 86400000));
}

function pmFormatWatchedAgo(ts) {
  if (!ts) return "Recently";
  const diffMin = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 2) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function PmExpandableTrailerModal({ film, studioLabel, onClose }) {
  const DUR = 102; // 1:42 preview reel
  const [playing, setPlaying] = usPm(true);
  const [sec, setSec] = usPm(0);
  const [muted, setMuted] = usPm(true);
  const [theater, setTheater] = usPm(false);

  uePm(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
      else if (e.key === " ") {
        const tag = (e.target && e.target.tagName) || "";
        if (!/INPUT|TEXTAREA|BUTTON/.test(tag)) { e.preventDefault(); setPlaying(p => !p); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  uePm(() => {
    if (!playing) return;
    const h = setInterval(() => {
      setSec(s => (s + 1 > DUR ? 0 : s + 1));
    }, 1000);
    return () => clearInterval(h);
  }, [playing]);

  if (!film) return null;

  const fmtTime = (n) => {
    const m = Math.floor(n / 60);
    const r = Math.floor(n % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const director = pmCreatorName(film);
  const progNote = window.PROGRAMMER_NOTES && window.PROGRAMMER_NOTES[film.id];
  const rawCast = (window.getCastForFilm && window.getCastForFilm(film.id)) || [];
  const castList = rawCast.length > 0
    ? rawCast
    : (window.CAST || []).slice(0, 4);
  const isSeries = film.kind === "series";
  const ctaLabel = isSeries ? "Open Series" : film.free ? "Watch Free" : `Watch · $${film.rent || "4.99"}`;
  const mediaSrc = film.trailerUrl || film.videoUrl || (typeof film.video === "string" ? film.video : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer preview for ${film.title}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 920,
        background: "rgba(5,5,7,0.88)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: theater ? "1.5vh 2vw" : "3vh 4vw",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: theater ? "min(96vw, 1280px)" : "min(92vw, 920px)",
          maxHeight: "94vh",
          overflowY: "auto",
          background: "var(--c-panel)",
          border: "1px solid var(--c-line-2)",
          borderRadius: "2px",
          boxShadow: "0 36px 90px rgba(0,0,0,0.85)",
          transition: "max-width 0.25s cubic-bezier(.16,1,.3,1)",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "0.75rem 1.15rem",
            borderBottom: "1px solid var(--c-line)",
            background: "var(--c-panel-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
            <span className="pm-k" style={{ color: "var(--c-amber)", flexShrink: 0 }}>
              <b>Expandable Trailer</b>
            </span>
            <span className="pm-k" style={{ color: "var(--c-ink-4)" }}>/</span>
            <span style={{
              fontFamily: "var(--f-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 600,
              color: "var(--c-ink)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {film.title}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <button
              type="button"
              className="pm-btn pm-btn--sm"
              onClick={() => setTheater(v => !v)}
              aria-pressed={theater}
              title={theater ? "Restore compact modal size" : "Expand trailer player"}
            >
              {theater ? "Compact view" : "Expand player"}
            </button>
            <button
              type="button"
              className="pm-btn pm-btn--sm"
              onClick={onClose}
              aria-label="Close trailer modal"
            >
              × Close
            </button>
          </div>
        </div>

        {/* Playable Trailer Viewport */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: theater ? "21 / 9" : "16 / 9",
            background: film.color || "#070709",
            overflow: "hidden",
            borderBottom: "1px solid var(--c-line)",
            transition: "aspect-ratio 0.25s ease",
          }}
        >
          {mediaSrc ? (
            <video
              src={mediaSrc}
              autoPlay={playing}
              muted={muted}
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              onClick={() => setPlaying(p => !p)}
              style={{
                position: "absolute",
                inset: 0,
                cursor: "pointer",
                transform: playing ? `scale(${1.02 + (sec % 20) * 0.002})` : "scale(1)",
                transition: "transform 1.1s linear",
              }}
            >
              <FrameThumb kind={film.thumb} usePhoto/>
            </div>
          )}

          {/* Atmospheric scrim */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: "linear-gradient(180deg, rgba(6,6,8,0.45) 0%, rgba(6,6,8,0.08) 42%, rgba(6,6,8,0.88) 100%)",
            }}
          />

          {/* Top left live telemetry */}
          <div style={{
            position: "absolute",
            top: "0.85rem",
            left: "1rem",
            right: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pointerEvents: "none",
          }}>
            <span className="t-mono" style={{
              fontSize: "0.64rem",
              letterSpacing: "0.14em",
              color: playing ? "var(--c-amber)" : "var(--c-ink-3)",
              background: "rgba(8,8,10,0.78)",
              border: "1px solid rgba(255,255,255,0.16)",
              padding: "0.22rem 0.55rem",
              borderRadius: "2px",
            }}>
              {playing ? "● PREVIEW REEL PLAYING" : "❚❚ PAUSED"}
            </span>
            <span className="t-mono t-num" style={{
              fontSize: "0.64rem",
              letterSpacing: "0.12em",
              color: "var(--c-ink-2)",
              background: "rgba(8,8,10,0.78)",
              border: "1px solid rgba(255,255,255,0.16)",
              padding: "0.22rem 0.55rem",
              borderRadius: "2px",
            }}>
              {fmtTime(sec)} / {fmtTime(DUR)}
            </span>
          </div>

          {/* Bottom player transport & scrubber */}
          <div style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "0.85rem 1.1rem 0.9rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.55rem",
          }}>
            <input
              type="range"
              min={0}
              max={DUR}
              value={sec}
              onChange={(e) => setSec(parseInt(e.target.value, 10) || 0)}
              aria-label="Scrub trailer timeline"
              style={{ width: "100%", accentColor: tkc("amber"), cursor: "pointer", margin: 0 }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="pm-btn pm-btn--sm pm-btn--primary"
                onClick={() => setPlaying(p => !p)}
              >
                <Icon name={playing ? "pause" : "play"} size={11}/>
                {playing ? "Pause Trailer" : "Play Trailer"}
              </button>
              <button
                type="button"
                className="pm-btn pm-btn--sm pm-btn--glass"
                onClick={() => setMuted(m => !m)}
              >
                {muted ? "Unmute" : "Mute"}
              </button>
              <span style={{ flex: 1 }}/>
              <button
                type="button"
                className="pm-btn pm-btn--sm pm-btn--glass"
                onClick={() => pmGo(pmDest(film))}
              >
                {ctaLabel} →
              </button>
            </div>
          </div>
        </div>

        {/* Content body: Full Logline + Cast List */}
        <div style={{ padding: "1.45rem 1.4rem 1.6rem", display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: "1.6rem" }}>
          {/* Left column: Title, Metadata, Full Logline & Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", minWidth: 0 }}>
            <div>
              <div className="pm-k" style={{ color: "var(--c-amber)", marginBottom: "0.35rem" }}>
                {[director, studioLabel || film.creator, film.year].filter(Boolean).join(" · ")}
              </div>
              <h2 style={{
                margin: 0,
                fontFamily: "var(--f-display)",
                fontStyle: "italic",
                fontSize: "clamp(1.65rem, 2.5vw, 2.3rem)",
                fontWeight: 500,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--c-ink)",
              }}>
                {film.title}
              </h2>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 0.9rem", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", color: "var(--c-ink-3)", letterSpacing: ".08em", textTransform: "uppercase" }}>
              {(film.genre || []).slice(0, 3).map(g => <span key={g}>{g}</span>)}
              <span>·</span>
              <span>{isSeries ? `Season ${film.season} · ${film.totalEpisodes} EP` : (film.runtime || "Feature")}</span>
              {film.rating && <><span>·</span><span style={{ color: "var(--c-amber)" }}>★ {film.rating}</span></>}
            </div>

            <div>
              <div className="pm-k" style={{ color: "var(--c-ink-4)", marginBottom: "0.35rem" }}>Full Logline</div>
              <p style={{ margin: 0, fontSize: "0.96rem", lineHeight: 1.62, color: "var(--c-ink-2)", textWrap: "pretty" }}>
                {film.logline || "An original independent work screening exclusively on Cina."}
              </p>
              {progNote && (
                <p style={{ margin: "0.75rem 0 0", paddingLeft: "0.85rem", borderLeft: "2px solid var(--c-amber)", fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "0.95rem", lineHeight: 1.5, color: "var(--c-ink-3)" }}>
                  “{progNote}”
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem", paddingTop: "0.4rem" }}>
              <button
                type="button"
                className="pm-btn pm-btn--primary"
                onClick={() => pmGo(pmDest(film))}
              >
                <Icon name="play" size={13}/>{ctaLabel}
              </button>
              <PmWatchlistBtn film={film}/>
              {window.openCreateParty && (
                <button
                  type="button"
                  className="pm-btn"
                  onClick={() => { onClose && onClose(); openCreateParty(film); }}
                >
                  <Icon name="users" size={14}/>Watch Party
                </button>
              )}
            </div>
          </div>

          {/* Right column: Full Cast List */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            paddingLeft: "1.2rem",
            borderLeft: "1px solid var(--c-line)",
            minWidth: 0,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" }}>
              <span className="pm-k" style={{ color: "var(--c-ink)" }}>
                <b>Principal Cast</b>
              </span>
              <span className="pm-k t-num" style={{ color: "var(--c-ink-4)" }}>
                {castList.length} credited
              </span>
            </div>

            {castList.length === 0 ? (
              <div style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-3)", padding: "0.75rem 0" }}>
                Ensemble credits available in the film dossier.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {castList.map((actor) => {
                  const credit = (actor.roles || []).find(r => r.filmId === film.id);
                  const roleLabel = credit?.role || actor.role || "Featured Performer";
                  return (
                    <button
                      key={actor.id || actor.name}
                      type="button"
                      onClick={() => { onClose && onClose(); pmGo(`/cast/${actor.id}`); }}
                      style={{
                        all: "unset",
                        boxSizing: "border-box",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.45rem 0.55rem",
                        background: "var(--c-bg)",
                        border: "1px solid var(--c-line)",
                        borderRadius: "2px",
                        cursor: "pointer",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: "2px", overflow: "hidden", background: "var(--c-panel-2)", flexShrink: 0 }}>
                        {actor.photo ? (
                          <img src={actor.photo} alt={actor.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
                        ) : window.CastPortrait ? (
                          <CastPortrait actor={actor} size={38}/>
                        ) : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {actor.name}
                        </div>
                        <div className="pm-k" style={{ color: "var(--c-ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {roleLabel}
                        </div>
                      </div>
                      <span style={{ color: "var(--c-amber)", fontSize: "0.85rem", flexShrink: 0 }}>→</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
window.ExpandableTrailerModal = PmExpandableTrailerModal;

function PmFeaturedCinemaIndex({ catalog, studios, creators }) {
  usePmState();
  const [query, setQuery] = usPm("");
  const [studioFilter, setStudioFilter] = usPm("all");
  const [selectedGenres, setSelectedGenres] = usPm([]);
  const [expanded, setExpanded] = usPm(false);
  const [trailerItem, setTrailerItem] = usPm(null);

  const sessionVersion = (window.SESSION && window.SESSION.v) || 0;
  const continueWatching = umPm(() => {
    const entries = (window.SESSION && Array.isArray(window.SESSION.continued)) ? window.SESSION.continued : [];
    const byFilm = new Map();
    entries.forEach(entry => {
      if (!entry || !entry.filmId) return;
      const dur = Number(entry.dur) || 0;
      const t = Number(entry.t) || 0;
      if (t <= 0 || dur <= 0) return;
      const ratio = t / dur;
      if (ratio >= 0.96) return;
      const prev = byFilm.get(entry.filmId);
      if (!prev || (entry.at || 0) > (prev.at || 0)) {
        byFilm.set(entry.filmId, { ...entry, t, dur, pct: Math.max(1, Math.min(99, Math.round(ratio * 100))) });
      }
    });
    return Array.from(byFilm.values())
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .map(entry => {
        const film = (catalog || []).find(f => f.id === entry.filmId);
        if (!film) return null;
        const leftMin = Math.max(1, Math.round((entry.dur - entry.t) / 60));
        return {
          ...entry,
          film,
          studio: pmResolveStudio(film, studios, creators),
          director: pmCreatorName(film),
          leftMin,
          ago: pmFormatWatchedAgo(entry.at),
        };
      })
      .filter(Boolean);
  }, [catalog, studios, creators, sessionVersion]);

  const enriched = umPm(() => {
    return (catalog || []).map(f => {
      const director = pmCreatorName(f);
      const studio = pmResolveStudio(f, studios, creators);
      const searchBlob = [
        f.title,
        director,
        f.creator,
        studio,
        ...(f.genre || []),
        ...(f.moods || []),
        ...(f.tags || []),
        f.logline,
        f.year,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return { film: f, director, studio, searchBlob };
    });
  }, [catalog, studios, creators]);

  const studioOptions = umPm(() => {
    const counts = {};
    enriched.forEach(item => {
      counts[item.studio] = (counts[item.studio] || 0) + 1;
    });
    return ["all", ...Object.keys(counts).sort((a, b) => counts[b] - counts[a])];
  }, [enriched]);

  const genreOptions = umPm(() => {
    const counts = {};
    enriched.forEach(item => {
      const seen = new Set();
      (item.film.genre || []).forEach(g => {
        if (!g || seen.has(g)) return;
        seen.add(g);
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .map(genre => ({ genre, count: counts[genre] }));
  }, [enriched]);

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const trimmedQuery = query.trim().toLowerCase();
  const matched = umPm(() => {
    const tokens = trimmedQuery.split(/\s+/).filter(Boolean);
    return enriched.filter(item => {
      if (studioFilter !== "all" && item.studio !== studioFilter) return false;
      if (selectedGenres.length > 0) {
        const genres = item.film.genre || [];
        if (!selectedGenres.some(g => genres.includes(g))) return false;
      }
      if (!tokens.length) return true;
      return tokens.every(tok => item.searchBlob.includes(tok));
    });
  }, [enriched, trimmedQuery, studioFilter, selectedGenres]);

  const hasFilter = Boolean(trimmedQuery || studioFilter !== "all" || selectedGenres.length > 0);
  const visible = hasFilter || expanded ? matched : matched.slice(0, 8);
  const activeFilterSummary = [
    query.trim(),
    studioFilter !== "all" ? studioFilter : null,
    selectedGenres.length ? selectedGenres.join(" + ") : null,
  ].filter(Boolean).join(" · ");

  return (
    <PmSection
      id="featured-cinema"
      title="Featured Cinema"
      note={
        hasFilter
          ? `${matched.length} of ${enriched.length} titles matched${selectedGenres.length ? ` · ${selectedGenres.length} ${selectedGenres.length === 1 ? "genre" : "genres"} active` : ""}`
          : `${enriched.length} titles · searchable by director, studio, or keyword`
      }
      link={hasFilter ? "Clear index" : expanded ? "Show top 8" : matched.length > 8 ? `View all ${matched.length}` : undefined}
      onLink={() => {
        if (hasFilter) {
          setQuery("");
          setStudioFilter("all");
          setSelectedGenres([]);
        } else {
          setExpanded(e => !e);
        }
      }}
    >
      {/* Continue Watching row — partially watched titles ordered by most recent activity */}
      {continueWatching.length > 0 && (
        <div
          aria-label="Continue Watching"
          style={{
            marginBottom: "2rem",
            paddingBottom: "1.6rem",
            borderBottom: "1px solid var(--c-line)",
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem 1rem",
            marginBottom: "0.9rem",
          }}>
            <span className="pm-k" style={{ color: "var(--c-ink)" }}>
              <b>Continue Watching</b> · Ordered by most recent activity
            </span>
            <span className="pm-k t-num" style={{ color: "var(--c-ink-3)" }}>
              {continueWatching.length} in progress
            </span>
          </div>

          <div
            className="pm-rail"
            style={{
              "--pm-col": "clamp(16rem, 23.5%, 24rem)",
            }}
          >
            {continueWatching.map(({ film, pct, leftMin, ago, ep, t, dur, studio, director }) => {
              const userR = window.getRating ? getRating(film.id) : 0;
              return (
                <PmCardShell
                  key={`${film.id}-${ep || "f"}`}
                  label={`Resume ${film.title} at ${pct}%`}
                  onClick={() => {
                    if (window.recordWatchActivity) {
                      window.recordWatchActivity(film.id, t, dur, ep);
                    }
                    pmGo(pmDest(film));
                  }}
                >
                  <div className="pm-card__img" style={{ aspectRatio: "16 / 9", background: film.color }}>
                    <PmImg kind={film.thumb}/>
                    <span className="pm-badge pm-badge--red pm-card__badge-pushed t-num">Resume · {pct}%</span>
                    <span
                      className="t-mono t-num"
                      style={{
                        position: "absolute",
                        right: "0.5rem",
                        top: "0.5rem",
                        zIndex: 3,
                        padding: "0.18rem 0.45rem",
                        fontSize: "0.58rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: "rgba(10,10,12,.78)",
                        border: "1px solid rgba(255,255,255,.16)",
                        color: "var(--c-ink-2)",
                      }}
                    >
                      {ago}
                    </span>
                    <PmQuickRate film={film} className="pm-quick-rate--still"/>
                    <div className="pm-card__over" style={{ paddingBottom: "1rem" }}>
                      <span className="pm-card__ot">{film.title}</span>
                      <span className="pm-card__cue" aria-hidden="true"><Icon name="play" size={10}/>Resume</span>
                    </div>
                    <div className="pm-watch-line" aria-label={`${pct}% watched`}>
                      <span style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span className="pm-card__t">{film.title}</span>
                      <span className="pm-k t-num" style={{ color: "var(--c-amber)", flexShrink: 0 }}>{leftMin}m left</span>
                    </div>
                    <span className="pm-card__m">
                      {[director, studio, ep ? `Ep ${ep}` : null, userR ? `You ${userR}/5` : null].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </PmCardShell>
              );
            })}
          </div>
        </div>
      )}

      {/* Searchable index controls */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
        marginBottom: "1.6rem",
      }}>
        <div className="pm-search" style={{ padding: "0.35rem 0 0.7rem" }}>
          <Icon name="search" size={18}/>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, director, studio, genre, or keyword…"
            aria-label="Search Featured Cinema by title, director, studio, or keyword"
            style={{
              fontSize: "clamp(1.15rem, 1.9vw, 1.7rem)",
              fontStyle: "normal",
              fontFamily: "var(--f-sans)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          />
          <span className="pm-k t-num" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            {matched.length} / {enriched.length}
          </span>
          {query && (
            <button
              type="button"
              className="pm-btn pm-btn--sm"
              onClick={() => setQuery("")}
              aria-label="Clear search query"
            >
              Clear
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Filter Featured Cinema by studio"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.25rem 0.6rem",
            borderBottom: "1px solid var(--c-line)",
          }}
        >
          {studioOptions.map(st => {
            const active = studioFilter === st;
            return (
              <button
                key={st}
                type="button"
                role="tab"
                aria-selected={active}
                className="pm-chip"
                data-on={active ? "1" : "0"}
                onClick={() => setStudioFilter(st)}
              >
                {st === "all" ? "All Studios" : st}
              </button>
            );
          })}
        </div>

        {/* Multi-select Genre filter bar */}
        {genreOptions.length > 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.45rem",
            borderBottom: "1px solid var(--c-line)",
            paddingBottom: "0.15rem",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.4rem 1rem",
            }}>
              <span className="pm-k" style={{ color: "var(--c-ink-3)" }}>
                Genres · Select multiple to combine
              </span>
              {selectedGenres.length > 0 && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                  <span className="pm-k t-num" style={{ color: "var(--c-amber)" }}>
                    {selectedGenres.length} selected · {matched.length} {matched.length === 1 ? "match" : "matches"}
                  </span>
                  <button
                    type="button"
                    className="pm-btn pm-btn--sm"
                    onClick={() => setSelectedGenres([])}
                    aria-label="Clear selected genres"
                  >
                    Clear genres
                  </button>
                </div>
              )}
            </div>

            <div
              role="group"
              aria-label="Multi-select Featured Cinema genres"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "0.2rem 0.55rem",
              }}
            >
              <button
                type="button"
                aria-pressed={selectedGenres.length === 0}
                className="pm-chip"
                data-on={selectedGenres.length === 0 ? "1" : "0"}
                onClick={() => setSelectedGenres([])}
              >
                <span>All Genres</span>
              </button>

              {genreOptions.map(({ genre, count }) => {
                const active = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    aria-pressed={active}
                    className="pm-chip"
                    data-on={active ? "1" : "0"}
                    onClick={() => toggleGenre(genre)}
                  >
                    {active && (
                      <span style={{ color: "var(--c-amber)", display: "inline-flex" }} aria-hidden="true">
                        <Icon name="check" size={11}/>
                      </span>
                    )}
                    <span>{genre}</span>
                    <span
                      className="pm-k t-num"
                      style={{
                        color: active ? "var(--c-amber)" : "var(--c-ink-4)",
                        fontSize: "0.62rem",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Featured Cinema Grid using native .pm-grid & vertical Film/Series/Branched cards */}
      {visible.length === 0 ? (
        <PmEmpty
          title="No matching films in the index."
          body={`No titles matched "${activeFilterSummary}". Try another director, studio, genre combination, or keyword.`}
        >
          <button
            type="button"
            className="pm-btn"
            onClick={() => {
              setQuery("");
              setStudioFilter("all");
              setSelectedGenres([]);
            }}
          >
            Reset search index
          </button>
        </PmEmpty>
      ) : (
        <div className="pm-grid">
          {visible.map(({ film, studio }) => (
            <PmPoster
              key={film.id}
              film={film}
              studioLabel={studio}
              onClick={() => setTrailerItem({ film, studio })}
            />
          ))}
        </div>
      )}

      {trailerItem && (
        <PmExpandableTrailerModal
          film={trailerItem.film}
          studioLabel={trailerItem.studio}
          onClose={() => setTrailerItem(null)}
        />
      )}
    </PmSection>
  );
}

function PmUpcomingPremieres({ catalog, studios, creators }) {
  usePmState();

  const premieres = umPm(() => {
    const nowMs = Date.now();
    const list = [...PM_UPCOMING_SLATE];
    const seen = new Set(list.map(x => x.title.toLowerCase()));

    (studios || []).forEach(st => {
      (st.upcoming || []).forEach(u => {
        const dtMs = new Date(u.date + "T12:00:00").getTime();
        if (!Number.isFinite(dtMs) || dtMs <= nowMs) return;
        if (seen.has(String(u.title || "").toLowerCase())) return;
        seen.add(String(u.title || "").toLowerCase());
        const cr = (creators || []).find(c => c.id === u.creatorId);
        list.push({
          id: "st-" + st.id + "-" + u.id,
          title: u.title,
          director: cr ? cr.name : st.name,
          studio: pmTitleCase(st.name),
          genre: u.kind === "series" ? "Series" : "Feature Film",
          releaseDate: u.date,
          format: u.kind === "series" ? "Upcoming Series" : "Upcoming Feature",
          thumb: st.bgImage || "darkroom-wide",
          color: st.color || tkc("panel-2"),
          logline: st.tagline || "Scheduled studio premiere on Cina.",
        });
      });
    });

    (catalog || []).forEach(f => {
      const iso = f.releaseDate || (f.nextDrop ? f.nextDrop.slice(0, 10) : null);
      if (!iso) return;
      const dtMs = new Date(iso + "T12:00:00").getTime();
      if (!Number.isFinite(dtMs) || dtMs <= nowMs) return;
      if (seen.has(String(f.title || "").toLowerCase())) return;
      seen.add(String(f.title || "").toLowerCase());
      list.push({
        id: "cat-" + f.id,
        title: f.title,
        director: pmCreatorName(f),
        studio: pmResolveStudio(f, studios, creators),
        genre: (f.genre || [])[0] || "Cinema",
        releaseDate: iso,
        format: f.kind === "series" ? `Series · S${f.season}` : f.runtime,
        thumb: f.thumb,
        color: f.color,
        logline: f.logline,
      });
    });

    return list.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  }, [catalog, studios, creators]);

  return (
    <PmSection
      id="upcoming-premieres"
      title="Upcoming Premieres"
      note={`${premieres.length} scheduled world premieres · set release reminders`}
      link="Festival Slate"
      onLink={() => pmGo("/festival")}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 21rem), 1fr))",
        gap: "2.2vh 1.8%",
        width: "100%",
      }}>
        {premieres.map(item => {
          const remKey = "premiere:" + item.id;
          const notified = pmHasReminder(remKey);
          const daysLeft = pmDaysUntil(item.releaseDate);
          return (
            <article
              key={item.id}
              className="pm-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "0.9rem",
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="pm-card__img" style={{ aspectRatio: "16 / 9", background: item.color }}>
                  <PmImg kind={item.thumb}/>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  borderBottom: "1px solid var(--c-line)",
                  paddingBottom: "0.55rem",
                }}>
                  <span className="pm-k t-num" style={{ color: "var(--c-amber)", fontWeight: 600 }}>
                    {pmFormatFutureDate(item.releaseDate)}
                  </span>
                  <span className="pm-k t-num">
                    In {daysLeft} {daysLeft === 1 ? "day" : "days"} · {item.format}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: 0 }}>
                  <h3
                    className="t-display"
                    style={{
                      fontStyle: "italic",
                      fontSize: "clamp(1.25rem, 1.55vw, 1.6rem)",
                      fontWeight: 400,
                      lineHeight: 1.12,
                      margin: 0,
                      color: "var(--c-ink)",
                    }}
                  >
                    {item.title}
                  </h3>
                  <div className="pm-card__m">
                    {item.director} · {item.studio} · {item.genre}
                  </div>
                  <p className="pm-card__s" style={{ margin: "0.25rem 0 0" }}>
                    {item.logline}
                  </p>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                paddingTop: "0.55rem",
                borderTop: "1px solid var(--c-line)",
              }}>
                <span className="pm-k">
                  {notified ? "Alert scheduled" : "Premiere alert"}
                </span>
                <button
                  type="button"
                  className={"pm-btn pm-btn--sm" + (notified ? " pm-btn--on" : "")}
                  aria-pressed={notified}
                  onClick={() => pmToggleReminder(remKey, {
                    label: `${item.title} (${item.director})`,
                    date: item.releaseDate,
                    studio: item.studio,
                  })}
                >
                  <Icon name={notified ? "check" : "bell"} size={13}/>
                  <span>{notified ? "Notified" : "Notify Me"}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </PmSection>
  );
}

function PmHome() {
  const S = window.SHELVES || [], C = window.CATALOG || [];
  const [filter, setFilter] = usPm("all");

  const sh = (id) => S.find(s => s.id === id);
  const films = (id) => (sh(id)?.filmIds || []).map(pmFilm).filter(Boolean);
  const quote = (id) => { const n = sh(id)?.note; return n ? { body: n.body, who: n.who } : null; };
  const continuing = C.filter(f => pmProgress(f) > 0);
  const top = [...C].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  const forYou = (() => {
    const p = typeof window.buildPersonalShelves === "function" ? window.buildPersonalShelves()[0] : null;
    const ids = p ? p.filmIds : (sh("trending")?.filmIds || []);
    return { title: p ? p.title : "Selected for your taste", note: p ? p.subtitle : "Curated from independent cinema houses", films: ids.map(pmFilm).filter(Boolean) };
  })();
  const rooms = Object.values(window.BRANCH_FILMS || {}).map(t => ({ t, film: pmFilm(t.filmId) })).filter(x => x.film).sort((a, b) => (b.t.roomSize || 0) - (a.t.roomSize || 0));
  const ed = typeof window.pmNextEdition === "function" ? pmNextEdition() : null;
  const studios = window.STUDIOS || [];
  const creators = window.CREATORS || [];
  const yours = sh("yourpremieres");

  const FILTERS = [
    ["all", "All Tonight"],
    ["film", "Feature Films"],
    ["series", "Series"],
    ["branched", "Branched"],
    ["Sci-Fi", "Sci-Fi"],
    ["Noir", "Noir"],
    ["Thriller", "Thriller"],
    ["Drama", "Drama"],
  ];

  const filteredCatalog = umPm(() => {
    if (filter === "all") return [];
    if (filter === "film") return C.filter(f => f.kind !== "series");
    if (filter === "series") return C.filter(f => f.kind === "series");
    if (filter === "branched") return C.filter(f => f.branched || (window.BRANCH_FILMS && window.BRANCH_FILMS[f.id]));
    const needle = filter.toLowerCase();
    return C.filter(f => (f.genre || []).some(g => g.toLowerCase().includes(needle)));
  }, [filter, C.length]);

  const leadRoom = rooms[0];
  const liveViewers = rooms.reduce((acc, r) => acc + (r.t.roomSize || 0), 0);

  return (
    <div className="pm" data-screen-label="Home">
      <PmHomeHero/>

      {/* Architectural Hairline Discovery Bar (0 corner radius) */}
      <div className="pm-home-bar" role="navigation" aria-label="Screening room filters">
        <div className="pm-wrap pm-home-bar__inner">
          <div className="pm-home-bar__tabs" role="tablist">
            {FILTERS.map(([val, label]) => (
              <button
                key={val}
                role="tab"
                aria-selected={filter === val}
                className="pm-tab"
                data-on={filter === val ? "1" : "0"}
                onClick={() => setFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
            <button className="pm-link" onClick={() => pmGo("/rooms")}>
              <Icon name="users" size={13}/>Watch Parties
            </button>
            <span className="pm-sep"/>
            <button className="pm-link" onClick={() => pmGo("/festival")}>
              <Icon name="award" size={13}/>Festival
            </button>
          </div>
        </div>
      </div>

      <div className="pm-over">
        {filter !== "all" ? (
          <PmSection
            title={FILTERS.find(x => x[0] === filter)?.[1] || filter}
            note={`${filteredCatalog.length} ${filteredCatalog.length === 1 ? "title" : "titles"} screening`}
            link="Reset to full programme"
            onLink={() => setFilter("all")}
          >
            {filteredCatalog.length > 0 ? (
              <div className="pm-grid">
                {filteredCatalog.map(f => <PmPoster key={f.id} film={f}/>)}
              </div>
            ) : (
              <PmEmpty title="Nothing in this filter right now." body="Return to tonight's full screening room.">
                <button className="pm-btn" onClick={() => setFilter("all")}>Show all titles</button>
              </PmEmpty>
            )}
          </PmSection>
        ) : (
          <>
            {continuing.length > 0 && (
              <PmRailSection title="Continue watching" note="Pick up right at your frame" col="still" link="My Library" onLink={() => pmGo("/library")}>
                {continuing.map(f => {
                  const ep = f.kind === "series" ? f.series.find(e => e.watched > 0 && e.watched < 1) : null;
                  return (
                    <PmStill
                      key={f.id}
                      film={f}
                      progress={pmProgress(f)}
                      thumb={ep?.thumb}
                      meta={ep ? `S${f.season} · E${ep.ep} · ${ep.title}` : `${f.runtime} · ★ ${f.rating}`}
                      onClick={() => pmGo(ep ? `/series/${f.id}/ep/${ep.ep}` : `/film/${f.id}`)}
                    />
                  );
                })}
              </PmRailSection>
            )}

            <PmFeaturedCinemaIndex catalog={C} studios={studios} creators={creators}/>

            <PmUpcomingPremieres catalog={C} studios={studios} creators={creators}/>

            {/* Live Cinema Experiences Bento — replaces scattered generic banners */}
            <PmSection title="Live Screening Rooms" note="Interactive forks, synced rooms & monthly festival">
              <div className="pm-home-bento">
                <button className="pm-bento-card" onClick={() => pmGo(leadRoom ? `/branches/${leadRoom.t.filmId}` : "/branches")}>
                  <div className="pm-bento-card__bg"><FrameThumb kind={leadRoom?.film?.thumb || C[0]?.thumb} usePhoto/></div>
                  <div className="pm-bento-card__scrim"/>
                  <div className="pm-bento-card__body">
                    <span className="pm-k"><b>● Live Branched Cinema</b> · {liveViewers.toLocaleString()} in rooms</span>
                    <span className="pm-h2">{leadRoom ? leadRoom.t.title : "Audience-Voted Story Forks"}</span>
                    <span className="pm-card__m" style={{ whiteSpace: "normal" }}>
                      Every viewer votes in real time when the story reaches a narrative crossroads.
                    </span>
                  </div>
                </button>

                <button className="pm-bento-card" onClick={() => pmGo("/rooms")}>
                  <div className="pm-bento-card__bg"><FrameThumb kind={(pmFilm("ll") || C[1] || C[0])?.thumb} usePhoto/></div>
                  <div className="pm-bento-card__scrim"/>
                  <div className="pm-bento-card__body">
                    <span className="pm-k"><b>● Synced Watch Parties</b> · Open lobbies</span>
                    <span className="pm-h2">Watch Together, Frame-Accurate</span>
                    <span className="pm-card__m" style={{ whiteSpace: "normal" }}>
                      Drop into a live screening room with friends or host a private premiere.
                    </span>
                  </div>
                </button>

                {ed && (
                  <button className="pm-bento-card" onClick={() => pmGo("/festival")}>
                    <div className="pm-bento-card__bg"><FrameThumb kind={(films("new")[0] || C[2] || C[0])?.thumb} usePhoto/></div>
                    <div className="pm-bento-card__scrim"/>
                    <div className="pm-bento-card__body">
                      <span className="pm-k"><b>Edition {String(ed.number).padStart(2, "0")}</b> · {ed.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · 7 PM PT</span>
                      <span className="pm-h2">Cina Monthly Film Festival</span>
                      <span className="pm-card__m" style={{ whiteSpace: "normal" }}>
                        Twelve curated world premieres screened in sequence, followed by director rooms.
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </PmSection>

            <PmSection title="Cinema Intelligence &amp; Director Telemetry" note="Real-time Google Search Grounding &amp; Recharts Studio Analytics">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "1.4%" }}>
                <button
                  className="pm-card pm-panel"
                  onClick={() => window.openCinemaSearch && window.openCinemaSearch("Latest cinema news, festival coverage, and critical film reviews", "all", true)}
                  style={{
                    justifyContent: "space-between", gap: "0.65rem", textAlign: "left",
                    transition: "border-color .16s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-amber)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-line)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
                    <span className="pm-k"><b>Search Grounding</b> · Live Web</span>
                    <Icon name="globe" size={15}/>
                  </div>
                  <span className="pm-h2">Cinema News, Reviews &amp; Film Data</span>
                  <span className="pm-card__m" style={{ whiteSpace: "normal", lineHeight: 1.5 }}>
                    Query real-time festival dispatches, critic consensus, box-office figures, and full cast credits with verified web citations.
                  </span>
                  <span className="pm-k" style={{ color: "var(--c-amber)", marginTop: "0.25rem" }}>Open Live Cinema Search →</span>
                </button>

                <button
                  className="pm-card pm-panel"
                  onClick={() => pmGo("/analytics")}
                  style={{
                    justifyContent: "space-between", gap: "0.65rem", textAlign: "left",
                    transition: "border-color .16s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-amber)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-line)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
                    <span className="pm-k"><b>Director Analytics</b> · Recharts Telemetry</span>
                    <Icon name="trend" size={15}/>
                  </div>
                  <span className="pm-h2">Film Popularity &amp; Studio Performance</span>
                  <span className="pm-card__m" style={{ whiteSpace: "normal", lineHeight: 1.5 }}>
                    Inspect daily view velocity, catalog ratings, act-III audience retention curves, territory reach, and studio revenue streams.
                  </span>
                  <span className="pm-k" style={{ color: "var(--c-amber)", marginTop: "0.25rem" }}>Open Director Analytics →</span>
                </button>
              </div>
            </PmSection>

            {yours && films("yourpremieres").length > 0 && (
              <PmRailSection title={yours.title} note={yours.subtitle} link="Portfolio" onLink={() => pmGo("/wallet")}>
                {films("yourpremieres").map(f => <PmPoster key={f.id} film={f} badge={{ t: "Backed", red: true }}/>)}
              </PmRailSection>
            )}

            <PmRailSection title="Top 10 on Cina this week" note="Most watched across independent houses" col="rank">
              {top.map((f, k) => <PmRankCard key={f.id} film={f} n={k + 1}/>)}
            </PmRailSection>

            {forYou.films.length > 0 && (
              <PmRailSection title={forYou.title} note={forYou.note} link="Taste Print" onLink={() => pmGo("/taste")}>
                {forYou.films.map(f => <PmPoster key={f.id} film={f}/>)}
              </PmRailSection>
            )}

            <PmRailSection title="New releases" quote={quote("new")} col="still" link="All Films" onLink={() => pmGo("/genre/film")}>
              {films("new").map(f => <PmStill key={f.id} film={f} badge={{ t: "New" }}/>)}
            </PmRailSection>

            {rooms.length > 0 && (
              <PmSection title="Branched rooms open now" note="Live fork topology · vote on the canonical cut" link="All Branched" onLink={() => pmGo("/branches")}>
                <div className="pm-branch-grid">
                  {rooms.map(({ t, film }) => (
                    <PmBranchedCard
                      key={t.filmId}
                      film={film}
                      tree={t}
                      onClick={() => pmGo(`/branches/${t.filmId}`)}
                    />
                  ))}
                </div>
              </PmSection>
            )}

            <PmRailSection title="Slow-burn noir" quote={quote("noir")} link="Browse Noir" onLink={() => pmGo("/genre/noir")}>
              {films("noir").map(f => <PmPoster key={f.id} film={f}/>)}
            </PmRailSection>

            <PmRailSection title="After-dark horror & tension" quote={quote("horror")}>
              {films("horror").map(f => <PmPoster key={f.id} film={f}/>)}
            </PmRailSection>

            <PmRailSection title="Drama, in close" col="poster" link="All Series" onLink={() => pmGo("/genre/series")}>
              {films("drama").map(f => <PmPoster key={f.id} film={f}/>)}
            </PmRailSection>

            {studios.length > 0 && (
              <PmRailSection title="Director-Owned Studios" note="Subscribe directly to independent houses" col="studio" link="All Studios" onLink={() => pmGo("/studios")}>
                {studios.map(s => <PmStudioCard key={s.id} studio={s}/>)}
              </PmRailSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PmHome });
