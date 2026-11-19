// builder-cart.jsx — sitewide slide-in checkout & quick-view lightbox.
// Single universal bag for both live studio sites (#/site/:id) AND live
// Cart Drawer preview inside the Site Builder (#/build).

(function () {
  const { useState, useEffect } = React;
  const LS = "cina:cart";
  const read = () => { try { const v = JSON.parse(localStorage.getItem(LS) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
  const write = (v) => { try { localStorage.setItem(LS, JSON.stringify(v)); } catch {} };
  const key = (p) => (p.name || "") + "|" + (p.variant || "");

  const bus = new EventTarget();
  let items = read();
  const emit = () => {
    write(items);
    bus.dispatchEvent(new Event("change"));
    window.dispatchEvent(new CustomEvent("cina:cart-updated", { detail: { count: items.reduce((n, i) => n + i.qty, 0) } }));
  };

  function storeConnected() {
    try {
      const prods = JSON.parse(localStorage.getItem("cina:studio-store") || "[]");
      if (Array.isArray(prods) && prods.some(p => p.status === "active")) return true;
      const pf = JSON.parse(localStorage.getItem("cina:printful") || "null");
      if (pf && pf.connected) return true;
    } catch {}
    return false;
  }

  function isInBuilder() {
    return typeof window !== "undefined" && /^#\/build(\/|$)/.test(window.location.hash || "");
  }

  function Drawer() {
    const [open, setOpen] = useState(false);
    const [list, setList] = useState(items);
    const [placed, setPlaced] = useState(false);
    const [hasStore, setHasStore] = useState(() => storeConnected());
    const [inBuilder, setInBuilder] = useState(isInBuilder);
    const [storeCfg, setStoreCfg] = useState(() => (window.wbLoadStoreSettings ? window.wbLoadStoreSettings() : { symbol: "$", flatShipping: 8, freeShippingOver: 75, taxRatePct: 8.5, promoCode: "SAFELIGHT10", promoPct: 10, fulfillmentNote: "Ships worldwide · 3–5 business days" }));
    const [promoInput, setPromoInput] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);

    useEffect(() => {
      const onChange = () => setList([...items]);
      const onOpen = () => { setPlaced(false); setOpen(true); if (window.wbLoadStoreSettings) setStoreCfg(window.wbLoadStoreSettings()); };
      const onStore = () => { setHasStore(storeConnected()); if (window.wbLoadStoreSettings) setStoreCfg(window.wbLoadStoreSettings()); };
      const onHash = () => setInBuilder(isInBuilder());
      bus.addEventListener("change", onChange);
      window.addEventListener("cina:cart-open", onOpen);
      window.addEventListener("cina:store-changed", onStore);
      window.addEventListener("hashchange", onHash);
      return () => {
        bus.removeEventListener("change", onChange);
        window.removeEventListener("cina:cart-open", onOpen);
        window.removeEventListener("cina:store-changed", onStore);
        window.removeEventListener("hashchange", onHash);
      };
    }, []);

    const sym = storeCfg.symbol || "$";
    const count = list.reduce((n, i) => n + i.qty, 0);
    const subtotal = list.reduce((n, i) => n + i.qty * (Number(i.price) || 0), 0);
    const discount = promoApplied && storeCfg.promoPct ? subtotal * (Number(storeCfg.promoPct) / 100) : 0;
    const discountedSub = Math.max(0, subtotal - discount);
    const freeThreshold = Number(storeCfg.freeShippingOver || 0);
    const shipping = discountedSub === 0 ? 0 : (freeThreshold > 0 && discountedSub >= freeThreshold ? 0 : Number(storeCfg.flatShipping || 0));
    const tax = discountedSub * (Number(storeCfg.taxRatePct || 0) / 100);
    const grandTotal = discountedSub + shipping + tax;
    const toFreeShip = freeThreshold > 0 ? Math.max(0, freeThreshold - discountedSub) : 0;

    const setQty = (k, d) => {
      items = items.map(i => key(i) === k ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0);
      emit();
    };
    const showButton = !inBuilder && hasStore && count > 0;

    return (
      <>
        {showButton && (
          <button onClick={() => setOpen(true)} aria-label="Cart" className="cina-cart-fab" style={{
            position: "fixed", right: 20, top: 16, zIndex: 9000, height: 38, padding: "0 14px", borderRadius: 2,
            background: "rgba(14,14,18,.88)", color: `var(--c-ink, ${tkc("ink")})`, border: `1px solid var(--c-line-2, ${tkc("line")})`, cursor: "pointer",
            backdropFilter: "blur(12px)", boxShadow: "0 10px 30px -12px rgba(0,0,0,.6)", display: "flex", alignItems: "center", gap: 9,
            fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", letterSpacing: ".14em", fontVariantNumeric: "tabular-nums",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
            <span>BAG · {count}</span>
          </button>
        )}

        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9001, background: "rgba(0,0,0,.58)", backdropFilter: "blur(4px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .25s" }}/>

        <aside style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 9002, width: 410, maxWidth: "92vw",
          background: `var(--c-panel, ${tkc("panel-2")})`, borderLeft: `1px solid var(--c-line-2, ${tkc("line")})`,
          boxShadow: "-30px 0 80px -30px rgba(0,0,0,.8)", transform: open ? "translateX(0)" : "translateX(102%)",
          transition: "transform .28s cubic-bezier(.16,1,.3,1)", display: "flex", flexDirection: "column",
          fontFamily: "var(--f-sans, system-ui)", color: `var(--c-ink, ${tkc("ink")})`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px", borderBottom: `1px solid var(--c-line, ${tkc("line")})` }}>
            <span style={{ fontFamily: "var(--f-display, Georgia, serif)", fontStyle: "italic", fontSize: "var(--fs-title)" }}>
              {inBuilder ? "Cart drawer preview" : "Your bag"}
            </span>
            <span style={{ fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", color: `var(--c-ink-4, ${tkc("ink-3")})`, letterSpacing: ".14em", fontVariantNumeric: "tabular-nums" }}>
              {count} ITEM{count === 1 ? "" : "S"}
            </span>
            <span style={{ flex: 1 }}/>
            <button onClick={() => setOpen(false)} aria-label="Close bag" style={{ width: 32, height: 32, borderRadius: "2px", background: "transparent", border: `1px solid var(--c-line-2, ${tkc("line")})`, color: `var(--c-ink-3, ${tkc("ink-3")})`, cursor: "pointer" }}>✕</button>
          </div>

          {placed ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 30, textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "2px", background: "rgba(95,165,106,.15)", color: `var(--c-good, ${tkc("good")})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-title)", border: "1px solid rgba(95,165,106,.35)" }}>✓</div>
              <div style={{ fontFamily: "var(--f-display, Georgia, serif)", fontStyle: "italic", fontSize: "var(--fs-title)" }}>Order placed.</div>
              <div style={{ fontSize: "var(--fs-body)", color: `var(--c-ink-3, ${tkc("ink-3")})`, lineHeight: 1.5, maxWidth: 280 }}>{storeCfg.fulfillmentNote || "A confirmation is on its way. Print-on-demand items ship in 3–5 days."}</div>
              <button onClick={() => setOpen(false)} style={ctaStyle()}>Keep browsing</button>
            </div>
          ) : list.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 30, textAlign: "center", color: `var(--c-ink-3, ${tkc("ink-3")})` }}>
              <div style={{ fontFamily: "var(--f-display, Georgia, serif)", fontStyle: "italic", fontSize: "var(--fs-title)", color: `var(--c-ink-2, ${tkc("ink-2")})` }}>Your bag is empty.</div>
              <div style={{ fontSize: "var(--fs-body)", lineHeight: 1.55, maxWidth: 260 }}>Add any merch edition from the storefront section or seed a test item below to test checkout inside the builder.</div>
              <button onClick={() => {
                const prods = window.wbLoadStoreCatalog ? window.wbLoadStoreCatalog() : [];
                const pick = prods.find(p => p.status === "active") || prods[0] || { title: "Last Light · Archival Screenprint", price: 42, type: "POSTER", swatch: "#B94134" };
                window.cinaCart.add({ name: pick.title || pick.name, price: pick.price, kind: (pick.type || pick.kind || "ITEM").toUpperCase(), color: pick.swatch || pick.color, image: (pick.images || [])[0] || pick.image });
              }} style={{ ...ctaStyle(), width: "auto", padding: "0 18px", marginTop: 6 }}>
                + Add sample edition
              </button>
            </div>
          ) : (
            <>
              {freeThreshold > 0 && (
                <div style={{ padding: "8px 20px", borderBottom: `1px solid var(--c-line, ${tkc("line")})`, background: "rgba(255,255,255,0.02)", fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: ".08em", color: toFreeShip === 0 ? "var(--c-good)" : "var(--c-ink-3)" }}>
                  {toFreeShip === 0 ? "✓ FREE ARCHIVAL SHIPPING UNLOCKED" : `ADD ${sym}${toFreeShip.toFixed(2)} MORE FOR FREE SHIPPING`}
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {list.map(it => (
                  <div key={key(it)} style={{ display: "flex", gap: 12, padding: 10, borderRadius: "2px", border: `1px solid var(--c-line, ${tkc("line")})`, background: `var(--c-bg, ${tkc("bg")})` }}>
                    <div style={{ width: 58, height: 58, borderRadius: "2px", flexShrink: 0, overflow: "hidden", background: it.color ? `linear-gradient(135deg, ${it.color}, ${tkc("black")})` : tkc("line"), display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {it.image ? <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : <span style={{ fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", color: tkc("white"), opacity: .85, letterSpacing: ".12em" }}>{it.kind || ""}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--f-display, Georgia, serif)", fontStyle: "italic", fontSize: "var(--fs-lead)", lineHeight: 1.15 }}>{it.name}</div>
                      <div style={{ fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", color: "var(--c-amber)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
                        {sym}{Number(it.price || 0).toFixed(2)}{it.variant ? ` · ${it.variant}` : ""}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", border: `1px solid var(--c-line-2, ${tkc("line")})`, borderRadius: "2px", overflow: "hidden" }}>
                          <button onClick={() => setQty(key(it), -1)} style={qtyBtn()}>−</button>
                          <span style={{ width: 28, textAlign: "center", fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-body)", fontVariantNumeric: "tabular-nums" }}>{it.qty}</span>
                          <button onClick={() => setQty(key(it), 1)} style={qtyBtn()}>+</button>
                        </div>
                        <span style={{ flex: 1 }}/>
                        <button onClick={() => setQty(key(it), -it.qty)} style={{ background: "transparent", border: "none", color: `var(--c-ink-4, ${tkc("ink-3")})`, cursor: "pointer", fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", letterSpacing: ".12em" }}>REMOVE</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px 20px", borderTop: `1px solid var(--c-line, ${tkc("line")})`, display: "flex", flexDirection: "column", gap: 8 }}>
                {storeCfg.promoCode && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder={`Promo (${storeCfg.promoCode})`}
                      style={{ flex: 1, minWidth: 0, padding: "6px 8px", background: `var(--c-bg, ${tkc("bg")})`, border: `1px solid var(--c-line-2, ${tkc("line")})`, borderRadius: 2, color: "inherit", fontFamily: "var(--f-mono)", fontSize: 11 }}
                    />
                    <button
                      onClick={() => setPromoApplied(promoInput.trim().toUpperCase() === String(storeCfg.promoCode).trim().toUpperCase())}
                      style={{ padding: "0 10px", background: "transparent", border: `1px solid var(--c-line-2, ${tkc("line")})`, borderRadius: 2, color: "var(--c-amber)", fontFamily: "var(--f-mono)", fontSize: 10.5, cursor: "pointer" }}
                    >{promoApplied ? "APPLIED" : "APPLY"}</button>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--f-mono)", fontSize: 11, color: `var(--c-ink-3, ${tkc("ink-3")})` }}>
                  <span>SHIPPING</span><span>{shipping === 0 ? "FREE" : `${sym}${shipping.toFixed(2)}`}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--c-good)" }}>
                    <span>DISCOUNT ({storeCfg.promoPct}%)</span><span>-{sym}{discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--f-mono)", fontSize: 11, color: `var(--c-ink-3, ${tkc("ink-3")})` }}>
                  <span>EST. TAX ({storeCfg.taxRatePct || 0}%)</span><span>{sym}{tax.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, marginTop: 2 }}>
                  <span style={{ fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", color: `var(--c-ink-2, ${tkc("ink-2")})`, letterSpacing: ".14em" }}>TOTAL</span>
                  <span style={{ fontFamily: "var(--f-display, Georgia, serif)", fontStyle: "italic", fontSize: "var(--fs-title)", fontVariantNumeric: "tabular-nums" }}>{sym}{grandTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => { items = []; emit(); setPlaced(true); }} style={ctaStyle()}>Checkout · {sym}{grandTotal.toFixed(2)}</button>
                <div style={{ fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", color: `var(--c-ink-4, ${tkc("ink-3")})`, letterSpacing: ".06em", textAlign: "center" }}>
                  {storeCfg.fulfillmentNote || (inBuilder ? "Live storefront checkout preview" : "Secure checkout · studio direct")}
                </div>
              </div>
            </>
          )}
        </aside>
      </>
    );
  }
  function ctaStyle() { return { width: "100%", height: 44, borderRadius: "2px", border: "none", cursor: "pointer", background: "var(--c-amber)", color: tkc("on-amber"), fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-body)", letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase" }; }
  function qtyBtn() { return { width: 28, height: 28, border: "none", background: "transparent", color: `var(--c-ink-2, ${tkc("ink-2")})`, cursor: "pointer", fontSize: "var(--fs-lead)", lineHeight: 1 }; }

  window.cinaCart = {
    add(product) {
      const k = key(product);
      const ex = items.find(i => key(i) === k);
      if (ex) ex.qty += 1; else items = [{ ...product, qty: 1 }, ...items];
      emit();
      window.dispatchEvent(new Event("cina:cart-open"));
    },
    open() { window.dispatchEvent(new Event("cina:cart-open")); },
    quickView(product) { window.dispatchEvent(new CustomEvent("cina:quickview", { detail: product })); },
    count() { return items.reduce((n, i) => n + i.qty, 0); },
    subscribe(fn) {
      const h = () => fn(items.reduce((n, i) => n + i.qty, 0), items);
      bus.addEventListener("change", h);
      return () => bus.removeEventListener("change", h);
    },
  };

  function QuickView() {
    const [p, setP] = useState(null);
    const [color, setColor] = useState(null);
    const [qty, setQty] = useState(1);
    const [sub, setSub] = useState(false);
    useEffect(() => {
      const onQV = (e) => { const prod = e.detail || {}; setP(prod); setColor((prod.colors && prod.colors[0]) || null); setQty(1); setSub(false); };
      window.addEventListener("cina:quickview", onQV);
      return () => window.removeEventListener("cina:quickview", onQV);
    }, []);
    if (!p) return null;
    const colors = p.colors || [];
    const unit = (Number(p.price) || 0);
    const total = unit * qty;
    const add = () => {
      window.cinaCart.add({ name: p.name, price: unit, kind: p.kind, color: (color && color.hex) || p.color, image: p.image, variant: (color && color.name) || undefined, subscription: sub, sellerId: p.sellerId || "studio" });
      setP(null);
    };
    return (
      <div onClick={() => setP(null)} style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(0,0,0,.78)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--f-sans, system-ui)" }}>
        <div onClick={e => e.stopPropagation()} style={{ width: 840, maxWidth: "100%", maxHeight: "88vh", background: `var(--c-panel, ${tkc("panel-2")})`, border: `1px solid var(--c-line-2, ${tkc("line")})`, borderRadius: "2px", overflow: "hidden", display: "grid", gridTemplateColumns: "1.05fr .95fr" }} className="cina-qv">
          <div style={{ background: `var(--c-void, ${tkc("bg")})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 26, position: "relative", minHeight: 320 }}>
            {p.image ? <img src={p.image} alt="" style={{ width: "100%", borderRadius: "2px", maxHeight: 380, objectFit: "cover" }}/> : <div style={{ width: "78%", aspectRatio: "1", borderRadius: "2px", background: p.color ? `linear-gradient(150deg, ${p.color}, ${tkc("black")} 88%)` : tkc("panel-2"), border: `1px solid var(--c-line, ${tkc("line")})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", letterSpacing: ".16em", color: "rgba(255,255,255,.7)" }}>{p.kind || "EDITION"}</div>}
          </div>
          <div style={{ padding: "26px 28px", overflowY: "auto", position: "relative", color: `var(--c-ink, ${tkc("ink")})` }}>
            <button onClick={() => setP(null)} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "2px", background: "transparent", border: `1px solid var(--c-line-2, ${tkc("line")})`, color: `var(--c-ink-3, ${tkc("ink-3")})`, cursor: "pointer" }}>✕</button>
            {p.kind && <div style={{ fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", letterSpacing: ".16em", color: "var(--c-amber)", textTransform: "uppercase", marginBottom: 8 }}>{p.kind}</div>}
            <h2 style={{ fontFamily: "var(--f-display, Georgia, serif)", fontStyle: "italic", fontWeight: 400, fontSize: "var(--fs-head)", lineHeight: 1.05, margin: "0 0 10px", paddingRight: 36 }}>{p.name}</h2>
            <div style={{ fontFamily: "var(--f-display, Georgia, serif)", fontStyle: "italic", fontSize: "var(--fs-title)", marginBottom: 16, fontVariantNumeric: "tabular-nums" }}>${unit.toFixed(2)}</div>
            {p.desc && <p style={{ fontSize: "var(--fs-body)", color: `var(--c-ink-2, ${tkc("ink-2")})`, lineHeight: 1.6, margin: "0 0 18px" }}>{p.desc}</p>}
            {colors.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", color: `var(--c-ink-4, ${tkc("ink-3")})`, letterSpacing: ".14em", marginBottom: 9 }}>EDITION — {color ? color.name : ""}</div>
                <div style={{ display: "flex", gap: 9 }}>{colors.map(c => <button key={c.hex} onClick={() => setColor(c)} title={c.name} style={{ width: 28, height: 28, borderRadius: "2px", cursor: "pointer", background: c.hex, border: color && color.hex === c.hex ? "2px solid var(--c-amber)" : `1px solid var(--c-line-3, ${tkc("line-3")})` }}/>)}</div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", color: `var(--c-ink-4, ${tkc("ink-3")})`, letterSpacing: ".14em" }}>QTY</span>
              <div style={{ display: "flex", alignItems: "center", border: `1px solid var(--c-line-2, ${tkc("line")})`, borderRadius: "2px", overflow: "hidden" }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={qtyBtn()}>−</button>
                <span style={{ width: 34, textAlign: "center", fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-body)", fontVariantNumeric: "tabular-nums" }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={qtyBtn()}>+</button>
              </div>
            </div>
            {p.subscribable && (
              <button onClick={() => setSub(s => !s)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 13px", borderRadius: "2px", marginBottom: 14, cursor: "pointer", textAlign: "left", background: sub ? "rgba(var(--accent-rgb),.1)" : "transparent", border: `1px solid ${sub ? "var(--c-amber)" : "var(--c-line-2, var(--c-line))"}`, color: "inherit" }}>
                <span style={{ width: 18, height: 18, borderRadius: "2px", flexShrink: 0, border: `1px solid ${sub ? "var(--c-amber)" : "var(--c-line-3,var(--c-line-3))"}`, background: sub ? "var(--c-amber)" : "transparent", color: "var(--c-on-amber)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-label)" }}>{sub ? "✓" : ""}</span>
                <span style={{ fontSize: "var(--fs-body)" }}>Subscribe &amp; save — quarterly studio print drop</span>
              </button>
            )}
            <button onClick={add} style={{ ...ctaStyle(), height: 46 }}>Add to bag · ${total.toFixed(2)}</button>
            <div style={{ marginTop: 12, fontFamily: "var(--f-mono, monospace)", fontSize: "var(--fs-label)", color: `var(--c-ink-4, ${tkc("ink-3")})`, letterSpacing: ".08em", lineHeight: 1.6 }}>Ships worldwide · secure studio checkout</div>
          </div>
        </div>
      </div>
    );
  }

  function mount() {
    if (document.getElementById("cina-cart-root")) return;
    const el = document.createElement("div");
    el.id = "cina-cart-root";
    document.body.appendChild(el);
    ReactDOM.createRoot(el).render(<><Drawer/><QuickView/></>);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
