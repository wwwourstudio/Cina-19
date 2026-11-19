// watch-watch.jsx — Watch page v3: hero-led, series-styled. Player drops in on demand.

const { useState: usw2, useEffect: uew2, useMemo: umw2, useRef: urw2 } = React;

function fmtT(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
}

// ─── Director's commentary track ──────────────────────────────────────────
// A House-tier / holder-only second track: the director's remarks, synced to
// the playhead. Bespoke for Last Light; synthesized (but title-aware) for the
// rest, so every film has a real commentary experience.
function directorName(film) {
  return String(film.creator || "The director").split("·")[0].trim();
}
const _COMMENTARY_LL = [
  { at: 8,    text: "We open on the lighthouse cold — no score for ninety seconds. I wanted you unsure whether this was memory or present tense." },
  { at: 150,  text: "That's a real 13-year gap in the production too. We shot the flashbacks first, then waited on the lead to age into the role." },
  { at: 460,  text: "The amber grade is doing the heavy lifting here. Every interior is one stop underexposed so the windows feel like the only warmth left." },
  { at: 900,  text: "No cut for four and a half minutes through this argument. The actors asked for it — they said the edit kept letting them off the hook." },
  { at: 1600, text: "This is the frame we put on the poster. It wasn't storyboarded; the fog just arrived and we let the camera keep rolling." },
  { at: 2800, text: "Listen for the foghorn on the downbeat. Our composer tuned the entire cue to that pitch so the room and the score are the same note." },
  { at: 4200, text: "We never show the letter's contents. Every test audience wrote their own — that ambiguity is the whole film to me." },
  { at: 5400, text: "And we end back on the cold. No resolve chord. Thank you for staying to the last light." },
];
function buildCommentary(film, dur) {
  if (film.id === "ll") return _COMMENTARY_LL;
  const dir = directorName(film);
  const g = (film.genre && film.genre[0]) || "this";
  const pts = [
    `We hold on the opening image longer than feels comfortable. I wanted the ${g.toLowerCase()} to announce its tempo before a word is spoken.`,
    `This performance is a first take. I stopped chasing coverage the moment I saw the eyes go quiet.`,
    `The color here is deliberate — we pulled the saturation until only the amber survives. It's the visual signature of the whole picture.`,
    `No music under this scene. Silence was the most expensive choice we made and the one I'd defend hardest.`,
    `That's a practical set, not a plate. Building it meant we could let the camera wander, and the wandering is the point.`,
    `We cut nine minutes from the middle to land here. The film only worked once we trusted the audience to keep up.`,
    `This is the shot I'd show anyone who asks what ${film.title} is about. Everything the story owes you gets paid in this frame.`,
    `And we close where we began. If it lands, it's because you brought the ending with you. Thank you for watching.`,
  ];
  const marks = [10, 170, 470, 900, 1500, 2700, 4100, Math.max(4600, dur - 240)];
  return pts.map((text, i) => ({ at: marks[i] || (i * (dur / pts.length)), text }));
}
function activeCommentary(cues, t) {
  let cur = null;
  for (const c of cues) { if (t >= c.at) cur = c; else break; }
  return cur;
}

