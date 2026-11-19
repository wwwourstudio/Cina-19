// watch-premiere.jsx — Red Carpet World Premiere sub-page (/premiere/:filmId).
// Features a full-bleed editorial Premiere Hero, live countdown & doors transition,
// synced screening stage, and real-time /ws/screening red-carpet lounge chat.

const { useState: usPr, useEffect: uePr, useRef: urPr, useMemo: umPr } = React;

const PR_REACTIONS = [
  { key: "applause", label: "Applause", icon: "spark" },
  { key: "cinema", label: "Cinema", icon: "film" },
  { key: "fire", label: "Heat", icon: "trend" },
  { key: "shock", label: "Shock", icon: "alert" },
];

function prFormatTc(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function PremierePage({ filmId }) {
  const catalog = Array.isArray(window.CATALOG) ? window.CATALOG : [];
  const film = catalog.find(f => f.id === filmId) || catalog[0] || {
    id: "ll",
    title: "Last Light",
    year: 2026,
    runtime: "1h 48m",
    genre: ["Sci-Fi", "Drama"],
    rating: 4.8,
    creator: "Lena Voss",
    creatorId: "voss",
    thumb: "sci-neon",
    color: "#382a1e",
    logline: "Two night-shift engineers face a silent descent window.",
    synopsis: "After an orbital station loses contact with Earth, its two-person night shift must decide whether to burn their remaining fuel on a blind descent.",
  };

  const creatorName = (film.creator || "").split("·")[0].trim() || "Cina Director";
  const roomSlug = `premiere-${film.id}`;

  const [phase, setPhase] = usPr("countdown"); // "countdown" | "doors" | "live"
  const [countdownSec, setCountdownSec] = usPr(5420); // 1h 30m 20s until next doors opening
  const [seatNumber, setSeatNumber] = usPr(() => {
    const raw = (film.id || "ll").split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return `ORCH · ROW C · ${String((raw % 18) + 4).padStart(2, "0")}`;
  });
  const [playing, setPlaying] = usPr(false);
  const [t, setT] = usPr(0);
  const [muted, setMuted] = usPr(false);
  const [wsStatus, setWsStatus] = usPr("connecting");
  const [participants, setParticipants] = usPr([]);
  const [messages, setMessages] = usPr([]);
  const [reactionCounts, setReactionCounts] = usPr({ applause: 0, cinema: 0, fire: 0, shock: 0, heartbreak: 0 });
  const [draft, setDraft] = usPr("");

  const identity = umPr(() => {
    if (typeof window.getScreeningIdentity === "function") return window.getScreeningIdentity();
    return {
      userId: "pr_" + Math.random().toString(36).slice(2, 8),
      handle: (window.SESSION && window.SESSION.name) || "Premiere Guest",
      color: "var(--c-amber)",
    };
  }, []);

  const wsRef = urPr(null);
  const pendingRef = urPr([]);
  const seenIdsRef = urPr(new Set());
  const chatScrollRef = urPr(null);

  const appendUnique = (msg) => {
    if (!msg || !msg.id) return;
    setMessages(prev => {
      if (seenIdsRef.current.has(msg.id) && prev.some(m => m.id === msg.id)) return prev;
      seenIdsRef.current.add(msg.id);
      return [...prev.slice(-199), msg];
    });
  };

  // Real 1-second countdown clock when in countdown lobby
  uePr(() => {
    if (phase !== "countdown") return;
    const iv = setInterval(() => {
      setCountdownSec(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // Playback ticker when in live screening phase
  uePr(() => {
    if (phase !== "live" || !playing) return;
    const iv = setInterval(() => {
      setT(prev => (prev >= 120 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, playing]);

  // Auto scroll chat
  uePr(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages.length]);

  // Connect /ws/screening for Red Carpet Premiere Lounge
  uePr(() => {
    let disposed = false;
    let reconnectTimer = null;
    let attempt = 0;
    seenIdsRef.current = new Set();
    setMessages([]);
    setParticipants([]);
    setWsStatus("connecting");

    const connect = () => {
      if (disposed) return;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const qs = new URLSearchParams({
        roomId: roomSlug,
        userId: identity.userId,
        handle: identity.handle,
        color: identity.color,
      });
      const ws = new WebSocket(`${proto}//${window.location.host}/ws/screening?${qs.toString()}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) { ws.close(); return; }
        attempt = 0;
        setWsStatus("connected");
        while (pendingRef.current.length > 0) {
          const item = pendingRef.current.shift();
          if (item && ws.readyState === WebSocket.OPEN) ws.send(item);
        }
      };

      ws.onmessage = (e) => {
        if (disposed) return;
        let data = null;
        try { data = JSON.parse(e.data); } catch (_) { return; }
        if (!data || !data.type) return;
        if (data.type === "room:sync") {
          const synced = Array.isArray(data.messages) ? data.messages : [];
          seenIdsRef.current = new Set(synced.map(m => m.id));
          setMessages(synced);
          if (Array.isArray(data.participants)) setParticipants(data.participants);
          if (data.reactionCounts) setReactionCounts(prev => ({ ...prev, ...data.reactionCounts }));
        } else if (data.type === "presence:update") {
          if (Array.isArray(data.participants)) setParticipants(data.participants);
        } else if (data.type === "chat:message" && data.message) {
          appendUnique(data.message);
        } else if (data.type === "reaction:event" && data.event) {
          if (data.reactionCounts) setReactionCounts(prev => ({ ...prev, ...data.reactionCounts }));
          appendUnique(data.event);
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        if (disposed) return;
        setWsStatus("reconnecting");
        const delay = Math.min(8000, 600 * Math.pow(1.6, attempt));
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (_) {}
        wsRef.current = null;
      }
    };
  }, [roomSlug]);

  const sendSocket = (payload) => {
    const encoded = JSON.stringify(payload);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(encoded);
    } else {
      pendingRef.current.push(encoded);
    }
  };

  const sendReaction = (reactionKey) => {
    const id = `pr_rx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    sendSocket({
      type: "reaction:send",
      roomId: roomSlug,
      id,
      reaction: reactionKey,
      timecode: phase === "live" ? prFormatTc(t) : "LOBBY",
    });
  };

  const sendChat = (e) => {
    if (e) e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    const id = `pr_msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const localMsg = {
      id,
      roomId: roomSlug,
      userId: identity.userId,
      handle: identity.handle,
      color: identity.color,
      kind: "chat",
      text: clean,
      timecode: phase === "live" ? prFormatTc(t) : "CARPET",
      createdAt: Date.now(),
    };
    appendUnique(localMsg);
    sendSocket({
      type: "chat:send",
      roomId: roomSlug,
      id,
      text: clean,
      timecode: localMsg.timecode,
    });
    setDraft("");
  };

  const enterDoors = () => {
    setPhase("doors");
    window.toast?.({ title: "DOORS OPEN", text: `Seat assigned: ${seatNumber}`, kind: "good" });
  };

  const startLivePremiere = () => {
    setPhase("live");
    setPlaying(true);
  };

  const copyPremiereInvite = () => {
    const url = `${window.location.origin}${window.location.pathname}#/premiere/${film.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        window.toast?.({ title: "PREMIERE LINK COPIED", text: url, kind: "good" });
      }).catch(() => window.toast?.({ title: "PREMIERE LINK", text: url }));
    } else {
      window.toast?.({ title: "PREMIERE LINK", text: url });
    }
  };

  const hrs = Math.floor(countdownSec / 3600);
  const mins = Math.floor((countdownSec % 3600) / 60);
  const secs = countdownSec % 60;
  const otherPremieres = umPr(() => catalog.filter(c => c.id !== film.id).slice(0, 6), [film.id, catalog.length]);
  const nft = (window.NFT_PROJECTS || {})[film.nft];

  return (
    <div className="pm pr-page" data-screen-label={`Premiere · ${film.title}`} style={{ background: "var(--c-bg)", color: "var(--c-ink)", minHeight: "calc(100vh - 3.75rem)" }}>
      <style>{`
        .pr-topbar{width:100%;border-bottom:1px solid var(--c-line);background:rgba(12,12,15,.94);padding:0.75rem 4.5%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .pr-workspace{width:100%;padding:2.25rem 4.5% 3rem;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,58%) minmax(0,38%);justify-content:space-between;gap:4%;align-items:start}
        .pr-clock-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.65rem;width:100%}
        .pr-clock-cell{padding:0.75rem 0.5rem;background:rgba(12,12,16,.84);border:1px solid var(--c-line-2);border-radius:2px;text-align:center}
        @media (max-width:60em){
          .pr-workspace{grid-template-columns:100%;gap:1.75rem}
        }
      `}</style>

      {/* Architectural Sub-Page Top Bar */}
      <div className="pr-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" className="pm-btn pm-btn--sm" onClick={() => window.navigate?.("/rooms")}>
            <Icon name="chev-l" size={13}/>Watch Parties
          </button>
          <button type="button" className="pm-btn pm-btn--sm" onClick={() => window.navigate?.(`/film/${film.id}`)}>
            Film Dossier
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" className="pm-btn pm-btn--sm" onClick={copyPremiereInvite}>
            <Icon name="share" size={13}/>Invite Guest
          </button>
          {window.PmRemindBtn && (
            <window.PmRemindBtn
              sm
              k={`premiere-${film.id}`}
              info={{ label: `${film.title} World Premiere`, date: "2026-06-14" }}
            />
          )}
          <button type="button" className="pm-btn pm-btn--primary pm-btn--sm" onClick={() => window.navigate?.(`/party/${film.id}`)}>
            <Icon name="users" size={13}/>Synced Watch Party →
          </button>
        </div>
      </div>

      {/* Full-Bleed Premiere Page Hero (shared PmHero grammar) */}
      <section className="pm-hero pm-hero--short" data-cina-hero style={{ background: film.color || "#0a0a0c" }}>
        <div className="pm-hero__img is-on"><FrameThumb kind={film.thumb} usePhoto/></div>
        <div className="pm-hero__scrim"/>
        <div className="pm-hero__body">
          <div className="pm-wrap">
            <div className="pm-hero__grid">
              <div className="pm-hero__main">
                <span className="pm-k" style={{ color: "var(--c-ink-2)" }}>
                  <b>World Premiere Screening</b> · {creatorName}
                </span>
                <h1 className="pm-xl">{film.title}</h1>
                <div className="pm-hero__meta">
                  <span>{film.year}</span>
                  {(film.genre || [])[0] && <span>{film.genre[0]}</span>}
                  <span>{film.runtime}</span>
                  {film.rating && <span>★ {film.rating}</span>}
                  <span>{participants.length} in Red Carpet Lounge</span>
                </div>
                <p className="pm-lede">{film.logline || film.synopsis}</p>
                <div className="pm-actions">
                  {phase === "countdown" && (
                    <button type="button" className="pm-btn pm-btn--primary" onClick={enterDoors}>
                      <Icon name="ticket" size={14}/>Enter Doors Lounge
                    </button>
                  )}
                  {phase === "doors" && (
                    <button type="button" className="pm-btn pm-btn--primary" onClick={startLivePremiere}>
                      <Icon name="play" size={14}/>Take Your Seat · Start Curtain
                    </button>
                  )}
                  {phase === "live" && (
                    <button type="button" className="pm-btn pm-btn--primary" onClick={() => setPlaying(p => !p)}>
                      <Icon name={playing ? "pause" : "play"} size={14}/>{playing ? "Pause Presentation" : "Resume Presentation"}
                    </button>
                  )}
                  <button type="button" className="pm-btn pm-btn--glass" onClick={() => window.navigate?.(`/party/${film.id}`)}>
                    <Icon name="users" size={14}/>Open Co-Watch Room
                  </button>
                  {film.nft && nft && (
                    <button type="button" className="pm-btn pm-btn--glass" onClick={() => window.navigate?.(`/nft/${film.nft}`)}>
                      Producer Pass →
                    </button>
                  )}
                </div>
              </div>

              {/* Integrated Hero Premiere Desk */}
              <div
                style={{
                  width: "100%",
                  background: "rgba(10,10,13,.84)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  border: "1px solid var(--c-line-2)",
                  borderRadius: "2px",
                  padding: "1.15rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span className="t-mono" style={{ fontSize: "0.64rem", letterSpacing: ".14em", color: "var(--c-amber)", textTransform: "uppercase" }}>
                    {phase === "countdown" ? "Curtain Countdown" : phase === "doors" ? "Theater Doors Open" : "Premiere Presentation"}
                  </span>
                  <span className="t-mono" style={{ fontSize: "0.64rem", letterSpacing: ".12em", color: wsStatus === "connected" ? "var(--c-good)" : "var(--c-ink-3)" }}>
                    {wsStatus === "connected" ? "WS LIVE" : wsStatus.toUpperCase()}
                  </span>
                </div>

                {phase === "countdown" ? (
                  <div className="pr-clock-grid">
                    {[
                      { v: hrs, l: "HRS" },
                      { v: mins, l: "MIN" },
                      { v: secs, l: "SEC" },
                    ].map(c => (
                      <div key={c.l} className="pr-clock-cell">
                        <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "clamp(1.5rem, 2.2vw, 2.15rem)", lineHeight: 1, color: "var(--c-ink)", fontVariantNumeric: "tabular-nums" }}>
                          {String(c.v).padStart(2, "0")}
                        </div>
                        <div className="t-mono" style={{ fontSize: "0.6rem", letterSpacing: ".16em", color: "var(--c-ink-3)", marginTop: "0.25rem" }}>
                          {c.l}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "0.75rem", background: "var(--c-panel)", border: "1px solid var(--c-line)", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <span className="t-mono" style={{ fontSize: "0.62rem", letterSpacing: ".14em", color: "var(--c-ink-3)" }}>ASSIGNED AUDITORIUM PASS</span>
                    <span className="t-mono" style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--c-amber)", letterSpacing: ".1em" }}>{seatNumber}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {[
                    { id: "countdown", l: "Lobby" },
                    { id: "doors", l: "Doors" },
                    { id: "live", l: "Theater" },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPhase(p.id);
                        if (p.id === "live") setPlaying(true);
                      }}
                      style={{
                        flex: 1,
                        padding: "0.45rem 0.5rem",
                        background: phase === p.id ? "var(--c-amber)" : "transparent",
                        border: "1px solid " + (phase === p.id ? "var(--c-amber)" : "var(--c-line-2)"),
                        borderRadius: "2px",
                        color: phase === p.id ? "var(--c-on-amber)" : "var(--c-ink-2)",
                        fontFamily: "var(--f-mono)",
                        fontSize: "0.64rem",
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Responsive Two-Column Workspace */}
      <section className="pr-workspace" aria-label="Premiere auditorium and carpet lounge">
        {/* Left Column: Auditorium Screen / Program Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
          {phase === "live" && (
            <div style={{ background: "var(--c-black)", border: "1px solid var(--c-line)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden" }}>
                <FrameThumb kind={film.thumb} usePhoto/>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,8,10,.9) 0%, transparent 45%)" }}/>
                <div style={{ position: "absolute", left: "1rem", right: "1rem", bottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <span className="t-mono" style={{ fontSize: "0.64rem", letterSpacing: ".14em", color: "var(--c-amber)", textTransform: "uppercase" }}>
                      {seatNumber} · Premiere Curtain
                    </span>
                    <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "1.45rem", color: "var(--c-ink)" }}>
                      {film.title}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.45rem" }}>
                    <button type="button" className="pm-btn pm-btn--sm" onClick={() => setMuted(m => !m)}>
                      <Icon name={muted ? "vol-x" : "vol"} size={13}/>
                    </button>
                    <button type="button" className="pm-btn pm-btn--primary pm-btn--sm" onClick={() => setPlaying(p => !p)}>
                      <Icon name={playing ? "pause" : "play"} size={12}/>{playing ? "Pause" : "Play"}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: "0.65rem 1rem", background: "var(--c-panel)", borderTop: "1px solid var(--c-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                <span className="t-mono" style={{ fontSize: "0.68rem", color: "var(--c-ink-3)", fontVariantNumeric: "tabular-nums" }}>
                  {prFormatTc(t)} / 02:00 · Act I Opening Presentation
                </span>
                <button type="button" className="pm-link" onClick={() => window.navigate?.(`/party/${film.id}`)}>
                  Switch to Synced Watch Party →
                </button>
              </div>
            </div>
          )}

          <div className="pm-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", paddingBottom: "0.65rem", borderBottom: "1px solid var(--c-line)" }}>
              <h2 className="pm-h2">Evening Order of Screening</h2>
              <span className="pm-sec__note">Cina Exhibition House</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { time: "19:30", title: "Red Carpet & Guest Arrivals", note: "Pass holders, press, and guests enter the auditorium lounge.", active: phase === "countdown" },
                { time: "19:50", title: "Doors Open & Seat Lock", note: `Your ticket maps to ${seatNumber}. Soundcheck runs on 4K master stem.`, active: phase === "doors" },
                { time: "20:00", title: `Feature Presentation: ${film.title}`, note: "Synchronized world premiere followed immediately by Director Salon Q&A.", active: phase === "live" },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "4.5rem minmax(0, 1fr)",
                    gap: "0.9rem",
                    padding: "0.75rem 0.9rem",
                    background: step.active ? "rgba(var(--accent-rgb), .08)" : "var(--c-panel-2)",
                    border: "1px solid " + (step.active ? "var(--c-amber)" : "var(--c-line)"),
                    borderRadius: "2px",
                  }}
                >
                  <span className="t-mono" style={{ fontSize: "0.74rem", fontWeight: 700, color: step.active ? "var(--c-amber)" : "var(--c-ink-3)", fontVariantNumeric: "tabular-nums" }}>
                    {step.time}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--c-ink)" }}>{step.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--c-ink-3)", marginTop: "0.2rem", lineHeight: 1.45 }}>{step.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {window.PartyLeanBanner && <window.PartyLeanBanner film={film}/>}
        </div>

        {/* Right Column: Live WebSocket Red Carpet Chat & Applause */}
        <aside className="pm-panel" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", minHeight: "28rem", maxHeight: "38rem" }} aria-label="Red carpet premiere chat">
          <div style={{ padding: "0.85rem 1.05rem", borderBottom: "1px solid var(--c-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <div>
              <span className="pm-k" style={{ color: "var(--c-amber)" }}>Red Carpet Salon</span>
              <div style={{ fontSize: "0.84rem", fontWeight: 600, marginTop: "0.1rem" }}>Live Audience Dispatch</div>
            </div>
            <span className="t-mono" style={{ fontSize: "0.66rem", color: "var(--c-ink-3)", fontVariantNumeric: "tabular-nums" }}>
              {participants.length} SEATED
            </span>
          </div>

          <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: "0.9rem 1.05rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {messages.length === 0 ? (
              <div style={{ padding: "2rem 0.5rem", textAlign: "center", color: "var(--c-ink-3)" }}>
                <div className="t-mono" style={{ fontSize: "0.68rem", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Carpet Lounge Open
                </div>
                <div style={{ fontSize: "0.84rem", lineHeight: 1.5 }}>
                  Send a premiere note or applause before the curtain rises. Messages sync live across all premiere attendees.
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div
                  key={m.id}
                  style={{
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid rgba(255,255,255,.05)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.18rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: m.color || "var(--c-amber)" }}>{m.handle}</span>
                    <span className="t-mono" style={{ fontSize: "0.6rem", color: "var(--c-ink-4)" }}>{m.timecode || "LIVE"}</span>
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--c-ink)", lineHeight: 1.42 }}>
                    {m.kind === "reaction" ? `Sent ${m.reaction || "applause"} (${m.text})` : m.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: "0.65rem 1.05rem", borderTop: "1px solid var(--c-line)", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {PR_REACTIONS.map(r => (
              <button
                key={r.key}
                type="button"
                className="pm-btn pm-btn--sm"
                onClick={() => sendReaction(r.key)}
                style={{ height: "1.85rem", padding: "0 0.6rem", fontSize: "0.72rem" }}
              >
                <Icon name={r.icon} size={11}/>
                <span>{r.label}</span>
                {(reactionCounts[r.key] || 0) > 0 && (
                  <span className="t-mono" style={{ color: "var(--c-amber)", fontSize: "0.64rem" }}>{reactionCounts[r.key]}</span>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={sendChat} style={{ padding: "0.75rem 1.05rem", borderTop: "1px solid var(--c-line)", display: "flex", gap: "0.5rem", background: "var(--c-panel-2)" }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Write to the premiere audience…"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "0.55rem 0.75rem",
                background: "var(--c-panel)",
                border: "1px solid var(--c-line-2)",
                borderRadius: "2px",
                color: "var(--c-ink)",
                fontSize: "0.84rem",
              }}
            />
            <button type="submit" className="pm-btn pm-btn--primary pm-btn--sm" style={{ height: "auto" }}>
              Send
            </button>
          </form>
        </aside>
      </section>

      {/* Other Scheduled Premieres & Screening Rooms */}
      {otherPremieres.length > 0 && (
        <section className="pm-sec pm-wrap" style={{ paddingBottom: "3rem" }}>
          <div className="pm-sec__head">
            <div className="pm-sec__titles">
              <h2 className="pm-h2">Upcoming World Premieres</h2>
              <span className="pm-sec__note">Step into another premiere carpet or synced room</span>
            </div>
            <button type="button" className="pm-link" onClick={() => window.navigate?.("/rooms")}>
              All Watch Parties <Icon name="chev-r" size={13}/>
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 20rem), 1fr))", gap: "1.5%" }}>
            {otherPremieres.map(c => (
              <div
                key={c.id}
                style={{
                  background: "var(--c-panel)",
                  border: "1px solid var(--c-line)",
                  borderRadius: "2px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: c.color || "var(--c-panel-2)" }}>
                  <FrameThumb kind={c.thumb} usePhoto/>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,8,10,.88) 0%, rgba(8,8,10,.15) 60%)" }}/>
                  <span className="pm-badge pm-badge--red" style={{ top: "0.55rem", left: "0.55rem" }}>Premiere</span>
                </div>
                <div style={{ padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: "0.55rem", flex: 1 }}>
                  <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "1.25rem", color: "var(--c-ink)" }}>{c.title}</div>
                  <div className="t-mono" style={{ fontSize: "0.68rem", color: "var(--c-ink-3)", letterSpacing: ".1em" }}>
                    {(c.creator || "").split("·")[0].trim()} · {c.runtime}
                  </div>
                  <div style={{ display: "flex", gap: "0.45rem", marginTop: "auto", paddingTop: "0.35rem" }}>
                    <button type="button" className="pm-btn pm-btn--primary pm-btn--sm" style={{ flex: 1 }} onClick={() => window.navigate?.(`/premiere/${c.id}`)}>
                      Premiere Lounge
                    </button>
                    <button type="button" className="pm-btn pm-btn--sm" onClick={() => window.navigate?.(`/party/${c.id}`)}>
                      Party
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

Object.assign(window, { PremierePage });
