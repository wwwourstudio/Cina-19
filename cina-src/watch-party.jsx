// watch-party.jsx — Co-watch screening theater sub-page (/party/:filmId).
// Real-time synced playback, WS presence & chat via /ws/screening, plus an
// editorial film dossier & quick room switcher below the stage.

const { useState: usWp, useEffect: ueWp, useRef: urWp, useMemo: umWp } = React;

const WP_REACTIONS = [
  { key: "applause", label: "Bravo", icon: "spark" },
  { key: "cinema", label: "Cinema", icon: "film" },
  { key: "fire", label: "Heat", icon: "trend" },
  { key: "shock", label: "Shock", icon: "alert" },
  { key: "heartbreak", label: "Cut", icon: "heart" },
];

function wpFormatTc(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function WatchPartyPage({ filmId }) {
  const catalog = Array.isArray(window.CATALOG) ? window.CATALOG : [];
  const route = typeof useRoute === "function" ? useRoute() : { params: {} };
  const routeParams = route.params || {};

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
    logline: "After an orbital station loses contact with Earth, its two-person night shift must decide whether to burn their remaining fuel on a blind descent.",
    synopsis: "An intimate sci-fi chamber drama set during the final forty-eight hours aboard an aging relay platform.",
  };

  const creatorName = (film.creator || "").split("·")[0].trim() || "Cina Director";
  const partyName = (routeParams.name && String(routeParams.name).trim()) || `${film.title} Live Screening`;
  const roomVis = (routeParams.vis || "public").toLowerCase();
  const roomSlug = (routeParams.room && String(routeParams.room).trim()) || `party-${film.id}`;
  const partyDurSec = 108;

  const initialIdentity = umWp(() => {
    if (typeof window.getScreeningIdentity === "function") return window.getScreeningIdentity();
    return {
      userId: "wp_" + Math.random().toString(36).slice(2, 8),
      handle: (window.SESSION && window.SESSION.name) || "Guest Viewer",
      color: "var(--c-amber)",
    };
  }, []);

  const [identity, setIdentity] = usWp(initialIdentity);
  const [editingHandle, setEditingHandle] = usWp(false);
  const [handleDraft, setHandleDraft] = usWp(initialIdentity.handle || "Viewer");

  // Playback & Sync state
  const [playing, setPlaying] = usWp(true);
  const [t, setT] = usWp(18);
  const [muted, setMuted] = usWp(false);
  const [volume, setVolume] = usWp(0.85);
  const [syncWatch, setSyncWatch] = usWp(true);
  const [syncLeader, setSyncLeader] = usWp("");
  const [dub, setDub] = usWp("Orig");
  const [theaterMode, setTheaterMode] = usWp(false);

  // Realtime WS room state
  const [wsStatus, setWsStatus] = usWp("connecting");
  const [participants, setParticipants] = usWp([]);
  const [messages, setMessages] = usWp([]);
  const [reactionCounts, setReactionCounts] = usWp({ applause: 0, cinema: 0, fire: 0, shock: 0, heartbreak: 0 });
  const [bursts, setBursts] = usWp([]);
  const [sideTab, setSideTab] = usWp("chat"); // 'chat' | 'audience'
  const [draft, setDraft] = usWp("");

  const wsRef = urWp(null);
  const pendingRef = urWp([]);
  const seenIdsRef = urWp(new Set());
  const chatScrollRef = urWp(null);
  const syncWatchRef = urWp(syncWatch);
  const isApplyingRemoteRef = urWp(false);
  const lastRemoteSeqRef = urWp(0);
  const latestRemotePlaybackRef = urWp(null);
  const livePlaybackRef = urWp({ playing, t, muted, volume });

  syncWatchRef.current = syncWatch;
  livePlaybackRef.current = { playing, t, muted, volume };

  const appendUniqueMsg = (msg) => {
    if (!msg || !msg.id) return;
    setMessages(prev => {
      if (seenIdsRef.current.has(msg.id) && prev.some(m => m.id === msg.id)) return prev;
      seenIdsRef.current.add(msg.id);
      return [...prev.slice(-199), msg];
    });
  };

  const spawnBurst = (reactionKey, handle, id) => {
    const offsetX = Math.floor(Math.random() * 52) - 26;
    setBursts(prev => [...prev.slice(-8), { id, reaction: reactionKey, handle, offsetX }]);
    setTimeout(() => {
      setBursts(prev => prev.filter(b => b.id !== id));
    }, 2200);
  };

  const applyRemotePlayback = (pb) => {
    if (!pb || typeof pb !== "object") return;
    latestRemotePlaybackRef.current = pb;
    const seq = Number(pb.seq) || 0;
    if (seq > 0 && seq <= lastRemoteSeqRef.current) return;
    if (seq > 0) lastRemoteSeqRef.current = seq;
    if (pb.updatedByHandle) setSyncLeader(pb.updatedByHandle);
    if (!syncWatchRef.current) return;

    isApplyingRemoteRef.current = true;
    try {
      if (typeof pb.playing === "boolean") setPlaying(pb.playing);
      if (typeof pb.progress === "number" && Number.isFinite(pb.progress)) {
        const clamped = Math.max(0, Math.min(100, pb.progress));
        setT(Math.round((clamped / 100) * partyDurSec));
      }
      if (typeof pb.muted === "boolean") setMuted(pb.muted);
      if (typeof pb.volume === "number" && Number.isFinite(pb.volume)) {
        setVolume(Math.max(0, Math.min(1, pb.volume)));
      }
    } finally {
      setTimeout(() => { isApplyingRemoteRef.current = false; }, 120);
    }
  };

  // Connect to /ws/screening
  ueWp(() => {
    let disposed = false;
    let reconnectTimer = null;
    let attempt = 0;

    seenIdsRef.current = new Set();
    lastRemoteSeqRef.current = 0;
    setMessages([]);
    setParticipants([]);
    setReactionCounts({ applause: 0, cinema: 0, fire: 0, shock: 0, heartbreak: 0 });
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
          if (data.playbackState) applyRemotePlayback(data.playbackState);
        } else if (data.type === "playback:state" && data.playbackState) {
          applyRemotePlayback(data.playbackState);
        } else if (data.type === "presence:update") {
          if (Array.isArray(data.participants)) setParticipants(data.participants);
        } else if (data.type === "chat:message" && data.message) {
          appendUniqueMsg(data.message);
        } else if (data.type === "reaction:event" && data.event) {
          if (data.reactionCounts) setReactionCounts(prev => ({ ...prev, ...data.reactionCounts }));
          if (data.event.reaction) spawnBurst(data.event.reaction, data.event.handle, data.event.id);
          appendUniqueMsg(data.event);
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

  ueWp(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setT(v => (v >= partyDurSec ? 0 : v + 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [playing]);

  ueWp(() => {
    if (chatScrollRef.current && sideTab === "chat") {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length, sideTab]);

  const sendSocket = (payload) => {
    const encoded = JSON.stringify(payload);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(encoded);
    } else {
      pendingRef.current.push(encoded);
    }
  };

  const emitPlaybackSync = (overrides = {}) => {
    if (!syncWatchRef.current || isApplyingRemoteRef.current) return;
    const cur = livePlaybackRef.current;
    const nextPlaying = typeof overrides.playing === "boolean" ? overrides.playing : cur.playing;
    const nextT = typeof overrides.t === "number" ? overrides.t : cur.t;
    const nextMuted = typeof overrides.muted === "boolean" ? overrides.muted : cur.muted;
    const nextVol = typeof overrides.volume === "number" ? overrides.volume : cur.volume;
    const pct = Math.max(0, Math.min(100, Number(((nextT / partyDurSec) * 100).toFixed(2))));
    sendSocket({
      type: "playback:sync",
      roomId: roomSlug,
      playing: nextPlaying,
      progress: pct,
      muted: nextMuted,
      volume: Number(nextVol.toFixed(2)),
    });
  };

  const handleTogglePlay = () => {
    const next = !livePlaybackRef.current.playing;
    setPlaying(next);
    emitPlaybackSync({ playing: next });
  };

  const handleSeek = (nextSec) => {
    const clamped = Math.max(0, Math.min(partyDurSec, Math.round(nextSec)));
    setT(clamped);
    emitPlaybackSync({ t: clamped });
  };

  const handleToggleMute = () => {
    const next = !livePlaybackRef.current.muted;
    setMuted(next);
    emitPlaybackSync({ muted: next });
  };

  const handleVolumeChange = (nextVol) => {
    const clamped = Math.max(0, Math.min(1, Number(nextVol)));
    const nextMuted = clamped === 0;
    setVolume(clamped);
    setMuted(nextMuted);
    emitPlaybackSync({ volume: clamped, muted: nextMuted });
  };

  const handleToggleSyncWatch = () => {
    const nextOn = !syncWatch;
    setSyncWatch(nextOn);
    if (nextOn && latestRemotePlaybackRef.current) {
      lastRemoteSeqRef.current = 0;
      applyRemotePlayback(latestRemotePlaybackRef.current);
    }
  };

  const sendReaction = (reactionKey) => {
    const id = `rx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const timecode = wpFormatTc(t);
    spawnBurst(reactionKey, identity.handle, id);
    sendSocket({
      type: "reaction:send",
      roomId: roomSlug,
      id,
      reaction: reactionKey,
      timecode,
    });
  };

  const sendChat = (e) => {
    if (e) e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    const id = `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const timecode = wpFormatTc(t);
    const localMsg = {
      id,
      roomId: roomSlug,
      userId: identity.userId,
      handle: identity.handle,
      color: identity.color,
      kind: "chat",
      text: clean,
      timecode,
      createdAt: Date.now(),
    };
    appendUniqueMsg(localMsg);
    sendSocket({
      type: "chat:send",
      roomId: roomSlug,
      id,
      text: clean,
      timecode,
    });
    setDraft("");
  };

  const saveHandle = (e) => {
    if (e) e.preventDefault();
    const clean = (handleDraft || "").replace(/[\r\n\t<>]/g, "").trim().slice(0, 28) || "Viewer";
    let updated = { ...identity, handle: clean };
    if (typeof window.updateScreeningHandle === "function") {
      updated = window.updateScreeningHandle(clean);
    }
    setIdentity(updated);
    setHandleDraft(updated.handle);
    setEditingHandle(false);
    sendSocket({ type: "profile:update", handle: updated.handle, color: updated.color });
  };

  const copyInvite = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#${window.buildPartyRoute ? window.buildPartyRoute(film.id, { roomSlug, name: partyName, vis: roomVis }) : `/party/${film.id}`}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        window.toast?.({ title: "INVITE LINK COPIED", text: shareUrl, kind: "good" });
      }).catch(() => {
        window.toast?.({ title: "PARTY LINK", text: shareUrl });
      });
    } else {
      window.toast?.({ title: "PARTY LINK", text: shareUrl });
    }
  };

  const switchFilmParty = (nextId) => {
    const nextFilm = catalog.find(c => c.id === nextId);
    if (!nextFilm) return;
    window.navigate?.(`/party/${nextFilm.id}`);
  };

  const castList = umWp(() => {
    const map = window.ACTORS_BY_FILM || window.FILM_CAST || {};
    const ids = map[film.id] || [];
    const actors = window.ACTORS || [];
    return ids.map(id => actors.find(a => a.id === id)).filter(Boolean);
  }, [film.id]);

  const otherParties = umWp(() => catalog.filter(c => c.id !== film.id).slice(0, 6), [film.id, catalog.length]);

  const pct = Math.max(0, Math.min(100, (t / partyDurSec) * 100));
  const visLabel = roomVis === "holders" ? "Pass Holders" : roomVis === "friends" ? "Invite Only" : "Public Screening";
  const directorNote = (window.PROGRAMMER_NOTES || {})[film.id];

  return (
    <div className="pm wp-page" data-screen-label={`Watch Party · ${film.title}`} style={{ background: "var(--c-bg)", color: "var(--c-ink)", minHeight: "calc(100vh - 3.75rem)" }}>
      <style>{`
        .wp-subbar{width:100%;border-bottom:1px solid var(--c-line);background:rgba(12,12,15,.94);padding:0.75rem 4.5%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .wp-stage-wrap{width:100%;padding:1.5rem 4.5% 2rem;box-sizing:border-box;border-bottom:1px solid var(--c-line);background:radial-gradient(ellipse at top center, rgba(255,255,255,.025), transparent 65%)}
        .wp-stage-grid{display:grid;grid-template-columns:minmax(0,66%) minmax(0,32%);justify-content:space-between;gap:2%;align-items:stretch;width:100%}
        .wp-stage-grid.is-theater{grid-template-columns:100%}
        .wp-theater{display:flex;flex-direction:column;background:var(--c-black);border:1px solid var(--c-line);border-radius:2px;overflow:hidden}
        .wp-screen{position:relative;width:100%;aspect-ratio:16/9;background:#08080a;overflow:hidden}
        .wp-screen__media{position:absolute;inset:0;width:100%;height:100%;transition:transform 1.2s ease}
        .wp-screen__media.is-playing{transform:scale(1.03)}
        .wp-screen__scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,10,.52) 0%,transparent 28%,transparent 65%,rgba(8,8,10,.88) 100%);pointer-events:none}
        .wp-controls{padding:0.8rem 1rem;background:var(--c-panel);border-top:1px solid var(--c-line);display:flex;flex-direction:column;gap:0.65rem}
        .wp-chat{display:flex;flex-direction:column;background:var(--c-panel);border:1px solid var(--c-line);border-radius:2px;min-height:28rem;max-height:40rem;overflow:hidden}
        .wp-dossier-band{padding:2.5rem 4.5% 3rem;box-sizing:border-box;width:100%}
        @keyframes wpBurstUp{0%{opacity:0;transform:translateY(12px) scale(.9)}18%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-64px) scale(1.04)}}
        @media (max-width:64em){
          .wp-stage-grid{grid-template-columns:100%;gap:1.25rem}
          .wp-chat{max-height:30rem}
        }
      `}</style>

      {/* Architectural Sub-Page Header Bar */}
      <div className="wp-subbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap", minWidth: 0 }}>
          <button
            type="button"
            className="pm-btn pm-btn--sm"
            onClick={() => window.navigate?.("/rooms")}
          >
            <Icon name="chev-l" size={13}/>Watch Parties
          </button>
          <div style={{ minWidth: 0 }}>
            <div className="t-mono" style={{ fontSize: "0.64rem", letterSpacing: ".15em", color: "var(--c-ink-3)", textTransform: "uppercase" }}>
              {visLabel} · Room {roomSlug.slice(0, 18)}
            </div>
            <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "clamp(1.1rem, 1.5vw, 1.4rem)", color: "var(--c-ink)", lineHeight: 1.15 }}>
              {partyName}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
          <select
            aria-label="Switch screening film"
            value={film.id}
            onChange={e => switchFilmParty(e.target.value)}
            style={{
              height: "2.1rem",
              padding: "0 0.7rem",
              background: "var(--c-panel)",
              border: "1px solid var(--c-line-2)",
              borderRadius: "2px",
              color: "var(--c-ink)",
              fontFamily: "var(--f-sans)",
              fontSize: "0.8rem",
            }}
          >
            {catalog.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button
            type="button"
            className="pm-btn pm-btn--sm"
            onClick={copyInvite}
          >
            <Icon name="share" size={13}/>Copy Invite
          </button>
          {window.openCreateParty && (
            <button
              type="button"
              className="pm-btn pm-btn--primary pm-btn--sm"
              onClick={() => window.openCreateParty(film)}
            >
              <Icon name="plus" size={13}/>Host Party
            </button>
          )}
        </div>
      </div>

      {/* Synced Theater Stage & Real-Time Chat Salon */}
      <section className="wp-stage-wrap" aria-label="Watch party theater stage">
        <div className={"wp-stage-grid" + (theaterMode ? " is-theater" : "")}>
          {/* Theater Column */}
          <div className="wp-theater">
            <div className="wp-screen">
              <div className={"wp-screen__media" + (playing ? " is-playing" : "")}>
                <FrameThumb kind={film.thumb} usePhoto/>
              </div>
              <div className="wp-screen__scrim"/>

              {/* Top Overlay Telemetry */}
              <div style={{
                position: "absolute",
                top: "0.85rem",
                left: "1rem",
                right: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                zIndex: 3,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span className="t-mono" style={{
                    padding: "0.24rem 0.6rem",
                    background: "rgba(10,10,12,.82)",
                    border: "1px solid " + (wsStatus === "connected" ? "rgba(155,201,122,.5)" : "rgba(255,255,255,.2)"),
                    borderRadius: "2px",
                    fontSize: "0.64rem",
                    letterSpacing: ".14em",
                    color: wsStatus === "connected" ? "var(--c-good)" : "var(--c-ink-2)",
                    textTransform: "uppercase",
                  }}>
                    {wsStatus === "connected" ? "WS SYNCED" : wsStatus.toUpperCase()}
                  </span>
                  {syncWatch && syncLeader && (
                    <span className="t-mono" style={{
                      padding: "0.24rem 0.6rem",
                      background: "rgba(10,10,12,.78)",
                      border: "1px solid var(--c-line-2)",
                      borderRadius: "2px",
                      fontSize: "0.64rem",
                      letterSpacing: ".12em",
                      color: "var(--c-amber)",
                    }}>
                      SYNCED WITH {syncLeader.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="t-mono" style={{
                  padding: "0.24rem 0.6rem",
                  background: "rgba(10,10,12,.78)",
                  border: "1px solid var(--c-line)",
                  borderRadius: "2px",
                  fontSize: "0.64rem",
                  letterSpacing: ".13em",
                  color: "var(--c-ink-2)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {participants.length} {participants.length === 1 ? "VIEWER" : "VIEWERS"} IN ROOM
                </span>
              </div>

              {/* Floating Reaction Bursts */}
              <div aria-hidden="true" style={{ position: "absolute", right: "1.25rem", bottom: "3.5rem", width: "10rem", height: "8rem", pointerEvents: "none", zIndex: 4 }}>
                {bursts.map(b => {
                  const meta = WP_REACTIONS.find(r => r.key === b.reaction) || WP_REACTIONS[0];
                  return (
                    <div
                      key={b.id}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: `${16 + b.offsetX}px`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.3rem 0.6rem",
                        background: "rgba(10,10,12,.88)",
                        border: "1px solid rgba(var(--accent-rgb),.55)",
                        borderRadius: "2px",
                        color: "var(--c-amber)",
                        fontFamily: "var(--f-mono)",
                        fontSize: "0.64rem",
                        letterSpacing: ".1em",
                        animation: "wpBurstUp 2.1s cubic-bezier(.16,1,.3,1) forwards",
                      }}
                    >
                      <Icon name={meta.icon} size={11}/>
                      <span>{b.handle}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Title Caption inside Frame */}
              <div style={{ position: "absolute", left: "1rem", right: "1rem", bottom: "1rem", zIndex: 2, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ minWidth: 0 }}>
                  <span className="t-mono" style={{ fontSize: "0.65rem", letterSpacing: ".14em", color: "var(--c-amber)", textTransform: "uppercase" }}>
                    Now Screening · {film.year} · {film.runtime}
                  </span>
                  <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "clamp(1.35rem, 2.3vw, 2.2rem)", lineHeight: 1.05, color: "var(--c-ink)" }}>
                    {film.title}
                  </div>
                </div>
                {!playing && (
                  <button
                    type="button"
                    className="pm-btn pm-btn--primary pm-btn--sm"
                    onClick={handleTogglePlay}
                  >
                    <Icon name="play" size={12}/>Resume Screening
                  </button>
                )}
              </div>
            </div>

            {/* Playback & Sync Transport Bar */}
            <div className="wp-controls">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="t-mono" style={{ fontSize: "0.72rem", color: "var(--c-ink-2)", minWidth: "2.8rem", fontVariantNumeric: "tabular-nums" }}>
                  {wpFormatTc(t)}
                </span>
                <input
                  type="range"
                  aria-label="Seek screening timeline"
                  min={0}
                  max={partyDurSec}
                  value={t}
                  onChange={e => handleSeek(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--c-amber)", cursor: "pointer" }}
                />
                <span className="t-mono" style={{ fontSize: "0.72rem", color: "var(--c-ink-3)", minWidth: "2.8rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {wpFormatTc(partyDurSec)}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={"pm-btn pm-btn--sm" + (playing ? "" : " pm-btn--primary")}
                    onClick={handleTogglePlay}
                  >
                    <Icon name={playing ? "pause" : "play"} size={12}/>{playing ? "Pause" : "Play"}
                  </button>
                  <button
                    type="button"
                    className="pm-btn pm-btn--sm"
                    onClick={handleToggleMute}
                    aria-label={muted ? "Unmute audio" : "Mute audio"}
                  >
                    <Icon name={muted ? "vol-x" : "vol"} size={13}/>{muted ? "Muted" : "Audio"}
                  </button>
                  <input
                    type="range"
                    aria-label="Room volume"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={e => handleVolumeChange(e.target.value)}
                    style={{ width: "4.5rem", accentColor: "var(--c-amber)", cursor: "pointer" }}
                  />
                  <button
                    type="button"
                    className={"pm-btn pm-btn--sm" + (syncWatch ? " pm-btn--on" : "")}
                    onClick={handleToggleSyncWatch}
                    title="Keep play/pause & timeline synced across everyone in this room"
                  >
                    <Icon name="check" size={12}/>Sync Watch: {syncWatch ? "ON" : "OFF"}
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                  <div style={{ display: "inline-flex", border: "1px solid var(--c-line)", borderRadius: "2px", overflow: "hidden" }}>
                    {["Orig", "ES", "FR", "JP"].map(code => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setDub(code)}
                        style={{
                          padding: "0.3rem 0.5rem",
                          border: "none",
                          background: dub === code ? "var(--c-amber)" : "transparent",
                          color: dub === code ? "var(--c-on-amber)" : "var(--c-ink-3)",
                          fontFamily: "var(--f-mono)",
                          fontSize: "0.66rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="pm-btn pm-btn--sm"
                    onClick={() => setTheaterMode(v => !v)}
                  >
                    {theaterMode ? "Show Chat" : "Theater Wide"}
                  </button>
                </div>
              </div>

              {/* Reaction Strip */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.65rem", paddingTop: "0.55rem", borderTop: "1px solid var(--c-line)", flexWrap: "wrap" }}>
                <span className="t-mono" style={{ fontSize: "0.64rem", letterSpacing: ".13em", color: "var(--c-ink-3)", textTransform: "uppercase" }}>
                  Send Frame Reaction
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  {WP_REACTIONS.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      className="pm-btn pm-btn--sm"
                      onClick={() => sendReaction(r.key)}
                      style={{ height: "1.9rem", padding: "0 0.65rem", fontSize: "0.74rem" }}
                    >
                      <Icon name={r.icon} size={12}/>
                      <span>{r.label}</span>
                      {(reactionCounts[r.key] || 0) > 0 && (
                        <span className="t-mono" style={{ color: "var(--c-amber)", fontSize: "0.66rem", fontVariantNumeric: "tabular-nums" }}>
                          {reactionCounts[r.key]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Room Chat & Audience Roster Sidebar */}
          {!theaterMode && (
            <aside className="wp-chat" aria-label="Screening room conversation">
              <div style={{ padding: "0.8rem 1rem", borderBottom: "1px solid var(--c-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <button
                    type="button"
                    onClick={() => setSideTab("chat")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: "2px solid " + (sideTab === "chat" ? "var(--c-amber)" : "transparent"),
                      padding: "0.2rem 0",
                      color: sideTab === "chat" ? "var(--c-ink)" : "var(--c-ink-3)",
                      fontFamily: "var(--f-mono)",
                      fontSize: "0.68rem",
                      letterSpacing: ".13em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Room Chat ({messages.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSideTab("audience")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: "2px solid " + (sideTab === "audience" ? "var(--c-amber)" : "transparent"),
                      padding: "0.2rem 0",
                      color: sideTab === "audience" ? "var(--c-ink)" : "var(--c-ink-3)",
                      fontFamily: "var(--f-mono)",
                      fontSize: "0.68rem",
                      letterSpacing: ".13em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Seated ({participants.length})
                  </button>
                </div>

                {!editingHandle ? (
                  <button
                    type="button"
                    onClick={() => { setHandleDraft(identity.handle); setEditingHandle(true); }}
                    style={{ background: "none", border: "1px solid var(--c-line)", borderRadius: "2px", padding: "0.2rem 0.5rem", color: "var(--c-ink-2)", fontFamily: "var(--f-mono)", fontSize: "0.64rem", cursor: "pointer" }}
                    title="Change display handle"
                  >
                    {identity.handle} ✎
                  </button>
                ) : (
                  <form onSubmit={saveHandle} style={{ display: "flex", gap: "0.3rem" }}>
                    <input
                      value={handleDraft}
                      onChange={e => setHandleDraft(e.target.value)}
                      autoFocus
                      maxLength={28}
                      style={{ width: "6.5rem", padding: "0.2rem 0.45rem", background: "var(--c-panel-2)", border: "1px solid var(--c-amber)", borderRadius: "2px", color: "var(--c-ink)", fontSize: "0.74rem" }}
                    />
                    <button type="submit" className="pm-btn pm-btn--primary pm-btn--sm" style={{ height: "1.65rem", padding: "0 0.5rem" }}>OK</button>
                  </form>
                )}
              </div>

              {sideTab === "chat" ? (
                <>
                  <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {messages.length === 0 ? (
                      <div style={{ padding: "2rem 0.5rem", textAlign: "center", color: "var(--c-ink-3)" }}>
                        <div className="t-mono" style={{ fontSize: "0.68rem", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "0.45rem" }}>
                          Screening Thread Ready
                        </div>
                        <div style={{ fontSize: "0.84rem", lineHeight: 1.5 }}>
                          Everyone in this synced screening sees your notes and timestamps in real time. Say hello or react to the current frame.
                        </div>
                      </div>
                    ) : (
                      messages.map(m => {
                        if (m.kind === "reaction") {
                          const rx = WP_REACTIONS.find(r => r.key === m.reaction) || WP_REACTIONS[0];
                          return (
                            <div
                              key={m.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.5rem",
                                padding: "0.4rem 0.65rem",
                                background: "rgba(255,255,255,.025)",
                                border: "1px solid var(--c-line)",
                                borderRadius: "2px",
                                fontSize: "0.78rem",
                                color: "var(--c-ink-2)",
                              }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                                <span style={{ color: "var(--c-amber)" }}><Icon name={rx.icon} size={11}/></span>
                                <strong style={{ color: m.color || "var(--c-ink)", fontWeight: 600 }}>{m.handle}</strong>
                                <span>{m.text}</span>
                              </span>
                              {m.timecode && (
                                <span className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-ink-4)", fontVariantNumeric: "tabular-nums" }}>
                                  {m.timecode}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.22rem",
                              paddingBottom: "0.55rem",
                              borderBottom: "1px solid rgba(255,255,255,.05)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "1px", background: m.color || "var(--c-amber)", flexShrink: 0 }}/>
                                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: m.color || "var(--c-ink)" }}>{m.handle}</span>
                              </span>
                              {m.timecode && (
                                <span className="t-mono" style={{ fontSize: "0.62rem", color: "var(--c-ink-4)", fontVariantNumeric: "tabular-nums" }}>
                                  {m.timecode}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.85rem", lineHeight: 1.45, color: "var(--c-ink)", paddingLeft: "0.95rem" }}>
                              {m.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={sendChat} style={{ padding: "0.7rem 0.85rem", borderTop: "1px solid var(--c-line)", display: "flex", gap: "0.5rem", background: "var(--c-panel-2)" }}>
                    <input
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      placeholder="Message the screening room…"
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
                </>
              ) : (
                <div style={{ flex: 1, overflowY: "auto", padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {participants.map(p => (
                    <div
                      key={p.userId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.55rem 0.7rem",
                        background: "var(--c-panel-2)",
                        border: "1px solid var(--c-line)",
                        borderRadius: "2px",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
                        <span style={{
                          width: 24,
                          height: 24,
                          borderRadius: "2px",
                          background: p.color || "var(--c-amber)",
                          color: "#0a0a0c",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--f-mono)",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}>
                          {(p.handle || "V")[0].toUpperCase()}
                        </span>
                        <span style={{ fontSize: "0.84rem", fontWeight: 500 }}>{p.handle}</span>
                      </span>
                      <span className="t-mono" style={{ fontSize: "0.62rem", color: p.userId === identity.userId ? "var(--c-amber)" : "var(--c-ink-3)", letterSpacing: ".12em" }}>
                        {p.userId === identity.userId ? "YOU" : "SEATED"}
                      </span>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <div style={{ fontSize: "0.84rem", color: "var(--c-ink-3)", padding: "1rem 0" }}>
                      Connecting to live room roster…
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>
      </section>

      {/* Editorial Hero Film Dossier Below Stage */}
      <section className="wp-dossier-band">
        <div className="pm-dossier">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <span className="pm-k"><b>Screening Dossier</b> · {creatorName}</span>
            <h1 className="pm-xl" style={{ fontSize: "clamp(2.1rem, 3.6vw, 3.35rem)" }}>{film.title}</h1>
            <div className="pm-hero__meta">
              <span>{film.year}</span>
              {(film.genre || [])[0] && <span>{film.genre[0]}</span>}
              <span>{film.runtime}</span>
              {film.rating && <span>★ {film.rating}</span>}
              <span>{dub} Audio</span>
            </div>
            <p className="pm-lede" style={{ maxWidth: "60ch" }}>{film.synopsis || film.logline}</p>

            {directorNote && (
              <div className="pm-quote" style={{ marginTop: "0.35rem" }}>
                <blockquote style={{ fontSize: "clamp(0.98rem, 1.2vw, 1.16rem)" }}>“{directorNote}”</blockquote>
                <span className="pm-k"><b>Cina Programmer’s Note</b> · Curated Screening</span>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "0.35rem" }}>
              <button type="button" className="pm-btn pm-btn--primary" onClick={() => window.navigate?.(`/film/${film.id}`)}>
                <Icon name="film" size={14}/>Full Film Page
              </button>
              <button type="button" className="pm-btn" onClick={() => window.navigate?.(`/premiere/${film.id}`)}>
                <Icon name="spark" size={14}/>Premiere Lounge
              </button>
              <button type="button" className="pm-btn" onClick={() => window.navigate?.(`/studios/${film.creatorId}`)}>
                Studio House →
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {window.PartyLeanBanner && <window.PartyLeanBanner film={film}/>}

            {castList.length > 0 && (
              <div className="pm-panel" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <span className="pm-k"><b>Principal Cast</b></span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))", gap: "0.65rem" }}>
                  {castList.map(actor => (
                    <button
                      key={actor.id}
                      type="button"
                      onClick={() => window.navigate?.(`/cast/${actor.id}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                        padding: "0.5rem",
                        background: "var(--c-panel-2)",
                        border: "1px solid var(--c-line)",
                        borderRadius: "2px",
                        color: "var(--c-ink)",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <img src={actor.photo} alt={actor.name} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}/>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{actor.name}</span>
                        <span className="t-mono" style={{ display: "block", fontSize: "0.62rem", color: "var(--c-ink-3)" }}>{actor.appearances || 3} films</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Switch to Other Live Screening Rooms */}
        {otherParties.length > 0 && (
          <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--c-line)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", marginBottom: "1.15rem", flexWrap: "wrap" }}>
              <div>
                <h2 className="pm-h2">Other Open Screening Rooms</h2>
                <span className="pm-sec__note">Jump directly into another synced theater room</span>
              </div>
              <button type="button" className="pm-link" onClick={() => window.navigate?.("/rooms")}>
                All Watch Parties <Icon name="chev-r" size={13}/>
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 20rem), 1fr))", gap: "1.5%" }}>
              {otherParties.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => window.navigate?.(`/party/${c.id}`)}
                  style={{
                    all: "unset",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--c-panel)",
                    border: "1px solid var(--c-line)",
                    borderRadius: "2px",
                    overflow: "hidden",
                    transition: "border-color .16s ease, transform .18s ease",
                  }}
                >
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: c.color || "var(--c-panel-2)" }}>
                    <FrameThumb kind={c.thumb} usePhoto/>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,8,10,.88) 0%, rgba(8,8,10,.15) 60%)" }}/>
                    <span className="pm-badge" style={{ top: "0.55rem", left: "0.55rem" }}>Synced Room</span>
                  </div>
                  <div style={{ padding: "0.85rem 0.95rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <span style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "1.22rem", color: "var(--c-ink)" }}>{c.title}</span>
                    <span className="t-mono" style={{ fontSize: "0.68rem", color: "var(--c-ink-3)", letterSpacing: ".1em" }}>
                      {(c.creator || "").split("·")[0].trim()} · {c.runtime}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

Object.assign(window, { WatchPartyPage });
