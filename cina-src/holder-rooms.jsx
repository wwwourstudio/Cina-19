// holder-rooms.jsx — Watch Parties main hub (/rooms).
// Unifies Synced Film Watch Parties (/party/:filmId), World Premieres
// (/premiere/:filmId), User-Hosted Screening Rooms, Real-Time Holder Salons
// (/ws/screening), and the Live Screening Calendar under the Premiere grammar.

const { useState: usHr, useEffect: ueHr, useRef: urHr, useMemo: umHr } = React;

const HR_SALONS = [
  {
    id: "ll",
    filmId: "ll",
    filmTitle: "Last Light",
    roomTitle: "Last Light · Late-Shift Holdout Salon",
    topic: "Should the station burn its reserve fuel or hold orbit for the supply barge?",
    creator: "Lena Voss",
    cutCount: 81,
    hosts: [
      { id: "h-voss", name: "Lena Voss", role: "Director · Host", color: "var(--c-amber)", speaking: true },
      { id: "h-marcus", name: "Marcus Hal", role: "Sound Designer", color: "#8fd4a4", speaking: false },
      { id: "h-noa", name: "Noa Lind", role: "Lead Cut Producer", color: "#9ec4f8", speaking: false },
    ],
    pollQuestion: "Preferred Festival Cut for Edition 04",
    pollOptions: [
      { id: "cut-a", label: "Director’s Uncut 48-Hour Descent", baseVotes: 64 },
      { id: "cut-b", label: "Theatrical Compressed Orbit Cut", baseVotes: 39 },
      { id: "cut-c", label: "Isolated Modular Synth Stem Pass", baseVotes: 27 },
    ],
    nftId: "voss-ll",
    passes: [
      { edition: "Producer #014", tier: "Producer Pass", priceUSD: 620 },
      { edition: "Backer #108", tier: "Archive Edition", priceUSD: 185 },
    ],
  },
  {
    id: "rs",
    filmId: "rs",
    filmTitle: "Redshift",
    roomTitle: "Redshift · Opening Score Breakdown",
    topic: "Dissecting the Doppler brass cue and analog 35mm night exteriors.",
    creator: "Tomasz Krol",
    cutCount: 27,
    hosts: [
      { id: "h-krol", name: "Tomasz Krol", role: "Director · Host", color: "var(--c-amber)", speaking: true },
      { id: "h-soren", name: "Soren Halvorsen", role: "Cinematographer", color: "#d8a8ff", speaking: false },
    ],
    pollQuestion: "Which scene gets the live commentary screening Friday?",
    pollOptions: [
      { id: "rs-a", label: "Reel I · Desert Observatory Night", baseVotes: 51 },
      { id: "rs-b", label: "Reel III · Station Synchronization", baseVotes: 44 },
    ],
    nftId: "krol-rs",
    passes: [
      { edition: "Producer #009", tier: "Score + Master", priceUSD: 490 },
      { edition: "Backer #062", tier: "Collector Pass", priceUSD: 140 },
    ],
  },
  {
    id: "zo",
    filmId: "zo",
    filmTitle: "Zero-One",
    roomTitle: "Zero-One · Alternate Finale Critique",
    topic: "Audience fork telemetry review: why 68% chose the cold disconnect.",
    creator: "Mara Chen",
    cutCount: 54,
    hosts: [
      { id: "h-chen", name: "Mara Chen", role: "Writer / Director", color: "var(--c-amber)", speaking: true },
      { id: "h-elena", name: "Elena Cho", role: "Editor", color: "#8fd4a4", speaking: false },
    ],
    pollQuestion: "Lock next month’s public Watch Party ending?",
    pollOptions: [
      { id: "zo-a", label: "Archive Protocol Ending (Cold)", baseVotes: 78 },
      { id: "zo-b", label: "Relay Override Ending (Signal)", baseVotes: 37 },
    ],
    nftId: "chen-zo",
    passes: [
      { edition: "Producer #021", tier: "Master Fork Cut", priceUSD: 540 },
      { edition: "Backer #143", tier: "Holder Seat", priceUSD: 160 },
    ],
  },
];

const HR_SCHEDULE = [
  { id: "sch-1", date: "2026-05-14", time: "20:00 PT", category: "screening", filmId: "ll", title: "Last Light — Synced Watch Party & Commentary", host: "Lena Voss" },
  { id: "sch-2", date: "2026-05-15", time: "19:30 PT", category: "premiere", filmId: "rs", title: "Redshift — World Premiere Red Carpet & Q&A", host: "Tomasz Krol" },
  { id: "sch-3", date: "2026-05-16", time: "21:00 PT", category: "qa", filmId: "zo", title: "Zero-One — Director Cut Fork Audit Salon", host: "Mara Chen" },
  { id: "sch-4", date: "2026-05-18", time: "18:30 PT", category: "premiere", filmId: "ll", title: "Last Light — Producer Pass Encore Screening", host: "Lena Voss" },
  { id: "sch-5", date: "2026-05-21", time: "20:00 PT", category: "screening", filmId: "rs", title: "Redshift — Late-Night 35mm Restoration Party", host: "Soren Halvorsen" },
];

