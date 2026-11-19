// watch-room-match.jsx — Matched rooms, custom party storage & taste-print compatibility.
//
// Loaded after watch-taste.jsx, before watch-party.jsx and holder-rooms.jsx.

(function () {
  const { useMemo: umRM } = React;

  const RM_COLORS = { A: tkc("good"), B: tkc("bad"), C: tkc("cat-2") };
  const RM_WORDS  = { A: "MERCIFUL", B: "RUTHLESS", C: "CURIOUS" };
  const PARTY_STORE_KEY = "cina_custom_parties_v1";

  function rmHash(s) {
    let h = 0;
    for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
    return h;
  }

  // A room's temperament lean: real fork-ledger rows for the film first,
  // deterministic split otherwise. Returns { A, B, C } shares summing to 1.
  function roomLean(filmId) {
    const rows = (window.forkLedgerRead ? window.forkLedgerRead() : []).filter(r => r.filmId === filmId);
    const by = { A: 0, B: 0, C: 0 };
    rows.forEach(r => { if (by[r.letter] != null) by[r.letter]++; });
    const total = by.A + by.B + by.C;
    if (total >= 4) return { A: by.A / total, B: by.B / total, C: by.C / total, real: true };
    const h = rmHash(filmId || "ll");
    const a = 0.2 + ((h % 47) / 100);
    const b = (1 - a) * (0.35 + ((h >> 4) % 31) / 100);
    return { A: a, B: b, C: Math.max(0, 1 - a - b), real: false };
  }

  // Compatibility between the viewer's print and a room lean.
  function roomMatch(filmId) {
    const tp = window.computeTastePrint ? window.computeTastePrint() : null;
    if (!tp || !tp.forkTotal) return null;
    const lean = roomLean(filmId);
    const mine = { A: 0, B: 0, C: 0 };
    tp.temper.forEach(t => { mine[t.letter] = (t.pct || 0) / 100; });
    const overlap = Math.min(mine.A, lean.A) + Math.min(mine.B, lean.B) + Math.min(mine.C, lean.C);
    return { pct: Math.round(overlap * 100), lean, mine };
  }

  function rmDominant(lean) {
    const e = Object.entries({ A: lean.A, B: lean.B, C: lean.C }).sort((x, y) => y[1] - x[1]);
    const [letter, share] = e[0];
    const ratio = e[1][1] > 0 ? (share / e[1][1]) : 3;
    return { letter, share, ratio: Math.min(9.9, Math.round(ratio * 10) / 10) };
  }

  // ─── Persistent Custom Watch Parties Registry ─────────────────────────────
  function getCustomParties() {
    try {
      const raw = JSON.parse(localStorage.getItem(PARTY_STORE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (_) {
      return [];
    }
  }

  function saveCustomParty(entry) {
    try {
      const prev = getCustomParties();
      const next = [entry, ...prev.filter(p => p.roomSlug !== entry.roomSlug)].slice(0, 24);
      localStorage.setItem(PARTY_STORE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("cina:parties-updated"));
      return next;
    } catch (_) {
      return [];
    }
  }

  function deleteCustomParty(roomSlug) {
    try {
      const next = getCustomParties().filter(p => p.roomSlug !== roomSlug);
      localStorage.setItem(PARTY_STORE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("cina:parties-updated"));
      return next;
    } catch (_) {
      return [];
    }
  }

  function buildPartyRoute(filmId, opts = {}) {
    const qs = new URLSearchParams();
    if (opts.roomSlug) qs.set("room", opts.roomSlug);
    if (opts.name) qs.set("name", opts.name);
    if (opts.vis) qs.set("vis", opts.vis);
    const q = qs.toString();
    return `/party/${filmId || "ll"}${q ? `?${q}` : ""}`;
  }

  // ─── Architectural Badge for Room Cards (Zero Pill / Crisp 2px Edge) ──────
  function RoomMatchBadge({ filmId }) {
    const m = umRM(() => roomMatch(filmId), [filmId]);
    if (!m) return null;
    const good = m.pct >= 60;
    return (
      <span
        className="t-mono"
        title={`Room temperament vs your taste print — ${m.pct}% overlap in how you choose at forks`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.22rem 0.55rem",
          borderRadius: "1px",
          background: "rgba(10, 10, 12, .82)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: `1px solid ${good ? "rgba(var(--accent-rgb), .55)" : "rgba(255, 255, 255, .2)"}`,
          color: good ? "var(--c-amber)" : "var(--c-ink-2)",
          fontSize: "0.64rem",
          fontWeight: 600,
          letterSpacing: ".13em",
          textTransform: "uppercase",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {m.pct}% MATCH
      </span>
    );
  }

  // ─── Party Temperament Dossier Banner ─────────────────────────────────────
  function PartyLeanBanner({ film }) {
    const data = umRM(() => {
      const lean = roomLean(film.id);
      const dom = rmDominant(lean);
      const m = roomMatch(film.id);
      return { lean, dom, m };
    }, [film.id]);
    const { lean, dom, m } = data;
    const myDom = m && Object.entries(m.mine).sort((x, y) => y[1] - x[1])[0][0];
    const aligned = m && myDom === dom.letter;

    return (
      <div
        style={{
          width: "100%",
          padding: "1rem 1.25rem",
          border: "1px solid var(--c-line)",
          borderRadius: "2px",
          background: "var(--c-panel)",
          display: "flex",
          flexDirection: "column",
          gap: "0.65rem",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <span
            className="t-mono"
            style={{
              fontSize: "var(--fs-label)",
              letterSpacing: ".14em",
              color: RM_COLORS[dom.letter],
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Room Temperament · Leans {RM_WORDS[dom.letter]}{dom.ratio >= 1.5 ? ` ${dom.ratio}:1` : ""}
          </span>
          {m && (
            <span
              className="t-mono"
              style={{
                fontSize: "var(--fs-label)",
                letterSpacing: ".12em",
                color: "var(--c-ink-2)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {m.pct}% Taste Print Match · {aligned ? "Fork votes tend to align with you" : "Room dissents from your print"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", height: "4px", width: "100%", borderRadius: "1px", overflow: "hidden", background: "var(--c-line)" }}>
          {["A", "B", "C"].map(L => lean[L] > 0.02 && (
            <span
              key={L}
              title={`${RM_WORDS[L]} ${Math.round(lean[L] * 100)}%`}
              style={{
                width: (lean[L] * 100) + "%",
                background: RM_COLORS[L],
                opacity: L === dom.letter ? 1 : 0.45,
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.4rem" }}>
          {["A", "B", "C"].map(L => (
            <span key={L} className="t-mono" style={{ fontSize: "0.68rem", letterSpacing: ".12em", color: L === dom.letter ? "var(--c-ink)" : "var(--c-ink-3)", fontVariantNumeric: "tabular-nums" }}>
              {RM_WORDS[L]} {Math.round(lean[L] * 100)}%
            </span>
          ))}
        </div>
      </div>
    );
  }

  Object.assign(window, {
    RoomMatchBadge,
    PartyLeanBanner,
    roomLean,
    roomMatch,
    getCustomParties,
    saveCustomParty,
    deleteCustomParty,
    buildPartyRoute,
  });
})();
