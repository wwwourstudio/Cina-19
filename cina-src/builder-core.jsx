// builder-core.jsx — Studio Builder data, multi-page schema, design system tokens, store sync and primitives.

const { useState: usbCo, useEffect: uebCo, useRef: urbCo } = React;

// ─── Block library ──────────────────────────────────────────────────────

const BLOCK_LIBRARY_V2 = [
  // ─ Heroes ─
  { type: "hero",            cat: "Heroes",    name: "Editorial hero",    icon: "▣",  desc: "Headline, kicker & statement" },
  { type: "hero-parallax",   cat: "Heroes",    name: "Parallax hero",     icon: "▤",  desc: "Full-bleed still + scroll drift" },
  { type: "hero-video",      cat: "Heroes",    name: "Video reel hero",   icon: "▶",  desc: "Cinema backdrop + play cue" },
  { type: "hero-split",      cat: "Heroes",    name: "Split hero",        icon: "◨",  desc: "Frame left, editorial copy right" },

  // ─ Media ─
  { type: "image",           cat: "Media",     name: "Image plate",       icon: "▣",  desc: "Full-width still or upload" },
  { type: "video",           cat: "Media",     name: "Video showcase",    icon: "▶",  desc: "Embedded reel or trailer" },
  { type: "gallery",         cat: "Media",     name: "Contact sheet",     icon: "▦▦", desc: "Asymmetric stills mosaic" },

  // ─ Story ─
  { type: "marquee",         cat: "Story",     name: "Ticker ribbon",     icon: "▷",  desc: "Continuous running marquee" },
  { type: "faq",             cat: "Story",     name: "FAQ accordion",     icon: "‽",  desc: "Expandable studio Q&A" },
  { type: "awards",          cat: "Story",     name: "Awards & laurels",  icon: "✿",  desc: "Festival selections grid" },
  { type: "logos",           cat: "Story",     name: "Press strip",       icon: "▭",  desc: "Publication & partner marks" },
  { type: "about",           cat: "Story",     name: "About / Statement", icon: "¶",  desc: "Long-form studio prose" },
  { type: "press",           cat: "Story",     name: "Critic quotes",     icon: "❝",  desc: "Pull quotes & reviews" },
  { type: "stats",           cat: "Story",     name: "Key metrics",       icon: "▣▣", desc: "Editorial figures strip" },
  { type: "timeline",        cat: "Story",     name: "Milestones",        icon: "─•", desc: "Chronological film history" },

  // ─ Catalog ─
  { type: "featured",        cat: "Catalog",   name: "Featured release",  icon: "★",  desc: "Flagship release spotlight" },
  { type: "films",           cat: "Catalog",   name: "Catalog grid",      icon: "▦",  desc: "Filterable studio filmography" },
  { type: "branched-shelf",  cat: "Catalog",   name: "Branched cinema",   icon: "Y",  desc: "Interactive multi-cut works" },
  { type: "episodes-shelf",  cat: "Catalog",   name: "Series episodes",   icon: "▥",  desc: "Episodic drop schedule" },
  { type: "trailers-shelf",  cat: "Catalog",   name: "Trailers & teasers",icon: "▶▶", desc: "Short cuts under 90s" },
  { type: "actor-vault",     cat: "Catalog",   name: "Cast roster",       icon: "◑",  desc: "Performers & trained models" },

  // ─ Community ─
  { type: "upcoming",        cat: "Community", name: "Tour & premieres",  icon: "◪",  desc: "Dates, festivals & reminders" },
  { type: "holders",         cat: "Community", name: "Patron cap table",  icon: "◈",  desc: "Backing tiers & holder wall" },
  { type: "newsletter",      cat: "Community", name: "Newsletter signup", icon: "✉",  desc: "Email capture bar" },
  { type: "contact",         cat: "Community", name: "Contact & inquiry", icon: "✎",  desc: "Details + fan/press inbox" },
  { type: "crew",            cat: "Community", name: "Credits & crew",    icon: "◉",  desc: "Two-column unit credits" },

  // ─ Commerce ─
  { type: "store",           cat: "Commerce",  name: "Merch storefront",  icon: "▢",  desc: "Synced catalog + quick-view bag" },
  { type: "shop-nft",        cat: "Commerce",  name: "Patron editions",   icon: "◇",  desc: "Limited passes & collectibles" },
  { type: "blog",            cat: "Commerce",  name: "Journal / Notes",   icon: "▤",  desc: "Editorial dispatches & essays" },
  { type: "cta",             cat: "Commerce",  name: "Action banner",     icon: "▮",  desc: "Centered conversion block" },

  // ─ Tail ─
  { type: "spacer",          cat: "Tail",      name: "Spacer",            icon: "─",  desc: "Adjustable vertical rhythm" },
  { type: "footer",          cat: "Tail",      name: "Site footer",       icon: "▭",  desc: "Navigation, socials & legal" },
];

// ─── Tiers & capabilities ───────────────────────────────────────────────

const WB_TIERS = {
  free:       { label: "Free",       maxSections: 16,      badge: true,  customDomain: false, apex: false, allFonts: true, codeInject: false, blurb: "Cina credit · multi-page studio · cina subdomain" },
  pro:        { label: "Pro",        maxSections: Infinity, badge: false, customDomain: true,  apex: false, allFonts: true, codeInject: false, blurb: "White-label · unlimited sections · storefront + custom domain" },
  enterprise: { label: "Enterprise", maxSections: Infinity, badge: false, customDomain: true,  apex: true,  allFonts: true, codeInject: true,  blurb: "Custom apex domain · CSS injection · priority routing" },
};
const wbTier = (page) => WB_TIERS[page && page.tier] || WB_TIERS.pro;

// ─── Global Design System Tokens (Palettes, Typography, Spacing, Shape) ─

const WB_BG_SWATCHES = [
  ...CINA_TOKENS.SITE.swatches.bg,
];
const WB_ACCENT_SWATCHES = [
  ...CINA_TOKENS.SITE.swatches.accent,
];