function HolderRoomsPage() {
  const catalog = Array.isArray(window.CATALOG) ? window.CATALOG : [];
  const getCatalogFilm = (id, fallbackIdx = 0) =>
    catalog.find(f => f.id === id) || catalog[fallbackIdx] || {
      id: id || "ll",
      title: "Last Light",
      year: 2026,
      runtime: "1h 48m",
      genre: ["Sci-Fi"],
      rating: 4.8,
      creator: "Lena Voss",
      thumb: "sci-neon",
      color: "#382a1e",
    };

  const [tab, setTab] = usHr("all"); // "all" | "parties" | "premieres" | "salons" | "schedule"
  const [customParties, setCustomParties] = usHr(() => (window.getCustomParties ? window.getCustomParties() : []));
  const [liveSummary, setLiveSummary] = usHr([]);
  const [activeSalonId, setActiveSalonId] = usHr(HR_SALONS[0].id);
  const [salonTab, setSalonTab] = usHr("poll"); // "poll" | "audit" | "market"
  const [schedFilter, setSchedFilter] = usHr("all"); // "all" | "screening" | "premiere" | "qa"

  // Salon interactive floor state
  const [handUp, setHandUp] = usHr(false);
  const [micMuted, setMicMuted] = usHr(true);
  const [userVotes, setUserVotes] = usHr(() => {
    try { return JSON.parse(localStorage.getItem("cina_salon_votes_v1") || "{}"); } catch (_) { return {}; }
  });
  const [auditWinner, setAuditWinner] = usHr(null);
  const [auditHistory, setAuditHistory] = usHr([]);

  // Real-time WebSocket salon chat & presence
  const identity = umHr(() => {
    if (typeof window.getScreeningIdentity === "function") return window.getScreeningIdentity();
    return {
      userId: "hr_" + Math.random().toString(36).slice(2, 8),
      handle: (window.SESSION && window.SESSION.name) || "Member",
      color: "var(--c-amber)",
    };
  }, []);

  const [wsStatus, setWsStatus] = usHr("connecting");
  const [wsParticipants, setWsParticipants] = usHr([]);
  const [wsMessages, setWsMessages] = usHr([]);
  const [wsReactionCounts, setWsReactionCounts] = usHr({ applause: 0, cinema: 0, fire: 0 });
  const [chatDraft, setChatDraft] = usHr("");

  const wsRef = urHr(null);
  const pendingRef = urHr([]);
  const seenIdsRef = urHr(new Set());
  const chatScrollRef = urHr(null);

  const activeSalon = HR_SALONS.find(s => s.id === activeSalonId) || HR_SALONS[0];
  const salonFilm = getCatalogFilm(activeSalon.filmId, 0);
  const salonWsRoom = `salon-${activeSalon.id}`;

  // Sync custom parties list when updated from CreatePartyModal
  ueHr(() => {
    const syncCustom = () => {
      if (window.getCustomParties) setCustomParties(window.getCustomParties());
    };
    window.addEventListener("cina:parties-updated", syncCustom);
    window.addEventListener("storage", syncCustom);
    return () => {
      window.removeEventListener("cina:parties-updated", syncCustom);
      window.removeEventListener("storage", syncCustom);
    };
  }, []);

  // Poll /api/screening-summary once and every 15s for real server room metrics
  ueHr(() => {
    let cancelled = false;
    const fetchSummary = () => {
      fetch("/api/screening-summary")
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (!cancelled && d && Array.isArray(d.rooms)) setLiveSummary(d.rooms);
        })
        .catch(() => {});
    };
    fetchSummary();
    const iv = setInterval(fetchSummary, 15000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const appendUniqueWsMsg = (msg) => {
    if (!msg || !msg.id) return;
    setWsMessages(prev => {
      if (seenIdsRef.current.has(msg.id) && prev.some(m => m.id === msg.id)) return prev;
      seenIdsRef.current.add(msg.id);
      return [...prev.slice(-199), msg];
    });
  };

  // Connect real /ws/screening socket for the selected Holder Salon
  ueHr(() => {
    let disposed = false;
    let reconnectTimer = null;
    let attempt = 0;

    seenIdsRef.current = new Set();
    setWsMessages([]);
    setWsParticipants([]);
    setWsStatus("connecting");

    const connect = () => {
      if (disposed) return;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const qs = new URLSearchParams({
        roomId: salonWsRoom,
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
          setWsMessages(synced);
          if (Array.isArray(data.participants)) setWsParticipants(data.participants);
          if (data.reactionCounts) setWsReactionCounts(prev => ({ ...prev, ...data.reactionCounts }));
        } else if (data.type === "presence:update") {
          if (Array.isArray(data.participants)) setWsParticipants(data.participants);
        } else if (data.type === "chat:message" && data.message) {
          appendUniqueWsMsg(data.message);
        } else if (data.type === "reaction:event" && data.event) {
          if (data.reactionCounts) setWsReactionCounts(prev => ({ ...prev, ...data.reactionCounts }));
          appendUniqueWsMsg(data.event);
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
  }, [salonWsRoom]);

  ueHr(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [wsMessages.length]);

  const sendSocket = (payload) => {
    const encoded = JSON.stringify(payload);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(encoded);
    } else {
      pendingRef.current.push(encoded);
    }
  };

  const handleSalonSend = (e) => {
    if (e) e.preventDefault();
    const clean = chatDraft.trim();
    if (!clean) return;
    const id = `hr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const localMsg = {
      id,
      roomId: salonWsRoom,
      userId: identity.userId,
      handle: identity.handle,
      color: identity.color,
      kind: "chat",
      text: clean,
      timecode: "SALON",
      createdAt: Date.now(),
    };
    appendUniqueWsMsg(localMsg);
    sendSocket({ type: "chat:send", roomId: salonWsRoom, id, text: clean, timecode: "SALON" });
    setChatDraft("");
  };

  const handleSalonReaction = (reactionKey) => {
    const id = `hr_rx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    sendSocket({ type: "reaction:send", roomId: salonWsRoom, id, reaction: reactionKey, timecode: "SALON" });
  };

  const castSalonVote = (optionId) => {
    const next = { ...userVotes, [activeSalon.id]: optionId };
    setUserVotes(next);
    try { localStorage.setItem("cina_salon_votes_v1", JSON.stringify(next)); } catch (_) {}
    window.toast?.({ title: "SALON VOTE RECORDED", text: activeSalon.roomTitle, kind: "good" });
  };

  const runAuditDraw = () => {
    const pool = [
      ...wsParticipants.map(p => ({ name: p.handle, pass: "Live Attendee" })),
      { name: "S. Lindqvist", pass: "Pass #014" },
      { name: "M. Takahashi", pass: "Pass #042" },
      { name: "A. Okafor", pass: "Pass #088" },
      { name: "R. Bellini", pass: "Pass #117" },
    ];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const entry = {
      ...picked,
      salon: activeSalon.filmTitle,
      at: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setAuditWinner(entry);
    setAuditHistory(prev => [entry, ...prev].slice(0, 6));
    window.toast?.({ title: "AUDIT DRAW COMPLETE", text: `${entry.name} (${entry.pass}) drawn for floor`, kind: "good" });
  };

  const copyRoomInvite = (path, label) => {
    const url = `${window.location.origin}${window.location.pathname}#${path}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        window.toast?.({ title: "ROOM LINK COPIED", text: label || url, kind: "good" });
      }).catch(() => window.toast?.({ title: "ROOM LINK", text: url }));
    } else {
      window.toast?.({ title: "ROOM LINK", text: url });
    }
  };

  // Curated Watch Party rooms backed by actual catalog films
  const curatedPartyFilms = umHr(() => {
    const ids = ["ll", "rs", "zo"];
    const found = ids.map(id => catalog.find(f => f.id === id)).filter(Boolean);
    const extras = catalog.filter(f => !ids.includes(f.id)).slice(0, Math.max(0, 6 - found.length));
    return [...found, ...extras];
  }, [catalog.length]);

  const featuredFilm = curatedPartyFilms[0] || getCatalogFilm("ll", 0);
  const secondFilm = curatedPartyFilms[1] || curatedPartyFilms[0] || featuredFilm;

  const getRoomLiveCount = (roomIdMatch) => {
    const match = liveSummary.find(r => r.roomId === roomIdMatch || r.roomId.includes(roomIdMatch));
    return match ? match.participantCount : 0;
  };

  const filteredSchedule = HR_SCHEDULE.filter(item => schedFilter === "all" || item.category === schedFilter);

  const selectedVoteId = userVotes[activeSalon.id] || null;
  const totalSalonVotes = activeSalon.pollOptions.reduce((sum, o) => sum + o.baseVotes + (selectedVoteId === o.id ? 1 : 0), 0);

  return (
    <div className="pm hr-page" data-screen-label="Watch Parties">
      <style>{`
        .hr-hero-desk{background:rgba(10,10,13,.84);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid var(--c-line-2);border-radius:2px;padding:1.15rem;display:flex;flex-direction:column;gap:0.75rem;width:100%;box-sizing:border-box}
        .hr-hero-item{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;padding:0.65rem 0.75rem;background:rgba(255,255,255,.04);border:1px solid var(--c-line);border-radius:2px;width:100%;transition:border-color .15s,background .15s}
        .hr-hero-item:hover{border-color:var(--c-amber);background:rgba(var(--accent-rgb),.08)}
        .hr-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,21rem),1fr));gap:1.5rem 1.8%;width:100%}
        .hr-salon-grid{display:grid;grid-template-columns:minmax(0,58%) minmax(0,39%);justify-content:space-between;gap:3%;align-items:stretch;width:100%}
        .hr-party-card{display:flex;flex-direction:column;background:var(--c-panel);border:1px solid var(--c-line);border-radius:2px;overflow:hidden;transition:border-color .18s,transform .2s cubic-bezier(.16,1,.3,1)}
        .hr-party-card:hover{border-color:rgba(var(--accent-rgb),.5);transform:translateY(-2px)}
        @media (max-width:64em){
          .hr-salon-grid{grid-template-columns:100%;gap:1.5rem}
        }
      `}</style>

      {/* Editorial Watch Parties Page Hero */}
      <PmHero
        short
        image={featuredFilm.thumb}
        color={featuredFilm.color}
        kicker={<><b>Watch Parties &amp; Salons</b> · Real-Time Screening Rooms</>}
        title="Watch Together, Live."
        facts={[
          ["parties", `${curatedPartyFilms.length + customParties.length} open rooms`],
          ["premieres", `${curatedPartyFilms.length} premieres queued`],
          ["salons", `${HR_SALONS.length} director salons`],
        ]}
        lede="Step into a synced playback room with friends, experience Red Carpet World Premieres on countdown, or debate tonight’s cuts live in a Director Salon."
        actions={
          <>
            {window.openCreateParty && (
              <button type="button" className="pm-btn pm-btn--primary" onClick={() => window.openCreateParty(featuredFilm)}>
                <Icon name="plus" size={14}/>Host a Watch Party
              </button>
            )}
            <button type="button" className="pm-btn pm-btn--glass" onClick={() => window.navigate?.(`/party/${featuredFilm.id}`)}>
              <Icon name="play" size={13}/>Enter {featuredFilm.title} Party
            </button>
            <button type="button" className="pm-btn pm-btn--glass" onClick={() => window.navigate?.(`/premiere/${secondFilm.id}`)}>
              <Icon name="ticket" size={13}/>Premiere Lounge
            </button>
          </>
        }
      >
        <div style={{ marginTop: "1.65rem", maxWidth: "46rem" }}>
          <div className="hr-hero-desk">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
              <span className="pm-k" style={{ color: "var(--c-amber)" }}>Quick Jump · Tonight’s Live Rooms</span>
              <span className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-ink-3)" }}>SYNCED WEBSOCKET ROOMS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))", gap: "0.65rem" }}>
              {curatedPartyFilms.slice(0, 2).map((cf, i) => {
                const target = i === 0 ? `/party/${cf.id}` : `/premiere/${cf.id}`;
                const badge = i === 0 ? "Synced Party" : "World Premiere";
                return (
                  <button key={cf.id} type="button" className="hr-hero-item" onClick={() => window.navigate?.(target)}>
                    <div style={{ minWidth: 0 }}>
                      <div className="t-mono" style={{ fontSize: "0.6rem", letterSpacing: ".14em", color: "var(--c-amber)", textTransform: "uppercase" }}>
                        {badge}
                      </div>
                      <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "1.12rem", color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cf.title}
                      </div>
                    </div>
                    <Icon name="chev-r" size={14}/>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PmHero>

      {/* Sticky Architectural Filter Tabs */}
      <PmTabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["all", "All Rooms"],
          ["parties", `Synced Screenings (${curatedPartyFilms.length + customParties.length})`],
          ["premieres", "World Premieres"],
          ["salons", "Holder Salons"],
          ["schedule", "Schedule"],
        ]}
      />

      {/* User-Hosted Watch Parties (when any exist via CreatePartyModal) */}
      {(tab === "all" || tab === "parties") && customParties.length > 0 && (
        <PmSection
          title="Your Hosted Watch Parties"
          note={`${customParties.length} custom screening ${customParties.length === 1 ? "room" : "rooms"} ready`}
          link="Host another"
          onLink={() => window.openCreateParty && window.openCreateParty(featuredFilm)}
        >
          <div className="hr-card-grid">
            {customParties.map(p => {
              const f = getCatalogFilm(p.filmId, 0);
              const route = window.buildPartyRoute
                ? window.buildPartyRoute(f.id, { roomSlug: p.roomSlug, name: p.name, vis: p.visibility })
                : `/party/${f.id}?room=${encodeURIComponent(p.roomSlug)}&name=${encodeURIComponent(p.name)}`;
              const activeCount = getRoomLiveCount(p.roomSlug);
              return (
                <div key={p.roomSlug} className="hr-party-card">
                  <div style={{ position: "relative", aspectRatio: "16 / 9", background: f.color || "var(--c-panel-2)", overflow: "hidden" }}>
                    <FrameThumb kind={f.thumb} usePhoto/>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,8,10,.92) 0%, rgba(8,8,10,.15) 60%)" }}/>
                    <span className="pm-badge pm-badge--red" style={{ top: "0.55rem", left: "0.55rem" }}>
                      {p.visibility === "friends" ? "Invite Only" : p.visibility === "holders" ? "Holders Only" : "Hosted Public"}
                    </span>
                    {window.RoomMatchBadge && (
                      <div style={{ position: "absolute", top: "0.55rem", right: "0.55rem" }}>
                        <window.RoomMatchBadge filmId={f.id}/>
                      </div>
                    )}
                    <div style={{ position: "absolute", left: "0.85rem", right: "0.85rem", bottom: "0.75rem" }}>
                      <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "1.3rem", color: "var(--c-ink)" }}>
                        {p.name}
                      </div>
                      <div className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-ink-3)", letterSpacing: ".1em", marginTop: "0.2rem" }}>
                        {f.title} · Hosted by {p.host || "You"} {activeCount > 0 ? `· ${activeCount} live` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "0.85rem 0.95rem", display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                    <button type="button" className="pm-btn pm-btn--primary pm-btn--sm" style={{ flex: 1 }} onClick={() => window.navigate?.(route)}>
                      Enter Room →
                    </button>
                    <button type="button" className="pm-btn pm-btn--sm" onClick={() => copyRoomInvite(route, p.name)}>
                      Copy Link
                    </button>
                    <button
                      type="button"
                      className="pm-btn pm-btn--sm"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => window.deleteCustomParty && window.deleteCustomParty(p.roomSlug)}
                    >
                      <Icon name="x" size={12}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </PmSection>
      )}

      {/* Curated Synced Watch Parties */}
      {(tab === "all" || tab === "parties") && (
        <PmSection
          title="Open Synced Watch Parties"
          note="Frame-accurate shared playback with real-time WebSocket chat & reaction bursts"
          link="Host a private room"
          onLink={() => window.openCreateParty && window.openCreateParty(featuredFilm)}
        >
          <div className="hr-card-grid">
            {curatedPartyFilms.map(f => {
              const creatorName = (f.creator || "").split("·")[0].trim() || "Director";
              const liveCount = getRoomLiveCount(`party-${f.id}`);
              const partyRoute = `/party/${f.id}`;
              return (
                <div key={f.id} className="hr-party-card">
                  <div style={{ position: "relative", aspectRatio: "16 / 9", background: f.color || "var(--c-panel-2)", overflow: "hidden", cursor: "pointer" }} onClick={() => window.navigate?.(partyRoute)}>
                    <FrameThumb kind={f.thumb} usePhoto/>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,8,10,.92) 0%, rgba(8,8,10,.12) 60%)" }}/>
                    <span className="pm-badge" style={{ top: "0.55rem", left: "0.55rem" }}>Synced Room</span>
                    {window.RoomMatchBadge && (
                      <div style={{ position: "absolute", top: "0.55rem", right: "0.55rem" }}>
                        <window.RoomMatchBadge filmId={f.id}/>
                      </div>
                    )}
                    <div style={{ position: "absolute", left: "0.85rem", right: "0.85rem", bottom: "0.75rem" }}>
                      <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "1.35rem", color: "var(--c-ink)", lineHeight: 1.1 }}>
                        {f.title}
                      </div>
                      <div className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-ink-3)", letterSpacing: ".1em", marginTop: "0.22rem", fontVariantNumeric: "tabular-nums" }}>
                        {creatorName} · {f.runtime} · ★ {f.rating}{liveCount > 0 ? ` · ${liveCount} seated` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "0.85rem 0.95rem", display: "flex", flexDirection: "column", gap: "0.65rem", flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "0.83rem", lineHeight: 1.48, color: "var(--c-ink-2)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {f.logline || f.synopsis}
                    </p>
                    <div style={{ display: "flex", gap: "0.45rem", marginTop: "auto", paddingTop: "0.25rem", flexWrap: "wrap" }}>
                      <button type="button" className="pm-btn pm-btn--primary pm-btn--sm" style={{ flex: 1 }} onClick={() => window.navigate?.(partyRoute)}>
                        <Icon name="play" size={11}/>Join Screening →
                      </button>
                      <button type="button" className="pm-btn pm-btn--sm" onClick={() => copyRoomInvite(partyRoute, `${f.title} Watch Party`)}>
                        Invite
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </PmSection>
      )}

      {/* World Premieres Section */}
      {(tab === "all" || tab === "premieres") && (
        <PmSection
          title="Red Carpet World Premieres"
          note="Countdown lobbies, assigned auditorium seating, and synchronized first-look curtains"
        >
          <div className="hr-card-grid">
            {curatedPartyFilms.slice(0, 4).map((f, idx) => {
              const creatorName = (f.creator || "").split("·")[0].trim() || "Director";
              const premiereRoute = `/premiere/${f.id}`;
              const countdownText = idx === 0 ? "Curtain Tonight · 20:00 PT" : idx === 1 ? "Doors in 1d 4h" : "Premiere Showcase";
              return (
                <div key={`pr-${f.id}`} className="hr-party-card">
                  <div style={{ position: "relative", aspectRatio: "16 / 9", background: f.color || "var(--c-panel-2)", overflow: "hidden", cursor: "pointer" }} onClick={() => window.navigate?.(premiereRoute)}>
                    <FrameThumb kind={f.thumb} usePhoto/>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,8,10,.92) 0%, rgba(8,8,10,.15) 60%)" }}/>
                    <span className="pm-badge pm-badge--red" style={{ top: "0.55rem", left: "0.55rem" }}>World Premiere</span>
                    <div style={{ position: "absolute", left: "0.85rem", right: "0.85rem", bottom: "0.75rem" }}>
                      <div style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "1.32rem", color: "var(--c-ink)" }}>
                        {f.title}
                      </div>
                      <div className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-amber)", letterSpacing: ".1em", marginTop: "0.2rem" }}>
                        {countdownText} · {creatorName}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "0.85rem 0.95rem", display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                    <button type="button" className="pm-btn pm-btn--primary pm-btn--sm" style={{ flex: 1 }} onClick={() => window.navigate?.(premiereRoute)}>
                      Enter Premiere Lounge →
                    </button>
                    {window.PmRemindBtn && (
                      <window.PmRemindBtn
                        sm
                        k={`premiere-${f.id}`}
                        info={{ label: `${f.title} World Premiere`, date: "2026-06-14" }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PmSection>
      )}

      {/* Interactive Live Holder Salon Stage & Real-Time WS Lounge */}
      {(tab === "all" || tab === "salons") && (
        <PmSection
          title="Live Director & Holder Salons"
          note="Real-time WebSocket stage discussions, live cut polls, and verifiable floor audit draws"
        >
          {/* Salon Room Switcher */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.15rem" }}>
            {HR_SALONS.map(s => {
              const on = s.id === activeSalon.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSalonId(s.id)}
                  className={"pm-btn pm-btn--sm" + (on ? " pm-btn--primary" : "")}
                >
                  {s.filmTitle} Salon · {s.cutCount} Cuts
                </button>
              );
            })}
          </div>

          <div className="hr-salon-grid">
            {/* Left Stage Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
              <div className="pm-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Active Salon Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", paddingBottom: "0.85rem", borderBottom: "1px solid var(--c-line)", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <span className="pm-k" style={{ color: "var(--c-amber)" }}>
                      {activeSalon.filmTitle} · Director Salon
                    </span>
                    <h3 className="pm-h2" style={{ marginTop: "0.2rem" }}>{activeSalon.roomTitle}</h3>
                    <p style={{ margin: "0.35rem 0 0", fontSize: "0.86rem", color: "var(--c-ink-2)", lineHeight: 1.48 }}>
                      {activeSalon.topic}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pm-btn pm-btn--sm"
                    onClick={() => window.navigate?.(`/party/${salonFilm.id}`)}
                  >
                    Open Film Party →
                  </button>
                </div>

                {/* Hosts & Live WebSocket Floor Roster */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <span className="pm-k">Stage Hosts &amp; Seated Members</span>
                    <span className="t-mono" style={{ fontSize: "0.64rem", color: wsStatus === "connected" ? "var(--c-good)" : "var(--c-ink-3)", fontVariantNumeric: "tabular-nums" }}>
                      {wsStatus === "connected" ? "WS LIVE" : wsStatus.toUpperCase()} · {wsParticipants.length + activeSalon.hosts.length} IN FLOOR
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(11.5rem, 1fr))", gap: "0.6rem" }}>
                    {activeSalon.hosts.map(h => (
                      <div
                        key={h.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.65rem",
                          padding: "0.55rem 0.7rem",
                          background: "var(--c-panel-2)",
                          border: "1px solid " + (h.speaking ? "var(--c-amber)" : "var(--c-line)"),
                          borderRadius: "2px",
                        }}
                      >
                        <span style={{
                          width: 28,
                          height: 28,
                          borderRadius: "2px",
                          background: h.color,
                          color: "#0a0a0c",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--f-mono)",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {h.name[0]}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                          <div className="t-mono" style={{ fontSize: "0.6rem", color: h.speaking ? "var(--c-amber)" : "var(--c-ink-3)" }}>{h.role}</div>
                        </div>
                      </div>
                    ))}
                    {wsParticipants.slice(0, 6).map(p => (
                      <div
                        key={p.userId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.65rem",
                          padding: "0.55rem 0.7rem",
                          background: "var(--c-panel-2)",
                          border: "1px solid " + (p.userId === identity.userId && handUp ? "var(--c-amber)" : "var(--c-line)"),
                          borderRadius: "2px",
                        }}
                      >
                        <span style={{
                          width: 28,
                          height: 28,
                          borderRadius: "2px",
                          background: p.color || "var(--c-ink-2)",
                          color: "#0a0a0c",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--f-mono)",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {(p.handle || "M")[0].toUpperCase()}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.handle}</div>
                          <div className="t-mono" style={{ fontSize: "0.6rem", color: p.userId === identity.userId && handUp ? "var(--c-amber)" : "var(--c-ink-3)" }}>
                            {p.userId === identity.userId ? (handUp ? "Hand Raised" : "You · Seated") : "Seated"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Working Floor & Mic Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.65rem", paddingTop: "0.75rem", borderTop: "1px solid var(--c-line)", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={"pm-btn pm-btn--sm" + (handUp ? " pm-btn--primary" : "")}
                      onClick={() => {
                        const next = !handUp;
                        setHandUp(next);
                        window.toast?.({ title: next ? "HAND RAISED" : "HAND LOWERED", text: next ? "Added to stage speaker queue" : "Returned to floor", kind: "good" });
                      }}
                    >
                      <Icon name="spark" size={12}/>{handUp ? "Hand Raised" : "Request Mic"}
                    </button>
                    <button
                      type="button"
                      className={"pm-btn pm-btn--sm" + (!micMuted ? " pm-btn--on" : "")}
                      onClick={() => setMicMuted(m => !m)}
                    >
                      <Icon name={micMuted ? "vol-x" : "vol"} size={12}/>{micMuted ? "Mic Muted" : "Mic Live"}
                    </button>
                    {(handUp || !micMuted) && (
                      <button
                        type="button"
                        className="pm-btn pm-btn--sm"
                        aria-label="Leave mic queue and mute"
                        onClick={() => { setHandUp(false); setMicMuted(true); }}
                      >
                        <Icon name="x" size={12}/>Step Down
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="pm-btn pm-btn--sm"
                    onClick={() => copyRoomInvite(`/party/${salonFilm.id}`, activeSalon.roomTitle)}
                  >
                    <Icon name="share" size={12}/>Share Invite
                  </button>
                </div>
              </div>

              {/* Salon Tools Tabs: Cut Poll / Audit Call Draw / Pass Market */}
              <div className="pm-panel" style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                <div style={{ display: "flex", gap: "0.4rem", borderBottom: "1px solid var(--c-line)", paddingBottom: "0.65rem", flexWrap: "wrap" }}>
                  {[
                    ["poll", "Live Cut Poll"],
                    ["audit", "Audit-Call Draw"],
                    ["market", "Pass Floor"],
                  ].map(([k, lbl]) => (
                    <button
                      key={k}
                      type="button"
                      className={"pm-btn pm-btn--sm" + (salonTab === k ? " pm-btn--primary" : "")}
                      onClick={() => setSalonTab(k)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {salonTab === "poll" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600 }}>{activeSalon.pollQuestion}</div>
                      <span className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-ink-3)", fontVariantNumeric: "tabular-nums" }}>{totalSalonVotes} VOTES</span>
                    </div>
                    {activeSalon.pollOptions.map(opt => {
                      const votes = opt.baseVotes + (selectedVoteId === opt.id ? 1 : 0);
                      const pctVal = totalSalonVotes ? Math.round((votes / totalSalonVotes) * 100) : 0;
                      const chosen = selectedVoteId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => castSalonVote(opt.id)}
                          style={{
                            position: "relative",
                            textAlign: "left",
                            padding: "0.7rem 0.85rem",
                            background: "var(--c-panel-2)",
                            border: "1px solid " + (chosen ? "var(--c-amber)" : "var(--c-line)"),
                            borderRadius: "2px",
                            color: "var(--c-ink)",
                            cursor: "pointer",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pctVal}%`, background: chosen ? "rgba(var(--accent-rgb),.18)" : "rgba(255,255,255,.04)", pointerEvents: "none" }}/>
                          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "0.84rem", fontWeight: chosen ? 600 : 450 }}>{opt.label}</span>
                            <span className="t-mono" style={{ fontSize: "0.74rem", fontWeight: 700, color: chosen ? "var(--c-amber)" : "var(--c-ink-2)", fontVariantNumeric: "tabular-nums" }}>
                              {pctVal}% ({votes})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {salonTab === "audit" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--c-ink-2)", lineHeight: 1.5 }}>
                      Draw a verified pass holder or live attendee from the current salon roster to take the guest mic.
                    </p>
                    <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                      <button type="button" className="pm-btn pm-btn--primary pm-btn--sm" onClick={runAuditDraw}>
                        {auditWinner ? "Re-draw Guest Seat" : "Run Guest Draw"}
                      </button>
                      <button type="button" className="pm-btn pm-btn--sm" onClick={() => copyRoomInvite("/rooms", activeSalon.roomTitle)}>
                        Send Call Link
                      </button>
                    </div>
                    {auditWinner && (
                      <div style={{ padding: "0.75rem 0.9rem", background: "var(--c-panel-2)", border: "1px solid var(--c-amber)", borderRadius: "2px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                        <div>
                          <div className="t-mono" style={{ fontSize: "0.62rem", color: "var(--c-amber)", letterSpacing: ".12em" }}>CALLED TO FLOOR · {auditWinner.at}</div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 600, marginTop: "0.15rem" }}>{auditWinner.name} · {auditWinner.pass}</div>
                        </div>
                        <span className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-good)" }}>VERIFIED</span>
                      </div>
                    )}
                    {auditHistory.length > 1 && (
                      <div className="t-mono" style={{ fontSize: "0.66rem", color: "var(--c-ink-3)" }}>
                        Recent draws: {auditHistory.slice(1, 4).map(h => `${h.name} (${h.at})`).join(" · ")}
                      </div>
                    )}
                  </div>
                )}

                {salonTab === "market" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {activeSalon.passes.map((ps, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          padding: "0.7rem 0.85rem",
                          background: "var(--c-panel-2)",
                          border: "1px solid var(--c-line)",
                          borderRadius: "2px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.86rem", fontWeight: 600 }}>{ps.edition}</div>
                          <div className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-ink-3)" }}>{activeSalon.filmTitle} · {ps.tier}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <span className="t-mono" style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--c-amber)", fontVariantNumeric: "tabular-nums" }}>
                            ${ps.priceUSD}
                          </span>
                          <button
                            type="button"
                            className="pm-btn pm-btn--sm"
                            onClick={() => window.navigate?.(`/nft/${activeSalon.nftId}`)}
                          >
                            View Pass →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Real-Time WebSocket Salon Chat */}
            <aside className="pm-panel" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "32rem", maxHeight: "42rem" }} aria-label="Holder salon WebSocket chat">
              <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--c-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <div>
                  <span className="pm-k" style={{ color: "var(--c-amber)" }}>Salon Dispatch</span>
                  <div style={{ fontSize: "0.86rem", fontWeight: 600 }}>{activeSalon.filmTitle} Chat</div>
                </div>
                <span className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-ink-3)", fontVariantNumeric: "tabular-nums" }}>
                  {wsParticipants.length} ONLINE
                </span>
              </div>

              <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {wsMessages.length === 0 ? (
                  <div style={{ padding: "2rem 0.5rem", textAlign: "center", color: "var(--c-ink-3)" }}>
                    <div className="t-mono" style={{ fontSize: "0.66rem", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                      Salon Channel Ready
                    </div>
                    <div style={{ fontSize: "0.84rem", lineHeight: 1.5 }}>
                      Start the conversation with fellow holders and guests in real time via WebSocket.
                    </div>
                  </div>
                ) : (
                  wsMessages.map(m => (
                    <div
                      key={m.id}
                      style={{
                        paddingBottom: "0.55rem",
                        borderBottom: "1px solid rgba(255,255,255,.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.2rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: m.color || "var(--c-amber)" }}>{m.handle}</span>
                        <span className="t-mono" style={{ fontSize: "0.6rem", color: "var(--c-ink-4)" }}>{m.timecode || "LIVE"}</span>
                      </div>
                      <div style={{ fontSize: "0.84rem", color: "var(--c-ink)", lineHeight: 1.44 }}>
                        {m.kind === "reaction" ? `Reacted (${m.reaction || "applause"})` : m.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: "0.6rem 1rem", borderTop: "1px solid var(--c-line)", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {[
                  ["applause", "Bravo", "spark"],
                  ["cinema", "Cinema", "film"],
                  ["fire", "Heat", "trend"],
                ].map(([key, label, icon]) => (
                  <button
                    key={key}
                    type="button"
                    className="pm-btn pm-btn--sm"
                    style={{ height: "1.85rem", padding: "0 0.6rem", fontSize: "0.72rem" }}
                    onClick={() => handleSalonReaction(key)}
                  >
                    <Icon name={icon} size={11}/>
                    <span>{label}</span>
                    {(wsReactionCounts[key] || 0) > 0 && (
                      <span className="t-mono" style={{ color: "var(--c-amber)", fontSize: "0.64rem" }}>{wsReactionCounts[key]}</span>
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSalonSend} style={{ padding: "0.7rem 1rem", borderTop: "1px solid var(--c-line)", display: "flex", gap: "0.5rem", background: "var(--c-panel-2)" }}>
                <input
                  value={chatDraft}
                  onChange={e => setChatDraft(e.target.value)}
                  placeholder="Write to the salon floor…"
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
          </div>
        </PmSection>
      )}

      {/* Screening & Q&A Calendar Schedule */}
      {(tab === "all" || tab === "schedule") && (
        <PmSection
          title="Upcoming Screenings & Q&A Calendar"
          note="RSVP to lock reminders across Watch Parties and World Premieres"
        >
          <div style={{ display: "flex", gap: "0.45rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {[
              ["all", "All Events"],
              ["screening", "Watch Parties"],
              ["premiere", "Premieres"],
              ["qa", "Director Q&As"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={"pm-btn pm-btn--sm" + (schedFilter === val ? " pm-btn--primary" : "")}
                onClick={() => setSchedFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pm-index">
            {filteredSchedule.map(ev => {
              const target = ev.category === "premiere" ? `/premiere/${ev.filmId}` : `/party/${ev.filmId}`;
              return (
                <div key={ev.id} className="pm-row" style={{ gridTemplateColumns: "minmax(7rem, 16%) minmax(0, 1fr) auto", cursor: "default", gap: "1rem" }}>
                  <div>
                    <div className="t-mono" style={{ fontSize: "0.72rem", color: "var(--c-amber)", fontWeight: 600 }}>{ev.date}</div>
                    <div className="t-mono" style={{ fontSize: "0.64rem", color: "var(--c-ink-3)" }}>{ev.time}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <button
                      type="button"
                      onClick={() => window.navigate?.(target)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        color: "var(--c-ink)",
                        fontFamily: "var(--f-display)",
                        fontStyle: "italic",
                        fontSize: "clamp(1.15rem, 1.7vw, 1.55rem)",
                        cursor: "pointer",
                      }}
                    >
                      {ev.title}
                    </button>
                    <div className="t-mono" style={{ fontSize: "0.66rem", color: "var(--c-ink-3)", marginTop: "0.2rem" }}>
                      Hosted by {ev.host}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                    {window.PmRemindBtn && (
                      <window.PmRemindBtn
                        sm
                        k={`sched-${ev.id}`}
                        info={{ label: ev.title, date: ev.date }}
                      />
                    )}
                    <button type="button" className="pm-btn pm-btn--sm" onClick={() => window.navigate?.(target)}>
                      Open →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </PmSection>
      )}
    </div>
  );
}

window.HolderRoomsPage = HolderRoomsPage;