// ─── Player ─────────────────────────────────────────────────────────────
function Player({ film, autoplay = true }) {
  const [playing, setPlaying] = usw2(autoplay);
  const [t, setT] = usw2(0);
  const dur = 5640; // pretend runtime in seconds
  const [showCC, setShowCC] = usw2(true);
  const [commentaryOn, setCommentaryOn] = usw2(false);
  const commentaryCues = umw2(() => buildCommentary(film, dur), [film.id]);
  const [hover, setHover] = usw2(true);
  const [premium, setPremiumState] = usePremium();
  const entitledCommentary = premium || (window.libraryOwns && window.libraryOwns(film.id));
  const curCue = commentaryOn ? activeCommentary(commentaryCues, t) : null;
  const [paywallOpen, setPaywallOpen] = usw2(false);
  const [aiOpen, setAiOpen] = usw2(false);
  const barRef = urw2(null);
  const stageRef = urw2(null);
  const hideTimer = urw2(null);
  const [muted, setMuted] = usw2(false);
  const [fs, setFs] = usw2(false);
  uew2(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {
      if (window.toast) toast({ title: "FULLSCREEN BLOCKED", text: "Your browser refused fullscreen for this frame.", kind: "info" });
    });
  };
  const chapters = umw2(() => (window.piChapters ? window.piChapters(film, dur) : []), [film.id]);

  // Demo-friendly cadence: pre-roll at start, then every 30s in real-time
  // (production would use 600s/10min — we map 1 sec real → ~20 sec film for the demo)
  const adGate = useAdGate({
    playing,
    currentTime: t,
    // Ads only run on free titles. Anything rented, bought or owned plays clean.
    adFree: premium || !film.free || !!(window.libraryOwns && window.libraryOwns(film.id)),
    intervalSec: 30, // 30s real-time = "every 10min" in the prototype demo loop
  });

  // Viewer choice moments — the Board's fork points, live in the player.
  const fm = window.useForkMoments({ film, t, dur, playing, setPlaying });
  // ShopThisLook — pause on the actor frame, buy the pieces for real.
  const shop = window.useShopMoment({ film, t, setPlaying });
  // "Your Cut" — when the credits hit, the viewer's path becomes a shareable artifact.
  const yc = window.useYourCut ? window.useYourCut({ film, t, dur, fm, setT, setPlaying }) : { open: false, letters: [] };

  uew2(() => {
    if (!playing) return;
    if (adGate.showAds) return; // pause film while ad pod plays
    if (fm.active) return;      // pause film at a fork — the room is choosing
    if (shop.open) return;      // pause film while the viewer shops the look
    if (yc.open) return;        // credits moment — the viewer's cut is on screen
    const i = setInterval(() => setT(p => Math.min(dur, p + 0.5)), 500);
    return () => clearInterval(i);
  }, [playing, adGate.showAds, fm.active, shop.open]);

  // Tell the Cina orb a video is playing (it hides; scroll brings it back).
  uew2(() => {
    window.dispatchEvent(new CustomEvent("cina:playing", { detail: playing }));
    return () => window.dispatchEvent(new CustomEvent("cina:playing", { detail: false }));
  }, [playing]);

  const bumpHover = () => {
    setHover(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHover(false), 2400);
  };

  const handleSubscribe = (plan) => {
    setPremiumState(true);
    setPaywallOpen(false);
    adGate.dismissPod();
    toast?.({ title: "AD-FREE", text: `Cina Premium · ${plan.label}`, kind: "good" });
  };

  return (
    <div
      ref={stageRef}
      onMouseMove={bumpHover}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", width: "100%", aspectRatio: "16/9",
        background: tkc("black"), overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <FrameThumb kind={film.thumb}/>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.4) 100%)" }}/>
      </div>

      {showCC && playing && t > 6 && t < 18 && !adGate.showAds && (
        <div style={{
          position: "absolute", left: "50%", bottom: 96, transform: "translateX(-50%)",
          padding: "8px 18px", background: "rgba(0,0,0,.78)", color: tkc("white"),
          fontSize: "var(--fs-lead)", lineHeight: 1.3, textAlign: "center", maxWidth: "70%", borderRadius: "var(--r-1)",
        }}>You said you'd stop developing. Thirteen years.</div>
      )}

      {/* Director's commentary — synced lower-third, House/holder-only track */}
      {commentaryOn && !adGate.showAds && !fm.active && !shop.open && (
        <>
          <style>{`@keyframes cmtyRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.28)", pointerEvents: "none" }}/>
          <div style={{
            position: "absolute", left: 24, right: aiOpen ? 364 : 24, bottom: 108, zIndex: 5,
            display: "flex", gap: 14, alignItems: "flex-start",
            padding: "14px 18px", maxWidth: 720,
            background: "rgba(10,10,12,.82)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(var(--accent-rgb),.34)", borderLeft: "2px solid var(--c-amber)", borderRadius: "var(--r-2)",
            animation: "cmtyRise .3s cubic-bezier(.2,.8,.2,1)",
          }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: film.color || tkc("amber"), display: "flex", alignItems: "center", justifyContent: "center", color: tkc("bg") }}>
              <Icon name="chat" size={14}/>
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".16em", color: "var(--c-amber)", marginBottom: 5 }}>
                {directorName(film).toUpperCase()} · DIRECTOR'S COMMENTARY
              </div>
              <div style={{ fontSize: "var(--fs-body)", lineHeight: 1.5, color: tkc("ink"), textWrap: "pretty" }}>
                {curCue ? curCue.text : "Commentary begins in a moment — the director sets up the opening image."}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Commercial pod overlay */}
      {adGate.showAds && (
        <CommercialPod
          film={film}
          podIndex={adGate.podIndex}
          onComplete={adGate.dismissPod}
          onPaywall={() => setPaywallOpen(true)}
        />
      )}

      {/* ⑂ Viewer choice — the film forks here */}
      {fm.active && !adGate.showAds && <ForkMomentOverlay fm={fm}/>}

      {/* Your Cut — credits moment for branched films */}
      {yc.open && !adGate.showAds && !fm.active && <YourCutOverlay film={film} fm={fm} yc={yc}/>}

      {/* ✦ ShopThisLook — tappable garment hotspots on the actor frame */}
      {shop.open && !adGate.showAds && !fm.active && <ShopMomentOverlay sm={shop}/>}

      {/* ShopThisLook affordance — quiet, hover-tied, never over an ad or fork */}
      {hover && playing && shop.available && !shop.open && !adGate.showAds && !fm.active && (
        <button onClick={() => shop.setOpen(true)} className="t-mono" style={{
          position: "absolute", left: 20, bottom: 96, zIndex: 4,
          padding: "9px 14px", background: "rgba(0,0,0,.72)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,.3)", borderRadius: "var(--r-2)", cursor: "pointer",
          color: tkc("white"), fontSize: "var(--fs-label)", letterSpacing: ".16em", fontWeight: 600,
        }}>✦ SHOP THIS LOOK</button>
      )}

      {hover && playing && yc.letters.length > 0 && !yc.open && !adGate.showAds && !fm.active && !shop.open && (
        <button onClick={yc.show} className="t-mono" title="See + share the path you've taken" style={{
          position: "absolute", left: 20, bottom: shop.available ? 140 : 96, zIndex: 4,
          padding: "9px 14px", background: "rgba(0,0,0,.72)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,.3)", borderRadius: "var(--r-2)", cursor: "pointer",
          color: tkc("white"), fontSize: "var(--fs-label)", letterSpacing: ".16em", fontWeight: 600,
        }}>YOUR CUT · {yc.letters.join("·")}</button>
      )}

      {/* Ad-free upsell sheet */}
      {paywallOpen && (
        <AdFreeSheet onClose={() => setPaywallOpen(false)} onSubscribe={handleSubscribe}/>
      )}

      {/* Smart skip — AI-detected intro */}
      {playing && !adGate.showAds && t > 4 && t < 90 && (
        <button onClick={() => setT(92)} className="t-mono" style={{
          position: "absolute", right: aiOpen ? 356 : 20, bottom: 96, zIndex: 4,
          padding: "9px 14px", background: "rgba(0,0,0,.72)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,.3)", borderRadius: "var(--r-2)", cursor: "pointer",
          color: tkc("white"), fontSize: "var(--fs-label)", letterSpacing: ".16em", fontWeight: 600,
        }}>SKIP INTRO · ✦ AI</button>
      )}

      {/* Cina Intelligence rail */}
      {aiOpen && !adGate.showAds && window.CinaPlayerIntel && (
        <CinaPlayerIntel film={film} t={t} dur={dur} seek={(v) => setT(v)} playing={playing} setPlaying={setPlaying} onClose={() => setAiOpen(false)}/>
      )}

      <div style={{
        position: "absolute", left: 0, right: aiOpen ? 340 : 0, bottom: 0, padding: "0 24px 18px",
        background: "linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%)",
        opacity: hover && !adGate.showAds ? 1 : 0, transition: "opacity .35s ease",
        pointerEvents: adGate.showAds ? "none" : "auto",
      }}>
        <div ref={barRef}
          onClick={(e) => {
            const r = barRef.current.getBoundingClientRect();
            setT(Math.max(0, Math.min(dur, ((e.clientX - r.left) / r.width) * dur)));
          }}
          style={{ position: "relative", height: 14, margin: "-6px 0 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <div style={{ position: "relative", height: 3, background: "rgba(255,255,255,.2)", width: "100%" }}>
            {/* AI chapter ticks */}
            {chapters.map(c => (
              <span key={c.k} title={c.t <= t ? c.label : "Unseen chapter"} style={{ position: "absolute", left: `${(c.t/dur)*100}%`, top: -2, width: 2, height: 7, background: c.t <= t ? "rgba(var(--accent-rgb),.8)" : "rgba(255,255,255,.35)" }}></span>
            ))}
            {/* ⑂ fork markers */}
            {fm.forks.map(f => (
              <span key={f.id} title={`⑂ Fork · Scene ${f.sceneNum} — ${f.heading}${fm.choices[f.id] ? " · you chose Path " + fm.choices[f.id] : ""}`}
                style={{
                  position: "absolute", left: `${(f.at/dur)*100}%`, top: "50%", transform: "translate(-50%,-50%) rotate(45deg)",
                  width: 7, height: 7, borderRadius: 1.5, zIndex: 1,
                  background: fm.choices[f.id] ? "var(--c-amber)" : tkc("bg"),
                  border: "1.5px solid var(--c-amber)",
                }}></span>
            ))}
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(t/dur)*100}%`, background: "var(--c-amber)" }}></div>
            <div style={{ position: "absolute", left: `${(t/dur)*100}%`, top: "50%", width: 12, height: 12, borderRadius: "50%", background: "var(--c-amber)", transform: "translate(-50%, -50%)" }}></div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setPlaying(p => !p)} aria-label={playing ? "Pause" : "Play"} title={playing ? "Pause" : "Play"} className="btn-ghost btn-icon" style={{ width: 32, height: 32, color: tkc("white") }}>
            <Icon name={playing ? "pause" : "play"} size={16}/>
          </button>
          <button onClick={() => setT(v => Math.max(0, v - 10))} className="btn-ghost" title="Back 10s" style={{ height: 32, padding: "0 6px", color: tkc("white"), fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)" }}>↺10</button>
          <button onClick={() => setT(v => Math.min(dur, v + 10))} className="btn-ghost" title="Forward 10s" style={{ height: 32, padding: "0 6px", color: tkc("white"), fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)" }}>10↻</button>
          <button onClick={() => setMuted(m => !m)} aria-label={muted ? "Unmute" : "Mute"} title={muted ? "Unmute" : "Mute"} aria-pressed={muted} className="btn-ghost btn-icon" style={{ width: 32, height: 32, color: muted ? "var(--c-amber)" : tkc("white") }}>
            <Icon name="vol" size={16}/>
          </button>
          <span className="t-mono t-num" style={{ fontSize: "var(--fs-label)", color: "rgba(255,255,255,.85)" }}>
            {fmtT(t)} <span style={{ opacity: .5 }}>/ {fmtT(dur)}</span>
          </span>
          {fm.pathLabel && (
            <span title={"Your path through the film — " + fm.forks.length + " fork" + (fm.forks.length === 1 ? "" : "s") + ". Click to rewatch and re-choose."}
              onClick={() => { fm.resetPath(); setT(0); }}
              style={{
                fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".16em", cursor: "pointer",
                color: "var(--c-amber)", padding: "2px 7px",
                border: "1px solid rgba(var(--accent-rgb),.5)", borderRadius: "var(--r-1)",
              }}>⑂ PATH {fm.pathLabel}</span>
          )}
          {!fm.pathLabel && fm.carry && (
            <span title={`This episode opens on Path ${fm.carry.lastLetter} — carried from your choice at scene ${fm.carry.sceneNum}.`}
              className="t-mono" style={{
                fontSize: "var(--fs-label)", letterSpacing: ".16em", cursor: "default",
                color: "var(--c-good)", padding: "2px 7px",
                border: "1px solid rgba(106,163,122,.5)", borderRadius: "var(--r-1)",
              }}>⑂ OPENS ON PATH {fm.carry.lastLetter}</span>
          )}
          {!premium && adGate.secondsUntilNextPod !== null && adGate.secondsUntilNextPod < 999 && (
            <span style={{
              fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".16em",
              color: "rgba(255,255,255,.5)", padding: "2px 6px",
              border: "1px solid rgba(255,255,255,.18)", borderRadius: "var(--r-1)",
            }}>NEXT BREAK · {Math.ceil(adGate.secondsUntilNextPod)}s</span>
          )}
          <span style={{ flex: 1 }}/>
          {!premium && (
            <button onClick={() => setPaywallOpen(true)} style={{
              appearance: "none", background: "rgba(var(--accent-rgb),.18)", color:  "var(--c-amber)",
              border: "1px solid rgba(var(--accent-rgb),.5)", padding: "5px 10px",
              borderRadius: "var(--r-1)", cursor: "pointer",
              fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".16em", fontWeight: 600,
            }}>GO AD-FREE</button>
          )}
          {premium && (
            <span style={{
              fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".16em",
              color: "var(--c-amber)", padding: "3px 8px",
              border: "1px solid var(--c-amber)", borderRadius: "var(--r-1)",
            }}>★ PREMIUM</span>
          )}
          <button onClick={() => setAiOpen(o => !o)} title="Cina — film companion" style={{
            appearance: "none", cursor: "pointer",
            background: aiOpen ? "rgba(var(--accent-rgb),.18)" : "transparent",
            border: `1px solid ${aiOpen ? "rgba(var(--accent-rgb),.55)" : "rgba(255,255,255,.25)"}`,
            color: aiOpen ? "var(--c-amber)" : tkc("white"),
            padding: "5px 10px", borderRadius: "var(--r-1)",
            fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".16em", fontWeight: 600,
          }}>✦ CINA</button>
          <button onClick={() => {
              if (!entitledCommentary) { setPaywallOpen(true); return; }
              setCommentaryOn(o => !o);
              toast?.({ title: "COMMENTARY", text: commentaryOn ? "Director's track off." : directorName(film) + "'s track on.", kind: commentaryOn ? "info" : "good" });
            }}
            title={entitledCommentary ? "Director's commentary — a second track" : "Director's commentary · House tier & holders"}
            style={{
              appearance: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              background: commentaryOn ? "rgba(var(--accent-rgb),.18)" : "transparent",
              border: `1px solid ${commentaryOn ? "rgba(var(--accent-rgb),.55)" : "rgba(255,255,255,.25)"}`,
              color: commentaryOn ? "var(--c-amber)" : tkc("white"),
              padding: "5px 10px", borderRadius: "var(--r-1)",
              fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".16em", fontWeight: 600,
            }}>
            <Icon name="chat" size={12}/> COMMENTARY {!entitledCommentary && <Icon name="lock" size={9}/>}
          </button>
          <button onClick={() => setShowCC(c => !c)} aria-label={showCC ? "Turn subtitles off" : "Turn subtitles on"} title={showCC ? "Subtitles on" : "Subtitles off"} aria-pressed={showCC} className="btn-ghost btn-icon" style={{ width: 32, height: 32, color: showCC ? "var(--c-amber)" : tkc("white") }}>
            <Icon name="captions" size={16}/>
          </button>
          <button onClick={toggleFullscreen} aria-label={fs ? "Exit fullscreen" : "Enter fullscreen"} title={fs ? "Exit fullscreen" : "Fullscreen"} className="btn-ghost btn-icon" style={{ width: 32, height: 32, color: tkc("white") }}>
            <Icon name="fullscreen" size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trailer modal + Real-Time Screening Chat Sidebar ────────────────────
function TrailerModal({ film, onClose }) {
  const TR_DUR = 102; // 1:42
  const savedProgress = typeof getProgress === "function" ? getProgress(film.id) : null;
  const initialSec = savedProgress && savedProgress.dur > 0
    ? Math.max(0, Math.min(TR_DUR - 1, Math.round((savedProgress.t / savedProgress.dur) * TR_DUR)))
    : 0;
  const [playing, setPlaying] = usw2(false);
  const [t, setT] = usw2(initialSec);
  const [muted, setMuted] = usw2(true);
  const [volume, setVolume] = usw2(0.85);
  const [syncWatch, setSyncWatch] = usw2(true);
  const [syncLeader, setSyncLeader] = usw2("");
  const [chatOpen, setChatOpen] = usw2(true);
  const [chatInput, setChatInput] = usw2("");
  const [wsStatus, setWsStatus] = usw2("connecting");
  const [participants, setParticipants] = usw2([]);
  const [messages, setMessages] = usw2([]);
  const [reactionCounts, setReactionCounts] = usw2({ applause: 0, cinema: 0, fire: 0, shock: 0, heartbreak: 0 });
  const [bursts, setBursts] = usw2([]);
  const [identity] = usw2(() => {
    try {
      let userId = localStorage.getItem("cina_screening_user_id");
      if (!userId) {
        userId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        localStorage.setItem("cina_screening_user_id", userId);
      }
      let handle = localStorage.getItem("cina_screening_handle");
      if (!handle) {
        handle = `Guest-${userId.slice(-3).toUpperCase()}`;
        localStorage.setItem("cina_screening_handle", handle);
      }
      const color = localStorage.getItem("cina_screening_color") || "#e8a33d";
      return { userId, handle, color };
    } catch (_) {
      return { userId: `v_${Date.now().toString(36)}`, handle: "Guest", color: "#e8a33d" };
    }
  });

  const chatScrollRef = React.useRef(null);
  const wsRef = React.useRef(null);
  const seenIdsRef = React.useRef(new Set());
  const pendingRef = React.useRef([]);
  const syncWatchRef = React.useRef(true);
  const isApplyingRemoteSyncRef = React.useRef(false);
  const lastRemoteSeqRef = React.useRef(0);
  const latestRoomPlaybackRef = React.useRef(null);
  const livePlaybackRef = React.useRef({ playing: false, t: initialSec, muted: true, volume: 0.85 });

  syncWatchRef.current = syncWatch;
  livePlaybackRef.current = { playing, t, muted, volume };

  const roomId = `screening-${film.id}`;
  const TR_REACTIONS = [
    { key: "applause", label: "Bravo", icon: "spark" },
    { key: "cinema", label: "Cinema", icon: "film" },
    { key: "fire", label: "Heat", icon: "trend" },
    { key: "shock", label: "Shock", icon: "alert" },
    { key: "heartbreak", label: "Cut", icon: "heart" },
  ];

  const spawnBurst = (reaction, handle, id) => {
    const offsetX = Math.floor(Math.random() * 44) - 22;
    setBursts(prev => [...prev.slice(-8), { id, reaction, handle, offsetX }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 2150);
  };

  const appendUnique = (msg) => {
    if (!msg || !msg.id) return;
    setMessages(prev => {
      if (seenIdsRef.current.has(msg.id) && prev.some(m => m.id === msg.id)) return prev;
      seenIdsRef.current.add(msg.id);
      return [...prev.slice(-199), msg];
    });
  };

  const applyRemotePlayback = (pb) => {
    if (!pb || typeof pb !== "object") return;
    latestRoomPlaybackRef.current = pb;
    const seq = Number(pb.seq) || 0;
    if (seq > 0 && seq <= lastRemoteSeqRef.current) return;
    if (seq > 0) lastRemoteSeqRef.current = seq;
    if (pb.updatedByHandle) setSyncLeader(pb.updatedByHandle);
    if (!syncWatchRef.current) return;

    isApplyingRemoteSyncRef.current = true;
    try {
      if (typeof pb.playing === "boolean") setPlaying(pb.playing);
      if (typeof pb.progress === "number" && Number.isFinite(pb.progress)) {
        const clampedPct = Math.max(0, Math.min(100, pb.progress));
        setT(Math.round((clampedPct / 100) * TR_DUR));
      }
      if (typeof pb.muted === "boolean") setMuted(pb.muted);
      if (typeof pb.volume === "number" && Number.isFinite(pb.volume)) {
        setVolume(Math.max(0, Math.min(1, pb.volume)));
      }
    } finally {
      setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 120);
    }
  };

  uew2(() => {
    let disposed = false;
    let timer = null;
    let attempt = 0;
    seenIdsRef.current = new Set();
    lastRemoteSeqRef.current = 0;
    setMessages([]);
    setParticipants([]);
    setWsStatus("connecting");

    const connect = () => {
      if (disposed) return;
      const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const qs = new URLSearchParams({
        roomId,
        userId: identity.userId,
        handle: identity.handle,
        color: identity.color,
      });
      const ws = new WebSocket(`${wsProto}//${window.location.host}/ws/screening?${qs.toString()}`);
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
          appendUnique(data.message);
        } else if (data.type === "reaction:event" && data.event) {
          if (data.reactionCounts) setReactionCounts(prev => ({ ...prev, ...data.reactionCounts }));
          if (data.event.reaction) spawnBurst(data.event.reaction, data.event.handle, data.event.id);
          appendUnique(data.event);
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        if (disposed) return;
        setWsStatus("reconnecting");
        const delay = Math.min(8000, 600 * Math.pow(1.6, attempt));
        attempt += 1;
        timer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      if (wsRef.current) { try { wsRef.current.close(); } catch (_) {} wsRef.current = null; }
    };
  }, [roomId]);

  uew2(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages.length, chatOpen]);

  const sendSocket = (payload) => {
    const encoded = JSON.stringify(payload);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(encoded);
    } else {
      pendingRef.current.push(encoded);
    }
  };

  const emitPlaybackSync = (overrides = {}) => {
    if (!syncWatchRef.current || isApplyingRemoteSyncRef.current) return;
    const cur = livePlaybackRef.current;
    const nextPlaying = typeof overrides.playing === "boolean" ? overrides.playing : cur.playing;
    const nextT = typeof overrides.t === "number" ? overrides.t : cur.t;
    const nextMuted = typeof overrides.muted === "boolean" ? overrides.muted : cur.muted;
    const nextVol = typeof overrides.volume === "number" ? overrides.volume : cur.volume;
    const pctVal = Math.max(0, Math.min(100, Number(((nextT / TR_DUR) * 100).toFixed(2))));
    sendSocket({
      type: "playback:sync",
      roomId,
      playing: nextPlaying,
      progress: pctVal,
      muted: nextMuted,
      volume: Number(nextVol.toFixed(2)),
    });
  };

  const persistWatchProgress = (secVal) => {
    if (window.recordWatchActivity && secVal > 0) {
      const estDur = 5400;
      const mappedT = Math.round((secVal / TR_DUR) * estDur);
      window.recordWatchActivity(film.id, mappedT, estDur);
    }
  };

  const handleTogglePlay = () => {
    const nextPlaying = !livePlaybackRef.current.playing;
    setPlaying(nextPlaying);
    emitPlaybackSync({ playing: nextPlaying });
    persistWatchProgress(livePlaybackRef.current.t);
  };

  const handleSeek = (nextSec) => {
    const clamped = Math.max(0, Math.min(TR_DUR, Math.round(nextSec)));
    setT(clamped);
    emitPlaybackSync({ t: clamped });
    persistWatchProgress(clamped);
  };

  const handleToggleMute = () => {
    const nextMuted = !livePlaybackRef.current.muted;
    setMuted(nextMuted);
    emitPlaybackSync({ muted: nextMuted });
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
    if (nextOn && latestRoomPlaybackRef.current) {
      lastRemoteSeqRef.current = 0;
      applyRemotePlayback(latestRoomPlaybackRef.current);
    }
  };

  uew2(() => {
    if (!playing) return;
    const iv = setInterval(() => setT(v => {
      if (v >= TR_DUR) { setPlaying(false); return TR_DUR; }
      return v + 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [playing]);

  uew2(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose();
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " ") { e.preventDefault(); handleTogglePlay(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const sendChat = (e) => {
    e.preventDefault();
    const clean = chatInput.trim();
    if (!clean) return;
    const msgId = `msg_${identity.userId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const tc = fmtT(t);
    appendUnique({
      id: msgId,
      roomId,
      userId: identity.userId,
      handle: identity.handle,
      color: identity.color,
      kind: "chat",
      text: clean,
      timecode: tc,
      createdAt: Date.now(),
    });
    sendSocket({ type: "chat:send", id: msgId, roomId, text: clean, timecode: tc });
    setChatInput("");
  };

  const sendReaction = (reactionKey) => {
    const rxId = `rx_${identity.userId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const tc = fmtT(t);
    spawnBurst(reactionKey, identity.handle, rxId);
    setReactionCounts(prev => ({ ...prev, [reactionKey]: (prev[reactionKey] || 0) + 1 }));
    const labels = { applause: "applauded", cinema: "marked pure cinema", fire: "loved this moment", shock: "gasped", heartbreak: "felt that cut" };
    appendUnique({
      id: rxId,
      roomId,
      userId: identity.userId,
      handle: identity.handle,
      color: identity.color,
      kind: "reaction",
      reaction: reactionKey,
      text: labels[reactionKey] || "reacted",
      timecode: tc,
      createdAt: Date.now(),
    });
    sendSocket({ type: "reaction:send", id: rxId, roomId, reaction: reactionKey, timecode: tc });
  };

  const pct = (t / TR_DUR) * 100;
  const watcherCount = Math.max(participants.length, wsStatus === "connected" ? 1 : 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,.88)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5%",
    }} onClick={onClose}>
      <div
        className="pm-trailer-shell"
        data-chat-open={chatOpen ? "true" : "false"}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: tkc("black"), alignSelf: "center" }}>
          <FrameThumb kind={film.thumb} usePhoto/>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,.6) 100%)" }}/>
          <div style={{ position: "absolute", left: 20, top: 18, right: 20, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", zIndex: 3 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
              <span className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".16em", color: "var(--c-amber)" }}>SCREENING</span>
              <span className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".16em", color: "rgba(255,255,255,.78)" }}>{film.title.toUpperCase()}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                aria-pressed={syncWatch}
                onClick={handleToggleSyncWatch}
                className="btn-ghost"
                title="Keep playback position, play/pause, and volume synchronized across everyone in this room"
                style={{
                  height: 30, padding: "0 10px", fontSize: "0.68rem", fontFamily: "var(--f-mono)", letterSpacing: ".1em", textTransform: "uppercase",
                  color: syncWatch ? "var(--c-ink)" : "var(--c-ink-3)",
                  background: syncWatch ? "rgba(var(--accent-rgb),.22)" : "rgba(0,0,0,.55)",
                  border: `1px solid ${syncWatch ? "var(--c-amber)" : "rgba(255,255,255,.2)"}`,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <Icon name="refresh" size={12}/>
                <span>Sync Watch: {syncWatch ? "ON" : "OFF"}</span>
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(v => !v)}
                className="btn-ghost"
                style={{
                  height: 30, padding: "0 10px", fontSize: "0.68rem", fontFamily: "var(--f-mono)", letterSpacing: ".1em", textTransform: "uppercase",
                  color: chatOpen ? "var(--c-ink)" : "var(--c-ink-2)",
                  background: chatOpen ? "rgba(var(--accent-rgb),.18)" : "rgba(0,0,0,.55)",
                  border: `1px solid ${chatOpen ? "var(--c-amber)" : "rgba(255,255,255,.2)"}`,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <Icon name="chat" size={12}/>
                <span>Chat · {watcherCount}</span>
              </button>
              <button onClick={onClose} aria-label="Close" title="Close" className="btn-ghost btn-icon" style={{ width: 30, height: 30, color: tkc("white"), background: "rgba(0,0,0,.55)", border: "1px solid rgba(255,255,255,.2)" }}>
                <Icon name="x" size={15}/>
              </button>
            </div>
          </div>

          {bursts.length > 0 && (
            <div aria-hidden="true" style={{ position: "absolute", bottom: 68, right: 24, zIndex: 3, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, pointerEvents: "none" }}>
              {bursts.map(b => {
                const rxMeta = TR_REACTIONS.find(r => r.key === b.reaction);
                return (
                  <div key={b.id} className="cina-reaction-burst" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 10px", background: "rgba(10,10,13,.84)",
                    border: "1px solid rgba(var(--accent-rgb),.45)", color: "var(--c-ink)",
                    fontSize: "0.72rem", marginRight: Math.max(0, b.offsetX + 16),
                  }}>
                    <Icon name={rxMeta?.icon || "spark"} size={12}/>
                    <span style={{ fontWeight: 600 }}>{b.handle}</span>
                    <span className="t-mono" style={{ fontSize: "0.62rem", color: "var(--c-amber)", textTransform: "uppercase" }}>{rxMeta?.label || b.reaction}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button onClick={handleTogglePlay} aria-label={playing ? "Pause trailer" : "Play trailer"} title={playing ? "Pause" : "Play"} className="btn-ghost btn-icon" style={{
              width: 84, height: 84, borderRadius: "50%", background: "rgba(0,0,0,.5)",
              border: "1px solid rgba(255,255,255,.3)", color: tkc("white"),
              opacity: playing ? 0 : 1, transition: "opacity .3s ease",
            }}>
              <Icon name={playing ? "pause" : "play"} size={28}/>
            </button>
          </div>
          <div style={{
            position: "absolute", left: 20, right: 20, bottom: 16,
            display: "flex", alignItems: "center", gap: 10, zIndex: 3, flexWrap: "wrap",
            background: "rgba(0,0,0,.55)", border: "1px solid rgba(255,255,255,.12)", padding: "8px 12px",
          }}>
            <button
              type="button"
              onClick={handleTogglePlay}
              className="btn-ghost"
              style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.66rem", fontFamily: "var(--f-mono)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--c-ink)", border: "1px solid rgba(255,255,255,.18)" }}
            >
              <Icon name={playing ? "pause" : "play"} size={11}/>
              <span>{playing ? "Pause" : "Play"}</span>
            </button>
            <span className="t-mono t-num" style={{ fontSize: "var(--fs-label)", color: "rgba(255,255,255,.85)" }}>{fmtT(t)} / {fmtT(TR_DUR)}</span>
            <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleSeek(((e.clientX - r.left) / r.width) * TR_DUR); }}
              style={{ flex: 1, minWidth: 80, height: 4, background: "rgba(255,255,255,.22)", cursor: "pointer" }}>
              <div style={{ height: "100%", width: pct + "%", background: "var(--c-amber)" }}/>
            </div>
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="btn-ghost"
              style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.66rem", fontFamily: "var(--f-mono)", color: "var(--c-ink)", border: "1px solid rgba(255,255,255,.18)" }}
            >
              <Icon name={muted ? "mute" : "vol"} size={12}/>
              <span className="t-num">{muted ? "0%" : `${Math.round(volume * 100)}%`}</span>
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Screening volume"
              style={{ width: 68, accentColor: "var(--c-amber)", cursor: "pointer" }}
            />
            {syncWatch && (
              <span className="t-mono" style={{ fontSize: "0.6rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--c-amber)" }}>
                {syncLeader ? `Sync · ${syncLeader}` : "Sync Active"}
              </span>
            )}
          </div>
        </div>

        {chatOpen && (
          <aside aria-label="Screening Chat" className="pm-trailer-chat">
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--c-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div className="t-mono" style={{ fontSize: "0.62rem", letterSpacing: ".16em", color: "var(--c-amber)", textTransform: "uppercase" }}>Screening Chat</div>
                <div className="t-display" style={{ fontStyle: "italic", fontSize: "1.05rem", color: "var(--c-ink)" }}>Watch With Friends</div>
              </div>
              <button
                type="button"
                onClick={() => { onClose(); navigate("/party/" + film.id); }}
                className="btn-ghost"
                style={{ height: 28, padding: "0 8px", fontSize: "0.64rem", fontFamily: "var(--f-mono)", letterSpacing: ".08em", textTransform: "uppercase", border: "1px solid var(--c-line-2)" }}
              >
                Full Room
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", borderBottom: "1px solid var(--c-line)", background: "var(--c-bg)" }}>
              {TR_REACTIONS.map((rx, idx) => {
                const count = reactionCounts[rx.key] || 0;
                return (
                  <button
                    key={rx.key}
                    type="button"
                    onClick={() => sendReaction(rx.key)}
                    title={`Send ${rx.label} reaction`}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                      padding: "8px 2px", background: "transparent", border: "none",
                      borderLeft: idx > 0 ? "1px solid var(--c-line)" : "none",
                      color: "var(--c-ink-2)", cursor: "pointer",
                    }}
                  >
                    <Icon name={rx.icon} size={13}/>
                    <span className="t-mono t-num" style={{ fontSize: "0.58rem", textTransform: "uppercase" }}>{count > 0 ? count : rx.label}</span>
                  </button>
                );
              })}
            </div>

            <div ref={chatScrollRef} style={{ flex: 1, minHeight: "12rem", overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ margin: "auto 0", textAlign: "center", color: "var(--c-ink-4)", fontSize: "0.82rem", padding: "24px 8px" }}>
                  No notes yet. Send a message or live reaction while watching.
                </div>
              ) : (
                messages.map(m => {
                  const me = m.userId === identity.userId;
                  if (m.kind === "reaction") {
                    const rxMeta = TR_REACTIONS.find(r => r.key === m.reaction);
                    return (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, padding: "5px 8px", background: "rgba(var(--accent-rgb),.07)", borderLeft: "2px solid var(--c-amber)", fontSize: "0.73rem", color: "var(--c-ink-2)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                          <Icon name={rxMeta?.icon || "spark"} size={11}/>
                          <strong style={{ color: "var(--c-ink)" }}>{me ? `${m.handle} (you)` : m.handle}</strong>
                          <span style={{ color: "var(--c-ink-3)" }}>{m.text}</span>
                        </span>
                        {m.timecode && <span className="t-mono t-num" style={{ fontSize: "0.6rem", color: "var(--c-ink-4)" }}>@{m.timecode}</span>}
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} style={{ borderBottom: "1px solid var(--c-line)", paddingBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: me ? "var(--c-amber)" : "var(--c-ink)" }}>
                          {me ? `${m.handle} (you)` : m.handle}
                        </span>
                        {m.timecode && <span className="t-mono t-num" style={{ fontSize: "0.6rem", color: "var(--c-ink-4)" }}>@{m.timecode}</span>}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--c-ink-2)", lineHeight: 1.4, marginTop: 2, overflowWrap: "break-word" }}>{m.text}</div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={sendChat} style={{ display: "flex", gap: 6, padding: "10px 12px", borderTop: "1px solid var(--c-line)", background: "var(--c-bg)" }}>
              <input
                value={chatInput}
                maxLength={480}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Message screening room…"
                aria-label="Send a message to Screening Chat"
                style={{ flex: 1, minWidth: 0, height: 34, background: "var(--c-panel)", border: "1px solid var(--c-line-2)", padding: "0 10px", color: "var(--c-ink)", fontSize: "0.82rem" }}
              />
              <button
                type="submit"
                style={{ height: 34, padding: "0 12px", background: "var(--c-amber)", border: "none", color: "var(--c-on-amber)", fontFamily: "var(--f-mono)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <span>Send</span>
                <Icon name="send" size={12}/>
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Pick-how-to-watch sheet ─────────────────────────────────────────────
function UnlockSheet({ film, onPick, onClose }) {
  const subPrice = getCreator(film.creatorId)?.sub;
  const opts = [];
  if (film.buy)              opts.push({ id: "buy",  label: "Buy",                                 price: `$${film.buy}`,    note: "Own forever, watch on any device" });
  if (film.rent)             opts.push({ id: "rent", label: "Rent",                                price: `$${film.rent}`,   note: "48 hours from first play" });
  if (film.creatorId)        opts.push({ id: "sub",  label: `Subscribe to ${film.creator}`,        price: `$${subPrice}/mo`, note: "Watch every film from this creator" });
  if (film.nftPremiere)      opts.push({ id: "nft",  label: "Become a Producer",                   price: "Premiere window", note: `${film.premiereHrs}h early access for producers` });
  if (film.free && film.ads) opts.push({ id: "free", label: "Watch free",                          price: "Free",            note: "Includes 4 ad breaks" });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,.78)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        width: "min(540px, 100%)", background: "var(--c-panel)",
        border: "1px solid var(--c-line)", borderRadius: "var(--r-2)", overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--c-line)" }}>
          <div className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".16em", color: "var(--c-ink-3)" }}>HOW TO WATCH</div>
          <div className="t-display" style={{ fontStyle: "italic", fontSize: "var(--fs-title)", marginTop: 4 }}>{film.title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {opts.map((o, i) => (
            <button
              key={o.id}
              onClick={() => onPick(o)}
              className="btn-ghost"
              style={{
                padding: "16px 24px", height: "auto",
                borderTop: i === 0 ? "none" : "1px solid var(--c-line)",
                display: "flex", alignItems: "center", gap: 16,
                justifyContent: "flex-start", textAlign: "left", borderRadius: 0,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--fs-body)", color: "var(--c-ink)", fontWeight: 500 }}>{o.label}</div>
                <div style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-3)", marginTop: 2 }}>{o.note}</div>
              </div>
              <div className="t-num" style={{ fontSize: "var(--fs-body)", color: "var(--c-amber)", fontWeight: 600, fontFamily: "var(--f-display)" }}>{o.price}</div>
              <Icon name="chev-r" size={12}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Watch page v3 ──────────────────────────────────────────────────────
function WatchPage({ filmId, episodeNum }) {
  const film = getFilm(filmId);
  const [kid] = useKidMode();
  const rating = computeRating(film);
  const [unlocked, setUnlocked] = usw2(() => window.libraryOwns ? window.libraryOwns(film.id) : false);
  const [sheetOpen, setSheetOpen] = usw2(false);
  const [trailerOpen, setTrailerOpen] = usw2(false);
  const isMobile = useIsMobile();

  if (!film) return <div style={{ padding: 56, color: "var(--c-ink-3)" }}>Film not found.</div>;

  const handlePick = (opt) => {
    if (opt.id === "nft") { navigate(`/nft/${film.nft}`); return; }
    if (opt.id === "free") {
      setUnlocked(true);
      setSheetOpen(false);
      if (window.libraryRecord) window.libraryRecord({ filmId: film.id, kind: "free", price: 0 });
      toast({ title: "PLAYING", text: `${film.title} · with ads`, kind: "good" });
      return;
    }
    // Rent / Buy / Sub — all unified through the pay drawer
    setSheetOpen(false);
    if (window.openPay) {
      const subPrice = getCreator(film.creatorId)?.sub || 7.99;
      const cfg = {
        rent: { kind: "rent", priceUSD: film.rent, title: `Rent ${film.title}`, subtitle: `${film.year} · ${film.runtime}`,
          perks: ["48 hours from first play", "Stream in 4K HDR", "Re-rent any time"] },
        buy:  { kind: "buy",  priceUSD: film.buy,  title: `Buy ${film.title}`,  subtitle: `${film.year} · ${film.runtime}`,
          perks: ["Yours forever · stream on any device", "Includes director's cut + commentary", "Download for offline viewing"] },
        sub:  { kind: "sub",  priceUSD: subPrice, recurring: "month", title: `Subscribe to ${film.creator}`, subtitle: "Every film from this creator",
          perks: ["Every film this creator publishes", "24h early access on new drops", "Behind-the-scenes vault + dailies", "Cancel anytime"] },
      }[opt.id];
      window.openPay({
        ...cfg, accent: film.color || tkc("amber"),
        image: { kind: film.thumb, color: film.color },
        ticker: film.id,
        onConfirm: () => {
          setUnlocked(true);
          if (window.libraryRecord) window.libraryRecord({ filmId: film.id, kind: opt.id, price: cfg && cfg.price });
        },
      });
    }
  };

  const creator = getCreator(film.creatorId);
  const nft = NFT_PROJECTS[film.nft];
  const blocked = kid && rating.blocked;

  return (
    <div style={{ background: "var(--c-bg)" }}>
      {trailerOpen && <TrailerModal film={film} onClose={() => setTrailerOpen(false)}/>}
      {sheetOpen && <UnlockSheet film={film} onPick={handlePick} onClose={() => setSheetOpen(false)}/>}

      {/* Player slot — only when unlocked */}
      {unlocked && !blocked && (
        <div id="player-anchor" style={{ background: tkc("black") }}>
          <div style={{ maxWidth: "var(--w-page)", margin: "0 auto" }}>
            <Player film={film}/>
          </div>
        </div>
      )}

      {/* Hero — series-style full-bleed */}
      {!unlocked && (
        <section style={{
          position: "relative",
          height: isMobile ? "min(72vh, 560px)" : "min(64vh, 620px)",
          minHeight: isMobile ? 380 : 460,
          background: film.color, overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <FrameThumb kind={film.thumb} usePhoto/>
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,8,10,.95) 0%, rgba(8,8,10,.7) 40%, rgba(8,8,10,.2) 70%, transparent 100%)" }}/>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "60%", background: "linear-gradient(to top, var(--c-bg) 0%, rgba(8,8,10,.6) 50%, transparent 100%)" }}/>

          <div style={{
            position: "absolute", inset: 0,
            padding: isMobile ? "60px 20px 100px" : "60px var(--gutter) 80px",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            maxWidth: isMobile ? "100%" : 760,
          }}>
            {typeof topTrophy === "function" && topTrophy(film.id) && typeof WinnerTrophy === "function" && (
              <div style={{ marginBottom: 14 }}>
                <WinnerTrophy variant="laurel" award={topTrophy(film.id).award} edition={topTrophy(film.id).edition} date={topTrophy(film.id).date} color={topTrophy(film.id).color}/>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span className="t-mono" style={{
                fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em", fontWeight: 600,
                padding: "4px 8px", border: "1px solid rgba(var(--accent-rgb),.5)", borderRadius: "var(--r-1)",
                background: "rgba(0,0,0,.4)", backdropFilter: "blur(8px)",
              }}>FILM · CINA ORIGINAL</span>
              <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-2)", letterSpacing: ".16em" }}>
                {film.year} · {film.runtime} · {film.genre.join(" / ").toUpperCase()}
              </span>
            </div>

            <h1 className="t-display" style={{
              fontStyle: "italic",
              fontSize: "clamp(56px, 7vw, 104px)", lineHeight: 0.95,
              margin: "0 0 18px", letterSpacing: "-0.02em",
              textShadow: "0 4px 30px rgba(0,0,0,.6)",
            }}>{film.title}</h1>

            <p style={{
              fontSize: "var(--fs-lead)", lineHeight: 1.5, color: "var(--c-ink)",
              margin: "0 0 8px", maxWidth: 580, textShadow: "0 2px 12px rgba(0,0,0,.7)",
            }}>{film.synopsis}</p>

            <div style={{ display: "flex", gap: 14, fontSize: "var(--fs-body)", color: "var(--c-ink-2)", marginBottom: 28, alignItems: "center" }}>
              <span className="t-mono">{film.creator}</span>
              <span style={{ width: 3, height: 3, background: "var(--c-ink-3)", borderRadius: "50%" }}/>
              <span style={{ color: "var(--c-amber)" }}>★ {film.rating} <span style={{ color: "var(--c-ink-3)" }}>({fmtCount(film.ratings)})</span></span>
              <span style={{ width: 3, height: 3, background: "var(--c-ink-3)", borderRadius: "50%" }}/>
              <span>{fmtViews(film.views)} viewers</span>
              <span style={{ width: 3, height: 3, background: "var(--c-ink-3)", borderRadius: "50%" }}/>
              <RatingBadge rating={rating.rating} size="sm"/>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                style={{ height: 46, padding: "0 24px", fontSize: "var(--fs-body)", gap: 8 }}
                onClick={() => setSheetOpen(true)}
              >
                <Icon name="play" size={14}/>
                {film.buy ? `Watch — $${film.buy}` : film.rent ? `Rent — $${film.rent}` : "Watch now"}
              </button>
              <button className="btn" style={{ height: 46, padding: "0 18px", fontSize: "var(--fs-body)", gap: 8 }} onClick={() => setTrailerOpen(true)}>
                <Icon name="play" size={12}/>
                Trailer
              </button>
              <button className="btn" style={{ height: 46, padding: "0 18px", fontSize: "var(--fs-body)", gap: 8, color: isOnWatchlist(film.id) ? "var(--c-amber)" : "var(--c-ink)", borderColor: isOnWatchlist(film.id) ? "rgba(var(--accent-rgb),.4)" : "var(--c-line-2)" }} onClick={() => toggleWatchlist(film.id)}>
                <Icon name={isOnWatchlist(film.id) ? "heart" : "plus"} size={13}/>
                {isOnWatchlist(film.id) ? "On watchlist" : "Watchlist"}
              </button>
              {film.nftPremiere && (
                <button
                  className="btn"
                  style={{
                    height: 46, padding: "0 18px", fontSize: "var(--fs-body)", gap: 8,
                    background: "rgba(var(--accent-rgb),.08)", borderColor: "rgba(var(--accent-rgb),.4)", color:  "var(--c-amber)",
                  }}
                  onClick={() => navigate(`/nft/${film.nft}`)}
                >
                  <Icon name="ticket" size={13}/>
                  Invest · Producer
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Body */}
      <div style={{ padding: isMobile ? "28px 20px 100px" : "56px var(--gutter) 96px", maxWidth: "var(--w-page)", margin: "0 auto" }}>
        {blocked && unlocked && (
          <div style={{ maxWidth: 480, margin: "40px auto" }}><KidLockCard film={film}/></div>
        )}

        {/* Two-column body, mirrors series page */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: isMobile ? 24 : 48 }}>
          {/* Left — synopsis, cast, reviews */}
          <section>
            {/* About */}
            <div style={{ marginBottom: 64, paddingBottom: 36, borderBottom: "1px solid var(--c-line)" }}>
              <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em", marginBottom: 14, fontWeight: 600 }}>
                01 · THE FILM
              </div>
              <h2 className="t-display" style={{ fontStyle: "italic", fontSize: "var(--fs-head)", margin: "0 0 22px", letterSpacing: "-0.02em", fontWeight: 400, lineHeight: 1.05, maxWidth: "20ch" }}>
                {film.synopsis.split(".")[0]}.
              </h2>
              <p style={{ fontSize: "var(--fs-lead)", lineHeight: 1.65, color: "var(--c-ink-2)", margin: 0, maxWidth: 640, textWrap: "pretty" }}>
                {film.synopsis.split(".").slice(1).join(".").trim() || film.synopsis}
              </p>
              {film.moods && (
                <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
                  {film.moods.map(m => (
                    <span key={m} style={{
                      padding: "5px 12px", border: "1px solid var(--c-line-2)",
                      borderRadius: 999, fontSize: "var(--fs-label)", color: "var(--c-ink-2)",
                      fontFamily: "var(--f-mono)", letterSpacing: ".08em",
                    }}>{m}</span>
                  ))}
                </div>
              )}
            </div>

            {/* The programmer's argument — the house's editorial POV, above the maker's */}
            <FromTheProgrammer film={film}/>

            {/* Director's voice on this film */}
            {creator && <FromTheDirector film={film} creator={creator}/>}

            {/* Cast */}
            <section style={{ marginBottom: 56 }}>
              <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em", marginBottom: 14, fontWeight: 600 }}>
                03 · CAST
              </div>
              <FilmCastRow filmId={film.id}/>
            </section>

            {/* Reviews */}
            <section style={{ marginBottom: 56 }}>
              <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em", marginBottom: 14, fontWeight: 600 }}>
                04 · REVIEWS
              </div>
              {window.ReviewsAndRatings ? <ReviewsAndRatings film={film}/> : <ReviewsList film={film}/>}
            </section>

            {/* More from creator */}
            {creator && (
              <section>
                <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em", marginBottom: 14, fontWeight: 600 }}>
                  05 · MORE FROM THIS DIRECTOR
                </div>
                <h3 className="t-display" style={{ fontStyle: "italic", fontSize: "var(--fs-title)", margin: "0 0 22px", letterSpacing: "-0.01em", fontWeight: 400 }}>
                  Every {creator.name} film, in chronological order.
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
                  {CATALOG.filter(f => f.creatorId === creator.id && f.id !== film.id).slice(0, 4).map(f => (
                    typeof FilmCard === "function"
                      ? <FilmCard key={f.id} film={f} fluid/>
                      : null
                  ))}
                </div>
              </section>
            )}
          </section>

          {/* Right rail */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 24, alignSelf: "flex-start" }}>
            {/* Studio + Director — one shared card across film & series pages */}
            {creator && (window.DirectorStudioCard
              ? <DirectorStudioCard film={film}/>
              : null)}

            {/* Made in Cina Studio — the round-trip back to where it was made */}
            {film.publishedByYou && film.studioProjectId && (
              <div style={{
                padding: 18,
                background: "linear-gradient(180deg, rgba(106,163,122,.07) 0%, var(--c-panel) 80%)",
                border: "1px solid rgba(106,163,122,.32)", borderRadius: "var(--r-2)",
              }}>
                <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-good)", letterSpacing: ".16em", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-good)", boxShadow: "0 0 6px var(--c-good)" }}/>
                  MADE IN CINA STUDIO
                </div>
                <div className="t-display" style={{ fontStyle: "italic", fontSize: "var(--fs-lead)", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  You shipped this film.
                </div>
                <div style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-2)", lineHeight: 1.5, marginBottom: 14 }}>
                  Mastered in Studio{film.studioCode ? ` · ${film.studioCode}` : ""} and premiered straight to Watch. Track its first views and royalties back in the editor.
                </div>
                <button
                  className="btn"
                  style={{ width: "100%", height: 34, justifyContent: "center", fontSize: "var(--fs-body)", background: "rgba(106,163,122,.1)", borderColor: "rgba(106,163,122,.4)", color: "var(--c-good)" }}
                  onClick={() => { try { localStorage.setItem("cina:studio-open", film.studioProjectId); } catch {} window.location.href = "Cina.html"; }}
                >
                  Open in Studio →
                </button>
              </div>
            )}

            {/* NFT */}
            {nft && (
              <div style={{
                padding: 18,
                background: "linear-gradient(180deg, rgba(var(--accent-rgb),.06) 0%, var(--c-panel) 80%)",
                border: "1px solid rgba(var(--accent-rgb),.3)", borderRadius: "var(--r-2)",
              }}>
                <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em", marginBottom: 6 }}>
                  CO-FINANCE
                </div>
                <div className="t-display" style={{ fontStyle: "italic", fontSize: "var(--fs-lead)", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  Own a piece of {film.title}
                </div>
                <div style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-2)", lineHeight: 1.5, marginBottom: 14 }}>
                  Holders get the premiere window, BTS access, and a share of revenue.
                </div>
                <div style={{ height: 4, background: "var(--c-panel-2)", borderRadius: "var(--r-1)", overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ width: `${Math.min(100, (nft.raised / nft.goal) * 100)}%`, height: "100%", background: "var(--c-amber)" }}/>
                </div>
                <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-3)", letterSpacing: ".08em", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>{fmtUSD(nft.raised)} of {fmtUSD(nft.goal)}</span>
                  <span>{nft.daysLeft}d left</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", height: 34, justifyContent: "center", fontSize: "var(--fs-body)" }}
                  onClick={() => navigate(`/nft/${nft.id}`)}
                >
                  <Icon name="ticket" size={11}/>
                  View Producer Pass — {nft.backers} backers
                </button>
              </div>
            )}

            {/* Details */}
            <div style={{ padding: 16, background: "var(--c-panel)", border: "1px solid var(--c-line)", borderRadius: "var(--r-2)" }}>
              <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-3)", letterSpacing: ".16em", marginBottom: 10 }}>DETAILS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "var(--fs-body)" }}>
                <Detail k="Director" v={film.creator}/>
                <Detail k="Runtime" v={film.runtime}/>
                <Detail k="Year" v={film.year}/>
                <Detail k="Genre" v={film.genre.join(", ")}/>
                <Detail k="Rating" v={rating.rating}/>
                {film.tags && <Detail k="Tags" v={film.tags.join(", ")}/>}
              </div>
            </div>

            {/* Share */}
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn" style={{ flex: 1, height: 32, justifyContent: "center", fontSize: "var(--fs-label)" }} onClick={() => cinaCopyShareLink(film)}>
                <Icon name="share" size={11}/> Share
              </button>
              <button className="btn" style={{ flex: 1, height: 32, justifyContent: "center", fontSize: "var(--fs-label)" }} onClick={async () => {
                const ok = await (window.cinaConfirm ? window.cinaConfirm({
                  kicker: "Report this title",
                  title: "Flag “" + film.title + "” for review?",
                  body: "A programmer reads every report. Tell us what's wrong and we'll look at the print, the rating, or the rights.",
                  confirmLabel: "Send report",
                }) : Promise.resolve(false));
                if (ok && window.toast) toast({ title: "REPORT SENT", text: "A programmer will review " + film.title + ".", kind: "good" });
              }}>
                <Icon name="flag" size={11}/> Report
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* More like this — bottom scroller, same rail as the homepage */}
      {typeof Shelf === "function" && (() => {
        const rel = CATALOG.filter(f => f.id !== film.id && (f.creatorId === film.creatorId || (f.genre || []).some(g => (film.genre || []).includes(g)))).slice(0, 12).map(f => f.id);
        return rel.length ? (
          <div style={{ borderTop: "1px solid var(--c-line)", paddingBottom: isMobile ? 90 : 24 }}>
            <Shelf shelf={{ id: "more-like-" + film.id, title: "More like this", filmIds: rel }} size="sm"/>
          </div>
        ) : null;
      })()}

      {/* Mobile sticky Watch bar */}
      {isMobile && !unlocked && !blocked && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
          background: "rgba(8,8,10,.96)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderTop: "1px solid var(--c-line)",
          padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--f-display)", fontStyle: "italic",
              fontSize: "var(--fs-lead)", color: "var(--c-ink)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{film.title}</div>
            <div style={{
              fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)",
              color: "var(--c-ink-3)", letterSpacing: ".08em", marginTop: 2,
            }}>{film.year} · {film.runtime}</div>
          </div>
          <button
            className="btn btn-primary"
            style={{ height: 44, padding: "0 20px", flexShrink: 0, fontSize: "var(--fs-body)", gap: 8 }}
            onClick={() => setSheetOpen(true)}
          >
            <Icon name="play" size={13}/>
            Watch
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Director's voice — handwritten notes from filmmakers per film ──────
// One paragraph per film. Real names, real tones. When a film has no
// specific note, we fall back to the director's tagline + a generic
// "watch the way I cut it" sentence.
const DIRECTOR_NOTES = {
  ll: "I shot the first three episodes with one light. The fourth one needed two — a red safelight and the streetlamp through the window. I think it's the only honest light in the whole season. Don't watch it during the day.",
  marauder: "Eight episodes. Three of them happen at the bottom of an air recycler. The cinematographer threatened to quit twice. The script supervisor only quit once. I love this crew.",
  longhall: "My father owned a diner in Reno for twenty-one years. He died on a Wednesday. Episode one is the day they put the sign up. The other nine episodes are the year that follows.",
  bluejay: "A short about how grief tastes in a kitchen. Twenty-eight minutes. We didn't add a score because the kitchen is already loud.",
  frequency: "I have wanted to make a film about radio for nine years. This is that film. The signal is real — I recorded it off a dead transmitter in Nebraska. Listen with headphones.",
  carrion: "Patient horror. Patient meaning: nothing happens for forty-two minutes and then everything happens. I do not apologize for the forty-two minutes.",
  thefence: "Westerns get the dirt right but the sisters wrong. I tried to do both. The land is West Texas, the sisters are mine.",
  swallows: "A diplomat finds two unsent letters in her grandfather's coat. The whole film is what she does with the second one. We shot it in November when the light is honest.",
  haul: "Two drivers, one route, forty-nine hours. I built the dashboard out of a 1994 Volvo. The engine sound is real.",
  after: "I had nine days. I shot the first beat in the airport at 4am and the last one in a kitchen in Brooklyn. The middle is whatever fit in between. It is shorter than I wanted and I think that is the right shape.",
  cellar: "A mystery in three small rooms. The fourth room is in your head. I made the score myself; it is bad on purpose.",
  kindling: "Some films are about people who set fires. This is one of them. We did not romanticize anything.",
  pelt: "Folk horror that respects the folk. My grandmother helped with the dialect coaching. She is in the credits as 'consultant — patience.'",
  ghosting: "A romantic comedy that gets it wrong on purpose. I love everyone in this cast. Watch episode three with someone you used to text every day.",
  salt: "My only film with no dialogue. Sixty-three minutes. The audience screening was the longest of my career.",
};

function FromTheDirector({ film, creator }) {
  if (!film || !creator) return null;
  const note = DIRECTOR_NOTES[film.id] || `${creator.tagline} Watch this one the way I cut it — patient, quiet, then loud.`;
  const initials = creator.name.split(" ").map(p => p[0]).join("");

  // Loop hook — find this director's NEXT open project to back (not this film).
  const otherFilms = window.CATALOG?.filter(f => f.creatorId === creator.id && f.id !== film.id) || [];
  const openNft = otherFilms.map(f => ({ f, nft: window.NFT_PROJECTS?.[f.nft] })).find(x => x.nft && x.nft.daysLeft > 0);
  const nextSubject = openNft?.nft || null;
  return (
    <section style={{
      marginBottom: 56, paddingBottom: 40,
      borderBottom: "1px solid var(--c-line)",
    }}>
      <div className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em", marginBottom: 14, fontWeight: 600 }}>
        02 · FROM THE DIRECTOR
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px",
        gap: 36, alignItems: "flex-start",
      }}>
        <div>
          <p style={{
            margin: 0,
            fontFamily: "var(--f-display)", fontStyle: "italic",
            fontSize: "var(--fs-title)", lineHeight: 1.4,
            color: "var(--c-ink)", letterSpacing: "-0.01em",
            maxWidth: 680, textWrap: "pretty",
          }}>"{note}"</p>
          <div style={{
            display: "flex", alignItems: "center", gap: 14, marginTop: 22,
          }}>
            <button
              onClick={() => navigate(`/creator/${creator.id}`)}
              className="btn-ghost"
              style={{
                width: 44, height: 44, padding: 0, borderRadius: "50%",
                background: `linear-gradient(135deg, ${creator.color}, ${creator.bg || tkc("void")})`,
                border: `1px solid ${creator.accent || tkc("amber")}`,
                color: tkc("white"),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "var(--fs-lead)", fontWeight: 500,
                flexShrink: 0,
              }}>{initials}</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <button
                onClick={() => navigate(`/creator/${creator.id}`)}
                className="btn-ghost"
                style={{
                  padding: 0, height: "auto", background: "transparent",
                  fontFamily: "var(--f-display)", fontStyle: "italic",
                  fontSize: "var(--fs-lead)", color:  "var(--c-amber)",
                  letterSpacing: "-0.01em", textAlign: "left",
                }}>— {creator.name}</button>
              <div style={{
                fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)",
                color: "var(--c-ink-3)", letterSpacing: ".16em",
                textTransform: "uppercase", marginTop: 3,
              }}>Director · {film.year || creator.handle}</div>
            </div>
          </div>
        </div>
        {/* Side: tagline + follow */}
        <aside style={{
          padding: "16px 18px",
          background: "var(--c-panel)",
          border: "1px solid var(--c-line)",
          borderLeft: `2px solid ${creator.accent || tkc("amber")}`,
          borderRadius: "var(--r-2)",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div className="t-mono" style={{
            fontSize: "var(--fs-label)", color: "var(--c-ink-3)",
            letterSpacing: ".16em", textTransform: "uppercase",
          }}>SIGNATURE</div>
          <div style={{
            fontFamily: "var(--f-display)", fontStyle: "italic",
            fontSize: "var(--fs-lead)", color: "var(--c-ink)", lineHeight: 1.35,
            letterSpacing: "-0.01em",
          }}>{creator.tagline}</div>
          <div className="t-mono" style={{
            fontSize: "var(--fs-label)", color: "var(--c-ink-4)",
            letterSpacing: ".16em", textTransform: "uppercase",
            paddingTop: 8, borderTop: "1px solid var(--c-line)",
          }}>{creator.films} films · {fmtCount(creator.followers)} following</div>
          <button
            onClick={() => toggleFollow(creator.id)}
            className="btn"
            style={{
              width: "100%", height: 32, justifyContent: "center",
              fontSize: "var(--fs-label)", gap: 6,
              color: isFollowing(creator.id) ? "var(--c-amber)" : "var(--c-ink)",
              borderColor: isFollowing(creator.id) ? "rgba(var(--accent-rgb),.4)" : "var(--c-line-2)",
            }}>
            {isFollowing(creator.id) ? "✓ Following" : "+ Follow"}
          </button>
        </aside>
      </div>

      {/* Loop hook — back the director's next film */}
      {nextSubject && (
        <div style={{
          marginTop: 24, padding: "18px 22px",
          background: `linear-gradient(90deg, ${creator.color || tkc("amber")}10 0%, var(--c-panel) 70%)`,
          border: `1px solid ${creator.accent || "rgba(var(--accent-rgb),.35)"}55`,
          borderLeft: `2px solid ${creator.accent || tkc("amber")}`,
          borderRadius: "var(--r-2)",
          display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap",
        }}>
          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <div className="t-mono" style={{
              fontSize: "var(--fs-label)", color: creator.accent || tkc("amber"),
              letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700,
              marginBottom: 6,
            }}>WHAT'S NEXT FROM {creator.name.toUpperCase()}</div>
            <div className="t-display" style={{
              fontStyle: "italic", fontSize: "var(--fs-title)", color: "var(--c-ink)",
              lineHeight: 1.2, letterSpacing: "-0.01em",
            }}>
              Back <em style={{ color: "var(--c-amber)" }}>{nextSubject.title.split("·")[0].trim()}</em> — {nextSubject.daysLeft} days left to claim.
            </div>
            <div style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-3)", marginTop: 5 }}>
              {Math.round((nextSubject.raised / nextSubject.goal) * 100)}% raised · {nextSubject.backers} backers · {nextSubject.revShare}% revenue share to holders.
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { window.location.href = `Producers.html#project/${nextSubject.id}`; }}
            style={{ height: 38, padding: "0 18px", fontSize: "var(--fs-body)", gap: 8, flexShrink: 0 }}
          >
            <Icon name="ticket" size={11}/>
            Back it on Producers →
          </button>
        </div>
      )}
    </section>
  );
}

function Detail({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--c-ink-3)" }}>{k}</span>
      <span style={{ color: "var(--c-ink)", textAlign: "right" }}>{v}</span>
    </div>
  );
}

function ReviewsList({ film }) {
  const reviews = REVIEWS_FOR_LL || [];
  if (!reviews.length) return null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
        <h3 className="t-display" style={{ fontStyle: "italic", fontSize: "var(--fs-title)", margin: 0, letterSpacing: "-0.01em", fontWeight: 400 }}>
          Reviews
        </h3>
        <span style={{ fontSize: "var(--fs-body)", color: "var(--c-amber)" }}>★ {film.rating}</span>
        <span style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-3)" }}>· {fmtCount(reviews.length * 327)} ratings</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {reviews.slice(0, 4).map((r, i) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: "var(--fs-body)", color: "var(--c-ink)", fontWeight: 500 }}>{r.user}</span>
              {r.holder && (
                <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-amber)", letterSpacing: ".16em", padding: "1px 5px", border: "1px solid rgba(var(--accent-rgb),.3)", borderRadius: "var(--r-1)" }}>
                  HOLDER
                </span>
              )}
              <span style={{ color: "var(--c-amber)", fontSize: "var(--fs-body)" }}>{"★".repeat(r.rating || 5)}</span>
              <span style={{ flex: 1 }}/>
              <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)" }}>{r.when}</span>
            </div>
            <p style={{ fontSize: "var(--fs-body)", lineHeight: 1.55, color: "var(--c-ink-2)", margin: 0 }}>
              {r.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { WatchPage });