const WB_GLOBAL_PALETTES = [
  { id: "darkroom",  name: "Darkroom",       bg: "#0A0A0C", panel: "#141418", ink: "#F3EFEA", accent: "#E48D3C", mood: "Obsidian & warm amber" },
  { id: "criterion", name: "Criterion",      bg: "#101214", panel: "#181C20", ink: "#F4F5F7", accent: "#D9B46F", mood: "Archival slate & champagne" },
  { id: "paper",     name: "Gallery Paper",  bg: "#F6F3EE", panel: "#EDE8DF", ink: "#171614", accent: "#B8472A", mood: "Alabaster & vermilion" },
  { id: "silver",    name: "Silver Gelatin", bg: "#0E0E10", panel: "#17171B", ink: "#EDEDEF", accent: "#C4C9D4", mood: "Pure monochrome" },
  { id: "oxblood",   name: "Oxblood Print",  bg: "#12090B", panel: "#1D1013", ink: "#F5EAEB", accent: "#DF6A5E", mood: "Safelight noir & crimson" },
  { id: "sage",      name: "Atelier Moss",   bg: "#0D1210", panel: "#151D1A", ink: "#EDF2EE", accent: "#8BC198", mood: "Mineral green & bone" },
  { id: "cobalt",    name: "Midnight Cobalt",bg: "#080C18", panel: "#10172B", ink: "#EEF2FA", accent: "#6CA0F6", mood: "Deep marine & sapphire" },
  { id: "bone",      name: "Warm Newsprint", bg: "#EFECE6", panel: "#E4DFD6", ink: "#191816", accent: "#2B5948", mood: "Broadsheet & forest green" },
  { id: "emerald",   name: "Celluloid Acid", bg: "#070D0A", panel: "#0E1812", ink: "#ECFFF3", accent: "#3ED598", mood: "Nocturne emerald & mint" },
  { id: "plum",      name: "Velvet Giallo",  bg: "#110B14", panel: "#1C1321", ink: "#F6EEF9", accent: "#E06C9F", mood: "Technicolor plum & rose" },
];

const WB_FONTS = {
  // Core studio primitives
  display:     { label: "Fraunces · Serif",       cat: "Serif",   css: "var(--f-display)", gf: "Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900", free: true },
  sans:        { label: "Geist · Sans",           cat: "Sans",    css: "var(--f-sans)",    gf: "", free: true },
  mono:        { label: "JetBrains Mono",         cat: "Mono",    css: "var(--f-mono)",    gf: "JetBrains+Mono:wght@400;500;700", free: true },
  // Editorial & Awwwards Display Serifs
  playfair:    { label: "Playfair Display",       cat: "Serif",   css: "'Playfair Display', Georgia, serif",     gf: "Playfair+Display:ital,wght@0,400..900;1,400..900", free: true },
  instrument:  { label: "Instrument Serif",       cat: "Serif",   css: "'Instrument Serif', Georgia, serif",     gf: "Instrument+Serif:ital@0;1", free: true },
  cormorant:   { label: "Cormorant Garamond",     cat: "Serif",   css: "'Cormorant Garamond', Georgia, serif",   gf: "Cormorant+Garamond:ital,wght@0,400..700;1,400..700", free: true },
  bodoni:      { label: "Bodoni Moda",            cat: "Serif",   css: "'Bodoni Moda', Georgia, serif",          gf: "Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900", free: true },
  dmserif:     { label: "DM Serif Display",       cat: "Serif",   css: "'DM Serif Display', Georgia, serif",     gf: "DM+Serif+Display:ital@0;1", free: true },
  newsreader:  { label: "Newsreader",             cat: "Serif",   css: "'Newsreader', Georgia, serif",           gf: "Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700", free: true },
  spectral:    { label: "Spectral",               cat: "Serif",   css: "'Spectral', Georgia, serif",             gf: "Spectral:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600", free: true },
  crimson:     { label: "Crimson Pro",            cat: "Serif",   css: "'Crimson Pro', Georgia, serif",          gf: "Crimson+Pro:ital,wght@0,300..700;1,300..700", free: true },
  cinzel:      { label: "Cinzel",                 cat: "Display", css: "'Cinzel', Georgia, serif",               gf: "Cinzel:wght@400..800", free: true },
  ebgaramond:  { label: "EB Garamond",            cat: "Serif",   css: "'EB Garamond', Georgia, serif",          gf: "EB+Garamond:ital,wght@0,400..800;1,400..800", free: true },
  prata:       { label: "Prata",                  cat: "Serif",   css: "'Prata', Georgia, serif",                gf: "Prata", free: true },
  // Avant-Garde & Awwwards Display Sans
  syne:        { label: "Syne · Avant-Garde",     cat: "Display", css: "'Syne', sans-serif",                     gf: "Syne:wght@400..800", free: true },
  unbounded:   { label: "Unbounded",              cat: "Display", css: "'Unbounded', sans-serif",                gf: "Unbounded:wght@300..800", free: true },
  bricolage:   { label: "Bricolage Grotesque",    cat: "Display", css: "'Bricolage Grotesque', sans-serif",      gf: "Bricolage+Grotesque:opsz,wght@12..96,300..800", free: true },
  bebas:       { label: "Bebas Neue",             cat: "Display", css: "'Bebas Neue', sans-serif",               gf: "Bebas+Neue", free: true },
  anton:       { label: "Anton",                  cat: "Display", css: "'Anton', sans-serif",                    gf: "Anton", free: true },
  // Architectural & Modern Sans
  grotesk:     { label: "Space Grotesk",          cat: "Sans",    css: "'Space Grotesk', sans-serif",            gf: "Space+Grotesk:wght@300..700", free: true },
  plusjakarta: { label: "Plus Jakarta Sans",      cat: "Sans",    css: "'Plus Jakarta Sans', sans-serif",        gf: "Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800", free: true },
  outfit:      { label: "Outfit",                 cat: "Sans",    css: "'Outfit', sans-serif",                   gf: "Outfit:wght@300..800", free: true },
  sora:        { label: "Sora",                   cat: "Sans",    css: "'Sora', sans-serif",                     gf: "Sora:wght@300..800", free: true },
  archivo:     { label: "Archivo",                cat: "Sans",    css: "'Archivo', sans-serif",                  gf: "Archivo:ital,wght@0,300..800;1,300..800", free: true },
  worksans:    { label: "Work Sans",              cat: "Sans",    css: "'Work Sans', sans-serif",                gf: "Work+Sans:ital,wght@0,300..700;1,300..700", free: true },
  inter:       { label: "Inter",                  cat: "Sans",    css: "'Inter', sans-serif",                    gf: "Inter:wght@300..800", free: true },
  dmsans:      { label: "DM Sans",                cat: "Sans",    css: "'DM Sans', sans-serif",                  gf: "DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700", free: true },
  manrope:     { label: "Manrope",                cat: "Sans",    css: "'Manrope', sans-serif",                  gf: "Manrope:wght@300..800", free: true },
  // Editorial Monospace
  spacemono:   { label: "Space Mono",             cat: "Mono",    css: "'Space Mono', monospace",                gf: "Space+Mono:ital,wght@0,400;0,700;1,400", free: true },
  ibmmono:     { label: "IBM Plex Mono",          cat: "Mono",    css: "'IBM Plex Mono', monospace",             gf: "IBM+Plex+Mono:wght@400;500;700", free: true },
};

const WB_FONT_PAIRINGS = [
  { name: "Darkroom",       headline: "display",    body: "sans",        free: true },
  { name: "Awwwards",       headline: "instrument", body: "inter",       free: true },
  { name: "Avant-Garde",    headline: "syne",       body: "manrope",     free: true },
  { name: "Broadsheet",     headline: "bodoni",     body: "newsreader",  free: true },
  { name: "Brutalist",      headline: "unbounded",  body: "spacemono",   free: true },
  { name: "Terminal",       headline: "mono",       body: "sans",        free: true },
  { name: "Playbill",       headline: "playfair",   body: "worksans",    free: true },
  { name: "Marquee",        headline: "dmserif",    body: "archivo",     free: true },
  { name: "Festival",       headline: "cormorant",  body: "spectral",    free: true },
  { name: "Criterion",      headline: "grotesk",    body: "plusjakarta", free: true },
  { name: "Novella",        headline: "crimson",    body: "dmsans",      free: true },
  { name: "Cinema Poster",  headline: "bebas",      body: "outfit",      free: true },
];

function wbInjectGoogleFontLink(id, familyQuery) {
  if (typeof document === "undefined" || !familyQuery) return;
  const safeId = "wb-font-" + String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
  if (document.getElementById(safeId)) return;
  const l = document.createElement("link");
  l.id = safeId;
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=" + familyQuery + "&display=swap";
  document.head.appendChild(l);
}

// Resolves preset font keys OR ANY custom Google Font family string (e.g. "Libre Baskerville")
function wbFont(keyOrFamily) {
  const raw = String(keyOrFamily || "display").trim();
  if (WB_FONTS[raw]) {
    const f = WB_FONTS[raw];
    if (f.gf) wbInjectGoogleFontLink(raw, f.gf);
    return f.css;
  }
  const byLabel = Object.entries(WB_FONTS).find(([, f]) => f.label.toLowerCase() === raw.toLowerCase());
  if (byLabel) {
    if (byLabel[1].gf) wbInjectGoogleFontLink(byLabel[0], byLabel[1].gf);
    return byLabel[1].css;
  }
  // Support any Google Font family entered or generated by AI!
  const cleanName = raw.replace(/['"]/g, "").trim();
  if (!cleanName || cleanName === "inherit") return WB_FONTS.display.css;
  const query = encodeURIComponent(cleanName).replace(/%20/g, "+") + ":ital,wght@0,400;0,600;0,700;1,400";
  wbInjectGoogleFontLink("gf-" + cleanName.toLowerCase(), query);
  return `'${cleanName}', Georgia, sans-serif`;
}
if (typeof window !== "undefined") Object.assign(window, { WB_FONTS, WB_FONT_PAIRINGS, WB_GLOBAL_PALETTES, wbFont });

// Global Button + Card Corner helpers driven by site.theme
function wbBtnCss(t, accent, variant = "primary") {
  const rad = t && t.btnRadius != null ? Number(t.btnRadius) : 2;
  const st = (t && t.btnStyle) || "solid";
  const isGhost = variant === "secondary" || st === "outline";
  if (st === "underline") {
    return {
      background: "transparent",
      color: accent,
      border: "none",
      borderBottom: `1.5px solid ${accent}`,
      borderRadius: 0,
    };
  }
  if (isGhost) {
    return {
      background: "transparent",
      color: accent,
      border: `1px solid ${accent}`,
      borderRadius: rad,
    };
  }
  return {
    background: accent,
    color: t?.bg || "#0A0A0C",
    border: `1px solid ${accent}`,
    borderRadius: rad,
  };
}

function wbRadiusPx(t, mult = 1) {
  const r = t && t.radius != null ? Number(t.radius) : 2;
  return Math.round(r * mult);
}

// ─── Shared Storefront Catalog Sync (cina:studio-store) ─────────────────

const DEFAULT_MERCH_CATALOG = [
  {
    id: "m-poster-ll",
    title: "Last Light · Archival 24×36 Screenprint",
    price: 42,
    type: "POSTER",
    status: "active",
    swatch: "#B94134",
    desc: "Three-color silkscreen on 300gsm Hahnemühle cotton rag. Numbered studio edition of 150.",
    colors: [{ name: "Oxblood Red", hex: "#B94134" }, { name: "Silver Ink", hex: "#9BA3AE" }],
    subscribable: false,
  },
  {
    id: "m-ost-vinyl",
    title: "Last Light · Original Score 2LP (180g)",
    price: 48,
    type: "VINYL",
    status: "active",
    swatch: "#E48D3C",
    desc: "Gatefold sleeve with production stills & director liner notes. Mastered at 45 RPM.",
    colors: [{ name: "Amber Wax", hex: "#E48D3C" }, { name: "Obsidian", hex: "#1B1B1F" }],
    subscribable: false,
  },
  {
    id: "m-darkroom-tee",
    title: "Safelight Unit Heavyweight Tee",
    price: 36,
    type: "APPAREL",
    status: "active",
    swatch: "#2B2D33",
    desc: "290gsm combed heavyweight cotton, garment-dyed charcoal with chest unit stamp.",
    colors: [{ name: "Charcoal", hex: "#2B2D33" }, { name: "Bone", hex: "#E6E0D4" }],
    subscribable: false,
  },
  {
    id: "m-script-book",
    title: "Shooting Script & Annotations Vol. I",
    price: 28,
    type: "BOOK",
    status: "active",
    swatch: "#5E7B8C",
    desc: "212-page Smyth-sewn paperback with camera diagrams, lighting plots, and director margin notes.",
    colors: [{ name: "Slate Cloth", hex: "#5E7B8C" }],
    subscribable: true,
  },
];

function wbSeedStoreIfNeeded(creatorId) {
  try {
    const raw = localStorage.getItem("cina:studio-store");
    if (raw === null) {
      const seeded = DEFAULT_MERCH_CATALOG.map(p => ({ ...p, creatorId: creatorId || "voss" }));
      localStorage.setItem("cina:studio-store", JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return DEFAULT_MERCH_CATALOG;
}

function wbLoadStoreCatalog(creatorId) {
  try {
    const raw = localStorage.getItem("cina:studio-store");
    if (raw === null) return wbSeedStoreIfNeeded(creatorId);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function wbSaveStoreCatalog(list) {
  try {
    localStorage.setItem("cina:studio-store", JSON.stringify(list));
    window.dispatchEvent(new Event("cina:store-changed"));
  } catch {}
}

const DEFAULT_STORE_SETTINGS = {
  currency: "USD",
  symbol: "$",
  flatShipping: 8,
  freeShippingOver: 75,
  taxRatePct: 8.5,
  promoCode: "SAFELIGHT10",
  promoPct: 10,
  fulfillmentNote: "Archival tubes & mailers · ships worldwide in 3–5 business days",
  allowPrintful: false,
};

function wbLoadStoreSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem("cina:store-settings") || "null");
    if (raw && typeof raw === "object") return { ...DEFAULT_STORE_SETTINGS, ...raw };
  } catch {}
  return { ...DEFAULT_STORE_SETTINGS };
}

function wbSaveStoreSettings(next) {
  try {
    localStorage.setItem("cina:store-settings", JSON.stringify(next));
    window.dispatchEvent(new Event("cina:store-changed"));
  } catch {}
}

// ─── Multi-Page Starters & Builders ─────────────────────────────────────

function wbSlugify(str) {
  const s = String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "page";
}

function wbMakePageTemplate(kind, creator, titleOverride) {
  const pid = "pg-" + Math.random().toString(36).slice(2, 7);
  const mk = (type, meta = {}, propsPatch = {}) => ({
    id: "s" + Math.random().toString(36).slice(2, 7),
    type,
    animate: "fade-up",
    props: { ...defaultPropsV2(type, creator), ...propsPatch },
    ...meta,
  });
  switch (kind) {
    case "work": {
      const t = titleOverride || "Work";
      return {
        id: pid, title: t, slug: wbSlugify(t), isHome: false, inMenu: true,
        seo: { title: `${t} · ${(creator?.name || "Studio")}`, description: "Selected features, series, and interactive works.", ogImage: null, noIndex: false },
        sections: [
          mk("hero", { title: "Work Hero" }, { kicker: "SELECTED WORKS", title: "Filmography", sub: "Features, episodic releases, and branched experiments." }),
          mk("featured", { title: "Spotlight" }, { filmId: "ll" }),
          mk("films", { title: "Catalog" }, { creatorId: creator?.id || "voss", layout: "poster", count: 8 }),
          mk("trailers-shelf", { title: "Trailers" }, { headline: "Teasers & short cuts" }),
          mk("footer"),
        ],
      };
    }
    case "store": {
      const t = titleOverride || "Store";
      return {
        id: pid, title: t, slug: wbSlugify(t), isHome: false, inMenu: true,
        seo: { title: `${t} · Merch & Editions`, description: "Limited prints, vinyl scores, scripts, and studio garments.", ogImage: null, noIndex: false },
        sections: [
          mk("hero", { title: "Store Hero", pad: "compact" }, { kicker: "STUDIO OBJECTS", title: "Editions & Merch", sub: "Archival prints, 180g score pressings, and numbered studio editions." }),
          mk("store", { title: "Catalog", width: "wide" }, { headline: "Available now", layout: "grid", showPrice: true }),
          mk("shop-nft", { title: "Patron Drops" }, { headline: "Patron & screening passes" }),
          mk("faq", { title: "Shipping & FAQ" }, { headline: "Shipping & fulfillment" }),
          mk("footer"),
        ],
      };
    }
    case "about": {
      const t = titleOverride || "About";
      return {
        id: pid, title: t, slug: wbSlugify(t), isHome: false, inMenu: true,
        seo: { title: `${t} · ${(creator?.name || "Studio")}`, description: "Studio manifesto, unit crew, accolades, and press notes.", ogImage: null, noIndex: false },
        sections: [
          mk("hero-split", { title: "Studio Bio" }, { kicker: "ATELIER", title: creator?.name || "Voss Studio", sub: "Making patient cinema under safelight since 2019.", bgImage: "darkroom" }),
          mk("about", { title: "Manifesto" }),
          mk("stats", { title: "Figures" }),
          mk("press", { title: "Press" }),
          mk("crew", { title: "Unit" }),
          mk("contact", { title: "Contact" }),
          mk("footer"),
        ],
      };
    }
    case "notebook": {
      const t = titleOverride || "Notebook";
      return {
        id: pid, title: t, slug: wbSlugify(t), isHome: false, inMenu: true,
        seo: { title: `${t} · Production Diary`, description: "Dispatches, lighting diagrams, and scoring notes from set.", ogImage: null, noIndex: false },
        sections: [
          mk("hero", { title: "Journal Hero", pad: "compact" }, { kicker: "PRODUCTION DIARY", title: "Notebook", sub: "Essays on lens craft, darkroom timing, and interactive structure." }),
          mk("blog", { title: "Posts" }, { headline: "Recent dispatches" }),
          mk("newsletter", { title: "Subscribe" }),
          mk("footer"),
        ],
      };
    }
    case "contact": {
      const t = titleOverride || "Contact";
      return {
        id: pid, title: t, slug: wbSlugify(t), isHome: false, inMenu: true,
        seo: { title: `${t} · Representation & Press`, description: "Direct studio inquiries, screening requests, and representation.", ogImage: null, noIndex: false },
        sections: [
          mk("contact", { title: "Inquiry" }),
          mk("upcoming", { title: "Schedule" }),
          mk("footer"),
        ],
      };
    }
    default: {
      const t = titleOverride || "Untitled Page";
      return {
        id: pid, title: t, slug: wbSlugify(t), isHome: false, inMenu: true,
        seo: { title: `${t} · ${(creator?.name || "Studio")}`, description: "", ogImage: null, noIndex: false },
        sections: [
          mk("hero", { title: "Page Header" }, { kicker: "NEW PAGE", title: t, sub: "Click any headline or paragraph on this canvas to write your copy." }),
          mk("about", { title: "Copy" }),
          mk("footer"),
        ],
      };
    }
  }
}

// ─── Default site schema (multi-page aware, backward-compatible) ────────

const DEFAULT_PAGE_V2 = (creator) => {
  const homeSections = [
    { id: "s-hero", type: "hero-parallax", animate: "fade-up", title: "Hero",
      props: {
        kicker: "DARKROOM FILMS",
        title: creator?.name || "Voss",
        sub: "Six films. One safelight. Long stares.",
        bgImage: "noir-rain",
        overlay: 0.58,
        parallax: 0.4,
        cta: { label: "Watch the work", href: "#films" },
      } },
    { id: "s-marquee", type: "marquee", animate: "fade-in", width: "full", pad: "none", margin: "none",
      props: { text: "WORK CURRENTLY ON THE WALL · STILL DEVELOPING · DO NOT EXPOSE TO LIGHT", speed: 22 } },
    { id: "s-stats", type: "stats", animate: "fade-up",
      props: { stats: [
        { k: "Films",     v: "6"   },
        { k: "Years",     v: "11"  },
        { k: "Holders",   v: "212" },
        { k: "Followers", v: "84k" },
      ]} },
    { id: "s-featured", type: "featured", animate: "fade-up", title: "Featured",
      props: { filmId: "ll" } },
    { id: "s-films", type: "films", animate: "fade-up", title: "Films", inMenu: true,
      props: { creatorId: creator?.id || "voss", layout: "poster", count: 6 } },
    { id: "s-store", type: "store", animate: "fade-up", title: "Store", inMenu: true,
      props: { headline: "Wear the work", layout: "grid", showPrice: true,
        products: [
          { name: "Poster · Last Light", price: 38, color: tkc("blood"), kind: "POSTER" },
          { name: "OST · vinyl 2LP",     price: 42, color: "var(--c-amber)", kind: "VINYL" },
          { name: "Darkroom tee",        price: 28, color: tkc("panel-2"), kind: "APPAREL" },
        ],
      } },
    { id: "s-upcoming", type: "upcoming", animate: "fade-up", title: "Upcoming", inMenu: true,
      props: {
        headline: "What's coming",
        items: [
          { date: "JUN 14", time: "9:00 PM ET", title: "Last Light · Ep 09", sub: "Episode drop · Watch", cta: "Remind me" },
          { date: "JUL 02", time: "Festival",   title: "Bluejay · 4K restoration", sub: "Festival debut · Marseille", cta: "Tickets" },
          { date: "AUG 01", time: "Production", title: "Untitled · feature",  sub: "Principal photography starts", cta: "Watchlist" },
        ],
      } },
    { id: "s-news", type: "blog", animate: "fade-up", title: "Notebook", inMenu: true,
      props: { headline: "Notebook",
        posts: [
          { date: "May 22, 2026", read: "8 min", title: "Why we shoot on safelight",   excerpt: "It's not nostalgia. It's that the wait teaches you what the photo is going to be.",
            body: "Digital shows you the frame before you've earned it. Under safelight there is a gap — thirty seconds, sometimes a full minute — where the image exists only as a guess. That gap is where the film gets made." },
          { date: "May 14, 2026", read: "5 min", title: "Working with Cina v3 for casting", excerpt: "The actor vault changed how we block. We can carry a face across every scene.",
            body: "We used to block scenes around availability. Now the vault carries a performer's face, voice, and gait across every setup, so blocking starts from the shot instead of the schedule." },
          { date: "May 03, 2026", read: "12 min", title: "Score lessons · 'Last Light'",    excerpt: "A note on writing for the held image. Three rules I broke. One I won't again.",
            body: "Rule one: never score the stare. Rule two: silence is a cue, not an absence. Rule three: if the theme survives being hummed badly, it's strong enough." },
        ],
      } },
    { id: "s-about", type: "about", animate: "fade-up", title: "About",
      props: { text: "Soren Voss makes films one frame at a time. Each is hand-developed in the studio under safelight, then scanned. The wait is part of the work." } },
    { id: "s-newsletter", type: "newsletter", animate: "fade-up",
      props: { headline: "A frame, once a month.",
        sub: "No spoilers. No selling. One image and a paragraph." } },
    { id: "s-contact", type: "contact", animate: "fade-up", title: "Contact", inMenu: true,
      props: { email: "studio@voss.cina", agent: "WME · Sara Lim",
        formEnabled: true, formHeadline: "Send a note", formSubline: "Reach the studio. I read everything." } },
    { id: "s-footer", type: "footer", animate: "none",
      props: {} },
  ];

  const workPage = wbMakePageTemplate("work", creator, "Work");
  const storePage = wbMakePageTemplate("store", creator, "Store");
  const aboutPage = wbMakePageTemplate("about", creator, "About");

  return {
    domain: (creator?.id || "voss") + ".cina",
    studioName: (creator?.name || "Voss") + " Studio",
    tier: "pro",
    logo: { kind: "wordmark" },
    theme: {
      bg: tkc("bg"),
      ink: tkc("ink"),
      accent: tkc("cat-3"),
      headlineFont: "display",
      bodyFont: "sans",
      fontScale: 1.0,
      spacing: 1.0,
      radius: 2,
      btnStyle: "solid",
      btnRadius: 2,
      grain: 0.35,
      columnWidth: 1180,
    },
    header: { preset: "wordmark-right", sticky: true, transparent: true },
    footer: { preset: "stacked-mono" },
    seo: {
      title: `${(creator?.name || "Voss")} Studio · Films & Editions`,
      description: "Official studio site — streaming releases, limited editions, schedule, and production notes.",
      ogImage: null,
    },
    defaultAnimation: "fade-up",
    activePageId: "home",
    pages: [
      {
        id: "home",
        title: "Home",
        slug: "",
        isHome: true,
        inMenu: true,
        seo: {
          title: `${(creator?.name || "Voss")} Studio · Official Site`,
          description: "Official studio website, film catalog, merch editions, and screenings.",
          ogImage: null,
          noIndex: false,
        },
        sections: homeSections,
      },
      workPage,
      storePage,
      aboutPage,
    ],
    sections: homeSections,
  };
};

// Normalize legacy single-page payloads into the multi-page model while
// keeping `site.sections` mirrored to whichever page is currently active.
function wbNormalizeSite(raw, creator) {
  const base = DEFAULT_PAGE_V2(creator);
  if (!raw || typeof raw !== "object") return base;
  const theme = { ...base.theme, ...(raw.theme || {}) };
  let pages = Array.isArray(raw.pages) && raw.pages.length ? raw.pages : null;
  if (!pages) {
    const legacySecs = Array.isArray(raw.sections) && raw.sections.length ? raw.sections : base.sections;
    pages = [
      {
        id: "home",
        title: "Home",
        slug: "",
        isHome: true,
        inMenu: true,
        seo: { ...(base.seo || {}), ...(raw.seo || {}) },
        sections: legacySecs,
      },
      ...base.pages.slice(1),
    ];
  }
  const activePageId = pages.some(p => p.id === raw.activePageId)
    ? raw.activePageId
    : (pages.find(p => p.isHome) || pages[0]).id;
  const active = pages.find(p => p.id === activePageId) || pages[0];
  return {
    ...base,
    ...raw,
    theme,
    pages,
    activePageId,
    sections: active ? active.sections : [],
  };
}

function wbActivePageObj(site) {
  if (!site) return null;
  const pages = Array.isArray(site.pages) ? site.pages : [];
  return pages.find(p => p.id === site.activePageId) || pages.find(p => p.isHome) || pages[0] || {
    id: "home", title: "Home", slug: "", isHome: true, inMenu: true,
    seo: site.seo || {},
    sections: site.sections || [],
  };
}

function wbSyncActiveSections(site, nextSections) {
  const pages = Array.isArray(site.pages) && site.pages.length
    ? site.pages
    : [{ id: "home", title: "Home", slug: "", isHome: true, inMenu: true, seo: site.seo || {}, sections: site.sections || [] }];
  const aid = site.activePageId || pages[0].id;
  const updatedPages = pages.map(pg => pg.id === aid ? { ...pg, sections: nextSections } : pg);
  return { ...site, pages: updatedPages, activePageId: aid, sections: nextSections };
}

function wbResolvePublishedPage(site, pageSlug) {
  const norm = wbNormalizeSite(site);
  if (!pageSlug) return norm.pages.find(p => p.isHome) || norm.pages[0];
  const want = String(pageSlug).toLowerCase();
  return norm.pages.find(p => String(p.slug || "").toLowerCase() === want || String(p.id || "").toLowerCase() === want)
    || norm.pages.find(p => p.isHome)
    || norm.pages[0];
}

// ─── Persistence ────────────────────────────────────────────────────────

const PAGES_LS_V2 = "cina:studio-pages-v2";
function loadPagesV2() {
  try { const s = localStorage.getItem(PAGES_LS_V2); return s ? JSON.parse(s) : {}; } catch { return {}; }
}
function savePagesV2(pages) {
  try { localStorage.setItem(PAGES_LS_V2, JSON.stringify(pages)); } catch {}
}

const PAGES_HIST_LS_V2 = "cina:studio-pages-v2-history";
function wbLoadSnapshotsV2(id) {
  try { return (JSON.parse(localStorage.getItem(PAGES_HIST_LS_V2) || "{}")[id]) || []; } catch { return []; }
}
function wbPushSnapshotV2(id, page) {
  try {
    const all = JSON.parse(localStorage.getItem(PAGES_HIST_LS_V2) || "{}");
    all[id] = [{ at: Date.now(), page }, ...(all[id] || [])].slice(0, 8);
    localStorage.setItem(PAGES_HIST_LS_V2, JSON.stringify(all));
  } catch {}
}

const SITE_INBOX_LS = "cina:site-inbox-v1";
function wbInboxLoad() {
  try { return JSON.parse(localStorage.getItem(SITE_INBOX_LS) || "null") || { messages: [], subscribers: [] }; }
  catch { return { messages: [], subscribers: [] }; }
}
function wbInboxPush(kind, entry) {
  try {
    const box = wbInboxLoad();
    box[kind] = [{ ...entry, at: Date.now() }, ...(box[kind] || [])].slice(0, 200);
    localStorage.setItem(SITE_INBOX_LS, JSON.stringify(box));
    window.dispatchEvent(new Event("cina:site-inbox"));
  } catch {}
}

// ─── Background image library ───────────────────────────────────────────

const BG_IMAGES = {
  "noir-rain":    { tint: tkc("blood"), film: "ll",        grain: "rain",  blurb: "Noir · rain on glass" },
  "sodium":       { tint: tkc("cat-3"), film: "carrion",   grain: "lamp",  blurb: "Sodium streetlight · dusk" },
  "desert":       { tint: tkc("cat-4"), film: "swallows",  grain: "dust",  blurb: "Desert · gold hour" },
  "darkroom":     { tint: tkc("blood"), film: "thefence",  grain: "vignette", blurb: "Darkroom · red safelight" },
  "ocean":        { tint: tkc("cat-1"), film: "drift",     grain: "fog",   blurb: "Ocean · cold morning" },
  "studio":       { tint: tkc("ink-3"), film: "marauder",  grain: "flat",  blurb: "Studio · charcoal cyc" },
  "snow":         { tint: tkc("ink"),   film: "verge",     grain: "flake", blurb: "Snow · grey daylight" },
  "smoke":        { tint: tkc("line-3"),film: "frequency", grain: "smoke", blurb: "Smoke · stage light" },
};

function bgPhotoKind(cfg) {
  if (!cfg || !cfg.film) return null;
  const f = (window.CATALOG || []).find(x => x.id === cfg.film);
  return f ? f.thumb : null;
}

function BgImage({ id, src, overlay = 0.5, parallaxY = 0, children }) {
  const cfg = BG_IMAGES[id] || BG_IMAGES["noir-rain"];
  const photoKind = bgPhotoKind(cfg);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: -40,
        background: `linear-gradient(135deg, ${cfg.tint}66, ${tkc("black")} 75%)`,
        transform: `translateY(${parallaxY}px)`,
        transition: "transform 0.08s linear",
      }}>
        {src ? (
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
        ) : photoKind && window.FrameThumb ? (
          <FrameThumb kind={photoKind} usePhoto/>
        ) : (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
          <defs>
            <radialGradient id={`bg-${id}`} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={cfg.tint} stopOpacity="0.65"/>
              <stop offset="55%" stopColor={tkc("black")} stopOpacity="0.85"/>
              <stop offset="100%" stopColor={tkc("black")} stopOpacity="1"/>
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="1600" height="900" fill={`url(#bg-${id})`}/>
        </svg>
        )}
      </div>
      <div style={{ position: "absolute", inset: 0, background: `rgba(8,8,10,${overlay})`, pointerEvents: "none" }}/>
      <div style={{ position: "relative", height: "100%" }}>{children}</div>
    </div>
  );
}

// ─── Animate-in wrapper ──────────────────────────────────────────────────

function AnimateIn({ kind = "fade-up", children, style }) {
  const ref = urbCo(null);
  const [shown, setShown] = usbCo(false);
  uebCo(() => {
    if (kind === "none" || !ref.current) { setShown(true); return; }
    const r = ref.current.getBoundingClientRect();
    if (r.top < (window.innerHeight || 800) && r.bottom > 0) { setShown(true); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { setShown(true); io.disconnect(); }
      });
    }, { threshold: 0.12 });
    io.observe(ref.current);
    const safety = setTimeout(() => { setShown(true); io.disconnect(); }, 700);
    return () => { io.disconnect(); clearTimeout(safety); };
  }, [kind]);
  const base = { transition: "transform 700ms cubic-bezier(.2,.7,.2,1), opacity 500ms ease-out", willChange: "transform, opacity" };
  const styles = (() => {
    switch (kind) {
      case "fade-in":    return { ...base, opacity: shown ? 1 : 0 };
      case "fade-up":    return { ...base, opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(32px)" };
      case "fade-down":  return { ...base, opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(-28px)" };
      case "slide-left": return { ...base, opacity: shown ? 1 : 0, transform: shown ? "translateX(0)" : "translateX(-32px)" };
      case "slide-right":return { ...base, opacity: shown ? 1 : 0, transform: shown ? "translateX(0)" : "translateX(32px)" };
      case "zoom":       return { ...base, opacity: shown ? 1 : 0, transform: shown ? "scale(1)" : "scale(0.97)" };
      case "blur":       return { ...base, opacity: shown ? 1 : 0, filter: shown ? "blur(0)" : "blur(10px)" };
      case "none":       return {};
      default:           return { ...base, opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(32px)" };
    }
  })();
  return <div ref={ref} style={{ ...styles, ...style }}>{children}</div>;
}

// ─── Header & Footer preset library ─────────────────────────────────────

const HEADER_PRESETS = [
  { id: "wordmark-right", name: "Wordmark · right menu",  blurb: "Classic editorial." },
  { id: "wordmark-center",name: "Wordmark · center menu", blurb: "Symmetrical, magazine." },
  { id: "logo-only",      name: "Logo only",              blurb: "Minimal. Menu in footer." },
  { id: "hamburger",      name: "Hamburger · left",       blurb: "Hidden until tapped." },
  { id: "split-bar",      name: "Split bar",              blurb: "Logo + menu + CTA on far right." },
  { id: "framed",         name: "Framed",                 blurb: "Hairline border under header." },
  { id: "transparent",    name: "Transparent overlay",    blurb: "Hero shows through." },
  { id: "ticker",         name: "Ticker + menu",          blurb: "Live banner above menu." },
  { id: "stacked-serif",  name: "Stacked serif",          blurb: "Big wordmark over centered menu." },
  { id: "pill-nav",       name: "Framed nav bar",         blurb: "Menu inside hairline frame." },
  { id: "sidebar-mark",   name: "Sidebar mark",           blurb: "Logo left, studio + menu right." },
];

const FOOTER_PRESETS = [
  { id: "stacked-mono",   name: "Stacked · mono",         blurb: "Three columns, mono labels." },
  { id: "single-line",    name: "Single line",            blurb: "Wordmark · year · social row." },
  { id: "big-cta",        name: "Big CTA",                blurb: "Newsletter block + minimal links." },
  { id: "manifesto",      name: "Manifesto",              blurb: "Studio credo, signed." },
  { id: "directory",      name: "Directory",              blurb: "All pages + contact + legal." },
  { id: "marquee-tail",   name: "Marquee tail",           blurb: "Scrolling ticker + mini menu." },
  { id: "centered-mark",  name: "Centered mark",          blurb: "Logo, one line, centered links." },
  { id: "two-tone",       name: "Two-tone band",          blurb: "Accent band over base." },
  { id: "minimal-legal",  name: "Minimal legal",          blurb: "Copyright and legal links." },
];

// ─── Default props per type ─────────────────────────────────────────────

function defaultPropsV2(type, creator) {
  switch (type) {
    case "hero":             return { kicker: (creator?.name || "Studio").toUpperCase(), title: creator?.name || "Studio", sub: "One sentence — your studio's point of view." };
    case "hero-parallax":    return { kicker: (creator?.name || "Studio").toUpperCase(), title: creator?.name || "Studio", sub: "One sentence — your studio's point of view.", bgImage: "sodium", overlay: 0.5, parallax: 0.4, cta: { label: "Watch the work", href: "#films" } };
    case "hero-video":       return { kicker: "NOW SHOWING", title: creator?.name || "Studio", sub: "Auto-playing reel backdrop.", filmId: "ll" };
    case "hero-split":       return { kicker: "STUDIO", title: creator?.name || "Studio", sub: "Image left, editorial copy right.", bgImage: "darkroom" };
    case "marquee":          return { text: "NEW WORK · STILL DEVELOPING · COMING SOON", speed: 22 };
    case "about":            return { text: "A few words about the studio, the process, and the lens." };
    case "press":            return { quotes: [{ source: "Sight & Sound", text: "A patient, formal command of the frame." }] };
    case "stats":            return { stats: [{ k: "Films", v: "6" }, { k: "Years", v: "11" }, { k: "Awards", v: "4" }] };
    case "timeline":         return { headline: "Career", items: [
      { year: "2019", title: "First short", sub: "Festival debut at Sundance" },
      { year: "2022", title: "First feature", sub: "Limited theatrical release" },
      { year: "2025", title: "First branched film", sub: "81 cuts · live audience room" },
    ] };
    case "featured":         return { filmId: "ll", ctaLabel: "Watch the film" };
    case "films":            return { headline: "Selected Works", creatorId: creator?.id || "voss", layout: "poster", count: 6 };
    case "branched-shelf":   return { headline: "Branched films · vote at every fork" };
    case "episodes-shelf":   return { headline: "Series · seasons" };
    case "trailers-shelf":   return { headline: "Trailers · short cuts" };
    case "gallery":          return { headline: "Stills", count: 8, filmId: "ll" };
    case "actor-vault":      return { headline: "The cast", subline: "Performers trained for this studio's films" };
    case "upcoming":         return { headline: "What's coming", items: [
      { date: "JUN 14", time: "9:00 PM", title: "Episode drop", sub: "Watch · Series", cta: "Remind me" },
      { date: "JUL 02", time: "Festival", title: "Festival premiere", sub: "Marseille", cta: "Tickets" },
    ] };
    case "news":             return { headline: "News & notes", posts: [
      { date: "May 22", title: "Notes from this week", excerpt: "What I'm working on and why." },
      { date: "May 14", title: "On directing under safelight", excerpt: "A short essay." },
    ] };
    case "holders":          return { headline: "Producers · holders" };
    case "newsletter":       return { headline: "Get a frame, monthly.", sub: "No spam. One image and a paragraph." };
    case "contact":          return { email: `studio@${creator?.id || "voss"}.cina`, agent: "WME · Sara Lim", phone: "+49 30 555 01 92", address: "Ritterstraße 12 · Berlin", hours: "Tue–Fri · 10–6 CET", formEnabled: true, formHeadline: "Send a note", formSubline: "Reach the studio directly." };
    case "faq":              return { headline: "Questions", items: [
      { q: "Where can I watch the films?", a: "Every finished film streams on this site and on the studio's Cina channel." },
      { q: "Do you take commissions?", a: "Select editorial or narrative commissions each year via the inquiry form." },
      { q: "Do posters and vinyl ship worldwide?", a: "Yes — fulfillment ships internationally in archival tubes and mailers." },
    ] };
    case "awards":           return { headline: "Selections", items: [
      { fest: "CANNES · SEMAINE", year: "2025", note: "Official selection" },
      { fest: "ROTTERDAM · IFFR", year: "2024", note: "Tiger competition" },
      { fest: "TELLURIDE",        year: "2024", note: "Premiere" },
      { fest: "NYFF",             year: "2023", note: "Main slate" },
    ] };
    case "logos":            return { items: ["VARIETY", "SIGHT & SOUND", "MUBI", "CRITERION", "INDIEWIRE"] };
    case "crew":             return { headline: "The crew", people: [
      { name: "N. Voss",     role: "Director · editor" },
      { name: "L. Ademi",    role: "Cinematography" },
      { name: "R. Sandoval", role: "Score" },
      { name: "H. Brandt",   role: "Production design" },
    ] };
    case "cta":              return { kicker: "NOW SHOWING", headline: "Watch the new film.", sub: "Streaming exclusively on this studio site.", label: "Watch now", href: "#films" };
    case "store":            return { headline: "Storefront", layout: "grid", showPrice: true, products: [
      { name: "Poster · Last Light", price: 42, color: tkc("blood"), kind: "POSTER" },
      { name: "OST · vinyl 2LP",     price: 48, color: "var(--c-amber)", kind: "VINYL" },
      { name: "Darkroom tee",        price: 36, color: tkc("panel-2"), kind: "APPAREL" },
    ] };
    case "shop-nft":         return { headline: "Available now · holder drops" };
    case "blog":             return { headline: "Notebook", posts: [
      { date: "May 22, 2026", read: "8 min", title: "Why we shoot on safelight", excerpt: "It's not nostalgia. It's that the wait teaches you what the frame will become." },
      { date: "May 14, 2026", read: "5 min", title: "Working with Cina v3 for casting", excerpt: "How persistent performance references changed blocking on set." },
      { date: "May 03, 2026", read: "12 min", title: "Score lessons · 'Last Light'", excerpt: "Three rules I broke while scoring the held close-up." },
    ] };
    case "spacer":           return { size: 72 };
    case "image":            return { src: null, filmId: "ll", caption: "", aspect: "21/9" };
    case "video":            return { filmId: "ll", caption: "", duration: "2:31" };
    case "footer":           return {};
    default:                 return {};
  }
}

function wbEffectiveTheme(theme, mode) {
  const bp = mode === "phone" ? "Mobile" : mode === "tablet" ? "Tablet" : null;
  if (!bp) return theme;
  const fs = theme["fontScale" + bp];
  const sp = theme["spacing" + bp];
  return {
    ...theme,
    fontScale: fs != null ? fs : theme.fontScale,
    spacing: sp != null ? sp : theme.spacing,
  };
}

// ─── Primitives ─────────────────────────────────────────────────────────

const inpV2 = {
  width: "100%", background: "var(--c-bg)", border: "1px solid var(--c-line-2)",
  borderRadius: "2px", padding: "8px 10px", color: "var(--c-ink)",
  fontSize: "var(--fs-body)", fontFamily: "var(--f-sans)", outline: "none",
  boxSizing: "border-box",
};
const smBtnV2 = {
  padding: "7px 12px", background: "transparent",
  border: "1px solid var(--c-line-2)", borderRadius: "2px",
  color: "var(--c-ink-2)", fontSize: "var(--fs-label)", cursor: "pointer",
  fontFamily: "var(--f-mono)", letterSpacing: ".14em", textTransform: "uppercase",
  whiteSpace: "nowrap",
};
const smallTool = {
  padding: "8px 10px", background: "var(--c-bg)",
  border: "1px solid var(--c-line-2)", borderRadius: "2px",
  color: "var(--c-ink-2)", fontSize: "var(--fs-label)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  fontFamily: "var(--f-mono)", letterSpacing: ".14em", fontWeight: 600,
  whiteSpace: "nowrap",
};

function FieldV2({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)", letterSpacing: ".14em", textTransform: "uppercase" }}>{label}</span>
      <div>{children}</div>
    </label>
  );
}

function InsGroup({ n, label, open, onToggle, children, badge, tabbed }) {
  if (tabbed) return open ? <section role="tabpanel" aria-label={label} style={{ display: "flex", flexDirection: "column", gap: 18, padding: "18px 2px" }}>{children}</section> : null;
  return (
    <section style={{ borderTop: "1px solid var(--c-line)" }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "14px 2px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".14em", color: open ? "var(--c-ink)" : "var(--c-ink-3)", fontWeight: 600, textTransform: "uppercase" }}>{label}</span>
        {badge && <span className="t-mono" style={{ fontSize: "var(--fs-label)", letterSpacing: ".14em", color: "var(--c-amber)" }}>{badge}</span>}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ marginLeft: "auto", color: open ? "var(--c-amber)" : "var(--c-ink-4)", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "2px 2px 18px" }}>{children}</div>}
    </section>
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)", letterSpacing: ".14em" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--c-bg)", border: "1px solid var(--c-line-2)", borderRadius: "2px", padding: "4px 6px", minWidth: 0 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 24, height: 24, border: "none", padding: 0, background: "transparent", cursor: "pointer", flexShrink: 0 }}/>
        <input value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", color: "var(--c-ink)", fontFamily: "var(--f-mono)", fontSize: "var(--fs-label)", minWidth: 0, width: "100%", outline: "none" }}/>
      </div>
    </label>
  );
}

function SliderV2({ label, min, max, step, value, onChange, fmt }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-2)" }}>{label}</span>
        <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-3)", fontVariantNumeric: "tabular-nums" }}>{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: "100%", accentColor: tkc("amber") }}/>
    </div>
  );
}

function SelectV2({ label, value, onChange, options }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <span className="t-mono" style={{ fontSize: "var(--fs-label)", color: "var(--c-ink-4)", letterSpacing: ".14em" }}>{label.toUpperCase()}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} style={inpV2}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function ToggleV2({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", background: value ? "rgba(var(--accent-rgb),.08)" : "transparent", border: "1px solid var(--c-line)", borderRadius: "2px", flex: 1 }}>
      <span style={{
        width: 28, height: 15, borderRadius: "2px", padding: 1.5,
        background: value ? "var(--c-amber)" : "var(--c-panel-3)",
        position: "relative", transition: "background .15s",
        flexShrink: 0,
      }}>
        <span style={{
          display: "block", width: 12, height: 12, borderRadius: "1px", background: value ? tkc("on-amber") : "var(--c-ink-3)",
          transform: value ? "translateX(13px)" : "translateX(0)",
          transition: "transform .15s",
        }}/>
      </span>
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} style={{ display: "none" }}/>
      <span style={{ fontSize: "var(--fs-body)", color: "var(--c-ink-2)" }}>{label}</span>
    </label>
  );
}

Object.assign(window, {
  BLOCK_LIBRARY_V2, WB_TIERS, wbTier, WB_BG_SWATCHES, WB_ACCENT_SWATCHES, WB_GLOBAL_PALETTES,
  WB_FONTS, WB_FONT_PAIRINGS, wbFont, wbBtnCss, wbRadiusPx,
  DEFAULT_MERCH_CATALOG, wbSeedStoreIfNeeded, wbLoadStoreCatalog, wbSaveStoreCatalog,
  DEFAULT_STORE_SETTINGS, wbLoadStoreSettings, wbSaveStoreSettings,
  wbSlugify, wbMakePageTemplate, DEFAULT_PAGE_V2, wbNormalizeSite, wbActivePageObj, wbSyncActiveSections, wbResolvePublishedPage,
  loadPagesV2, savePagesV2, wbLoadSnapshotsV2, wbPushSnapshotV2, wbInboxPush,
  BG_IMAGES, BgImage, AnimateIn, HEADER_PRESETS, FOOTER_PRESETS,
  defaultPropsV2, wbEffectiveTheme, inpV2, smBtnV2, smallTool, FieldV2, InsGroup, ColorRow, SliderV2, SelectV2, ToggleV2,
});
