// builder-app.jsx — Squarespace-caliber Editorial Fluid Workspace with docked Left & Right rails,
// Visual Drag-and-Drop Section Palette, Multi-Page Manager, Global Design System & Integrated Merch Catalog.

const { useState: usbAp, useEffect: uebAp, useMemo: umbAp, useRef: urbAp } = React;

function StudioBuilder({ creatorId }) {
  const creator = (typeof CREATORS !== "undefined" && CREATORS.find(c => c.id === creatorId))
    || (typeof CREATORS !== "undefined" && CREATORS[0])
    || { id: creatorId || "voss", name: "Studio" };

  const [pages, setPages] = usbAp(loadPagesV2);
  const draftKey = "cina:builder-draft-v2";
  const loadDraft = () => {
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) || "{}");
      return d && d[creator.id] ? d[creator.id] : null;
    } catch {
      return null;
    }
  };
  const initialRaw = loadDraft() || pages[creator.id] || DEFAULT_PAGE_V2(creator);
  const initial = wbNormalizeSite(initialRaw, creator);

  const [page, setPage] = usbAp(initial);
  const [selectedId, setSelectedId] = usbAp(null);
  const [editMode, setEditMode] = usbAp(true);
  const [previewMode, setPreviewMode] = usbAp("desktop");
  const [dirty, setDirty] = usbAp(false);

  // Docked Left Rail state
  const [leftTab, setLeftTab] = usbAp("pages"); // "pages" | "add" | "design" | "store"
  const [paletteSub, setPaletteSub] = usbAp("blocks"); // "blocks" | "layouts"
  const [paletteCat, setPaletteCat] = usbAp("All");
  const [paletteQuery, setPaletteQuery] = usbAp("");
  const [addPageOpen, setAddPageOpen] = usbAp(false);

  // Docked Right Inspector tab (when no section is selected)
  const [rightDesignTab, setRightDesignTab] = usbAp("colors");

  // Optional overlays (never auto-opened on mount)
  const [insertOpen, setInsertOpen] = usbAp(false);
  const [insertCat, setInsertCat] = usbAp("Heroes");
  const [insertAfter, setInsertAfter] = usbAp(null);
  const [insertTab, setInsertTab] = usbAp("blocks");
  const [aiOpen, setAiOpen] = usbAp(false);
  const [goLiveOpen, setGoLiveOpen] = usbAp(false);
  const [logoStudioOpen, setLogoStudioOpen] = usbAp(false);
  const [versionsOpen, setVersionsOpen] = usbAp(false);
  const [wizardOpen, setWizardOpen] = usbAp(false);
  const [planOpen, setPlanOpen] = usbAp(false);
  const [showMobileOutline, setShowMobileOutline] = usbAp(false);
  const [showMobileInspector, setShowMobileInspector] = usbAp(false);

  // Responsive viewport listener
  const [uiW, setUiW] = usbAp(typeof window !== "undefined" ? window.innerWidth : 1400);
  uebAp(() => {
    const on = () => setUiW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const compactUI = uiW < 1080;
  const phoneUI = uiW < 720;

  // Derived active page & sections
  const activePage = umbAp(() => wbActivePageObj(page), [page]);
  const activeSections = activePage.sections || [];
  const selected = activeSections.find(s => s.id === selectedId) || null;

  // ── Integrated Merch Storefront Catalog Sync ─────────────────────────────
  const [storeCatalog, setStoreCatalog] = usbAp(() => {
    if (window.wbSeedStoreIfNeeded) window.wbSeedStoreIfNeeded(creator.id);
    return window.wbLoadStoreCatalog ? window.wbLoadStoreCatalog(creator.id) : [];
  });
  const [editingProdId, setEditingProdId] = usbAp(null);

  uebAp(() => {
    const reload = () => {
      if (window.wbLoadStoreCatalog) setStoreCatalog(window.wbLoadStoreCatalog(creator.id));
    };
    window.addEventListener("cina:store-changed", reload);
    return () => window.removeEventListener("cina:store-changed", reload);
  }, [creator.id]);

  const persistCatalog = (nextList) => {
    setStoreCatalog(nextList);
    if (window.wbSaveStoreCatalog) window.wbSaveStoreCatalog(nextList);
  };

  const addNewProduct = () => {
    const id = "m-" + Math.random().toString(36).slice(2, 7);
    const prod = {
      id,
      creatorId: creator.id,
      title: "Limited Studio Edition",
      price: 45,
      kind: "PRINT",
      badge: "NEW",
      status: "active",
      color: page.theme?.accent || "#E48D3C",
      description: "Archival release numbered from the studio archive.",
      image: null,
    };
    const next = [prod, ...storeCatalog];
    persistCatalog(next);
    setEditingProdId(id);
    if (window.toast) window.toast({ title: "PRODUCT ADDED", text: "Synced live to Merch Storefront blocks.", kind: "good" });
  };

  const updateProduct = (id, patch) => {
    persistCatalog(storeCatalog.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const deleteProduct = (id) => {
    persistCatalog(storeCatalog.filter(p => p.id !== id));
    if (editingProdId === id) setEditingProdId(null);
  };

  // Saved sections reloader for Left Palette
  const [savedSecsTick, setSavedSecsTick] = usbAp(0);
  uebAp(() => {
    const h = () => setSavedSecsTick(t => t + 1);
    window.addEventListener("cina:saved-sections-changed", h);
    return () => window.removeEventListener("cina:saved-sections-changed", h);
  }, []);
  const savedSections = umbAp(() => {
    try { const v = JSON.parse(localStorage.getItem("cina:builder-saved-sections-v1") || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
  }, [savedSecsTick]);

  // ── Undo / Redo History ──────────────────────────────────────────────────
  const history = urbAp({ past: [], future: [] });
  const prevPageRef = urbAp(page);
  const skipHistory = urbAp(false);
  const [, setHistTick] = usbAp(0);

  uebAp(() => {
    const prev = prevPageRef.current;
    if (prev !== page) {
      setDirty(true);
      if (!skipHistory.current) {
        history.current.past.push(prev);
        if (history.current.past.length > 80) history.current.past.shift();
        history.current.future = [];
        setHistTick(t => t + 1);
      }
    }
    skipHistory.current = false;
    prevPageRef.current = page;
  }, [page]);

  // Debounced Draft Autosave
  uebAp(() => {
    const h = setTimeout(() => {
      try {
        const d = JSON.parse(localStorage.getItem(draftKey) || "{}");
        d[creator.id] = page;
        localStorage.setItem(draftKey, JSON.stringify(d));
        window.__wbDraftFail = false;
      } catch {}
    }, 650);
    return () => clearTimeout(h);
  }, [page, creator.id]);

  const undo = () => {
    const h = history.current;
    if (!h.past.length) return;
    const prev = h.past.pop();
    h.future.push(page);
    skipHistory.current = true;
    setPage(prev);
    setHistTick(t => t + 1);
  };
  const redo = () => {
    const h = history.current;
    if (!h.future.length) return;
    const next = h.future.pop();
    h.past.push(page);
    skipHistory.current = true;
    setPage(next);
    setHistTick(t => t + 1);
  };

  // ── Global Design & Active Page Section Mutations ────────────────────────
  const updatePage = (patch) => setPage(p => ({ ...p, ...patch }));
  const updateTheme = (patch) => setPage(p => ({ ...p, theme: { ...p.theme, ...patch } }));
  const updateHeader = (patch) => setPage(p => ({ ...p, header: { ...p.header, ...patch } }));
  const updateFooter = (patch) => setPage(p => ({ ...p, footer: { ...p.footer, ...patch } }));

  const setActiveSections = (updater) => {
    setPage(p => {
      const cur = wbActivePageObj(p).sections || [];
      const next = typeof updater === "function" ? updater(cur) : updater;
      return wbSyncActiveSections(p, next);
    });
  };

  const updateSection = (id, patch) => setActiveSections(secs =>
    secs.map(s => s.id === id ? { ...s, props: { ...s.props, ...patch } } : s)
  );
  const updateSectionMeta = (id, patch) => setActiveSections(secs =>
    secs.map(s => s.id === id ? { ...s, ...patch } : s)
  );
  const removeSection = (id) => {
    setActiveSections(secs => secs.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  const duplicateSection = (id) => {
    const copyId = "s" + Math.random().toString(36).slice(2, 7);
    setActiveSections(secs => {
      const i = secs.findIndex(s => s.id === id);
      if (i < 0) return secs;
      const src = secs[i];
      const copy = { ...src, id: copyId, props: { ...src.props } };
      const next = [...secs];
      next.splice(i + 1, 0, copy);
      return next;
    });
    setSelectedId(copyId);
  };
  const moveSection = (id, dir) => setActiveSections(secs => {
    const i = secs.findIndex(s => s.id === id);
    const j = i + dir;
    if (j < 0 || j >= secs.length) return secs;
    const next = [...secs];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const buildNewSection = (type, patch) => {
    const id = "s" + Math.random().toString(36).slice(2, 7);
    const metaPatch = (patch && patch.metaPatch) || {};
    const propsPatch = (patch && patch.propsPatch) || {};
    return {
      id,
      type,
      animate: page.defaultAnimation || "fade-up",
      ...(type === "marquee" ? { width: "full", pad: "none", margin: "none" } : {}),
      props: { ...defaultPropsV2(type, creator), ...propsPatch },
      ...metaPatch,
    };
  };

  const materializeSpec = (spec) => {
    const id = "s" + Math.random().toString(36).slice(2, 7);
    const { type, props, ...meta } = spec;
    return {
      id,
      type,
      animate: spec.animate || page.defaultAnimation || "fade-up",
      props: { ...defaultPropsV2(type, creator), ...(props || {}) },
      ...meta,
    };
  };

  const checkSectionCap = () => {
    const lim = wbTier(page);
    if (activeSections.length >= lim.maxSections) {
      if (window.toast) window.toast({ title: "PLAN LIMIT", text: `Free caps at ${lim.maxSections} sections. Upgrade to Pro for unlimited.`, kind: "warn" });
      updatePage({ _upsell: { reason: "sections", at: Date.now() } });
      return false;
    }
    return true;
  };

  const insertSection = (type, afterId, patch) => {
    if (!checkSectionCap()) { setInsertOpen(false); return; }
    const newSec = buildNewSection(type, patch);
    setActiveSections(secs => {
      const i = afterId ? secs.findIndex(s => s.id === afterId) : secs.length - 1;
      const next = [...secs];
      next.splice(i + 1, 0, newSec);
      return next;
    });
    setInsertOpen(false);
    setSelectedId(newSec.id);
    if (compactUI) { setShowMobileOutline(false); setShowMobileInspector(true); }
  };

  const insertSpec = (spec, afterId) => {
    if (!checkSectionCap()) { setInsertOpen(false); return; }
    const sec = materializeSpec(spec);
    setActiveSections(secs => {
      const i = afterId ? secs.findIndex(s => s.id === afterId) : secs.length - 1;
      const next = [...secs];
      next.splice(i + 1, 0, sec);
      return next;
    });
    setInsertOpen(false);
    setSelectedId(sec.id);
  };

  const insertSectionAt = (payload, insertIdx) => {
    if (!checkSectionCap()) return;
    const sec = payload.kind === "saved" && payload.spec
      ? materializeSpec(payload.spec)
      : buildNewSection(payload.type, payload.patch || {});
    setActiveSections(secs => {
      const idx = Math.max(0, Math.min(secs.length, insertIdx != null ? insertIdx : secs.length));
      const next = [...secs];
      next.splice(idx, 0, sec);
      return next;
    });
    setSelectedId(sec.id);
    setEditMode(true);
  };

  const applyTemplate = (tpl) => {
    const lim = wbTier(page);
    let specs = tpl.specs || [];
    const capped = specs.length > lim.maxSections;
    if (capped) specs = specs.slice(0, lim.maxSections);
    const sections = specs.map(materializeSpec);
    setActiveSections(sections);
    setInsertOpen(false);
    setSelectedId(null);
    if (window.toast) {
      window.toast(capped
        ? { title: "PLAN LIMIT", text: `"${tpl.name}" trimmed to ${lim.maxSections} sections on Free tier.`, kind: "warn" }
        : { title: "LAYOUT APPLIED", text: `"${tpl.name}" applied to ${activePage.title} · Theme preserved.`, kind: "good" });
    }
  };

  const saveSectionAsTemplate = (id) => {
    const sec = activeSections.find(s => s.id === id);
    if (sec && window.wbSaveSection) window.wbSaveSection(sec);
  };

  // ── Multi-Page Management ────────────────────────────────────────────────
  const switchPage = (pageId) => {
    setPage(p => {
      const pagesList = p.pages || [];
      const target = pagesList.find(pg => pg.id === pageId);
      if (!target) return p;
      return { ...p, activePageId: pageId, sections: target.sections || [] };
    });
    setSelectedId(null);
  };

  const createNewPage = (tplKey) => {
    const labels = {
      blank: "New Page",
      work: "Films",
      store: "Store",
      about: "About",
      journal: "Journal",
      contact: "Contact",
    };
    const existingSlugs = new Set((page.pages || []).map(pg => pg.slug));
    let baseSlug = tplKey === "blank" ? "page" : tplKey;
    let slug = baseSlug;
    let n = 2;
    while (existingSlugs.has(slug)) { slug = `${baseSlug}-${n}`; n++; }
    const created = wbMakePageTemplate(tplKey, creator, labels[tplKey] || "Page");
    created.id = "pg-" + Math.random().toString(36).slice(2, 7);
    created.slug = slug;
    if (n > 2) created.title = `${created.title} ${n - 1}`;
    setPage(p => ({
      ...p,
      pages: [...(p.pages || []), created],
      activePageId: created.id,
      sections: created.sections || [],
    }));
    setAddPageOpen(false);
    setSelectedId(null);
    setRightDesignTab("seo");
  };

  const updatePageMeta = (pageId, patch) => {
    setPage(p => {
      const nextPages = (p.pages || []).map(pg => {
        if (pg.id !== pageId) return pg;
        const merged = { ...pg, ...patch };
        if (merged.isHome) merged.slug = "";
        return merged;
      });
      const updatedTarget = nextPages.find(pg => pg.id === pageId);
      return {
        ...p,
        pages: nextPages,
        ...(updatedTarget && updatedTarget.isHome && patch.seo ? { seo: { ...(p.seo || {}), ...patch.seo } } : {}),
      };
    });
  };

  const setHomePage = (pageId) => {
    setPage(p => ({
      ...p,
      pages: (p.pages || []).map(pg => {
        if (pg.id === pageId) return { ...pg, isHome: true, slug: "" };
        if (pg.isHome) return { ...pg, isHome: false, slug: pg.slug || wbSlugify(pg.title || "home") || "home" };
        return pg;
      }),
    }));
  };

  const movePageOrder = (pageId, dir) => {
    setPage(p => {
      const list = [...(p.pages || [])];
      const i = list.findIndex(pg => pg.id === pageId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return p;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...p, pages: list };
    });
  };

  const duplicateSitePage = (pageId) => {
    setPage(p => {
      const list = p.pages || [];
      const src = list.find(pg => pg.id === pageId);
      if (!src) return p;
      const copyId = "pg-" + Math.random().toString(36).slice(2, 7);
      const baseSlug = wbSlugify(src.slug || src.title || "page") + "-copy";
      const copySecs = (src.sections || []).map(s => ({ ...s, id: "s" + Math.random().toString(36).slice(2, 7), props: { ...s.props } }));
      const copy = {
        ...src,
        id: copyId,
        title: `${src.title} Copy`,
        slug: baseSlug,
        isHome: false,
        sections: copySecs,
      };
      return { ...p, pages: [...list, copy], activePageId: copyId, sections: copySecs };
    });
    setSelectedId(null);
  };

  const deleteSitePage = (pageId) => {
    setPage(p => {
      const list = p.pages || [];
      const target = list.find(pg => pg.id === pageId);
      if (!target || target.isHome || list.length <= 1) return p;
      const nextPages = list.filter(pg => pg.id !== pageId);
      const nextActive = p.activePageId === pageId ? (nextPages.find(pg => pg.isHome) || nextPages[0]) : nextPages.find(pg => pg.id === p.activePageId);
      return {
        ...p,
        pages: nextPages,
        activePageId: nextActive.id,
        sections: nextActive.sections || [],
      };
    });
    setSelectedId(null);
  };

  // ── Publish & Live Navigation ────────────────────────────────────────────
  const publish = () => {
    const synced = wbSyncActiveSections(page, activeSections);
    const next = { ...pages, [creator.id]: synced };
    setPages(next);
    savePagesV2(next);
    setDirty(false);
    wbPushSnapshotV2(creator.id, synced);
    window.dispatchEvent(new Event("cina:site-published"));
    if (window.toast) window.toast({ title: "SITE PUBLISHED", text: `${page.studioName} → ${page.domain} is live`, kind: "good" });
  };

  const viewLive = () => {
    const synced = wbSyncActiveSections(page, activeSections);
    const next = { ...pages, [creator.id]: synced };
    setPages(next);
    savePagesV2(next);
    setDirty(false);
    window.dispatchEvent(new Event("cina:site-published"));
    const dest = activePage && !activePage.isHome && activePage.slug
      ? `/site/${creator.id}/${activePage.slug}`
      : `/site/${creator.id}`;
    if (window.navigate) window.navigate(dest);
    else window.location.hash = `#${dest}`;
  };

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────
  uebAp(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault(); redo();
      } else if (mod && e.key.toLowerCase() === "d" && selectedId && !typing) {
        e.preventDefault(); duplicateSection(selectedId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !typing) {
        e.preventDefault(); removeSection(selectedId);
      } else if (e.key === "Escape" && !typing) {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, page, activePage]);

  // ── Section Layer Drag Reorder ───────────────────────────────────────────
  const dragId = urbAp(null);
  const [draggingId, setDraggingId] = usbAp(null);
  const [dropTarget, setDropTarget] = usbAp(null);

  const onDragStart = (e, id) => {
    dragId.current = id;
    setDraggingId(id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", id); } catch {}
    }
  };
  const onDragOverItem = (e, overId) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (!dragId.current || overId === dragId.current) { if (dropTarget) setDropTarget(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientY - r.top) < r.height / 2 ? "before" : "after";
    setDropTarget(prev => (prev && prev.id === overId && prev.pos === pos) ? prev : { id: overId, pos });
  };
  const onDragEnd = () => { dragId.current = null; setDraggingId(null); setDropTarget(null); };
  const commitDrop = (e) => {
    if (e) e.preventDefault();
    const from = dragId.current, dt = dropTarget;
    if (!from || !dt) { onDragEnd(); return; }
    setActiveSections(secs => {
      const arr = [...secs];
      const fromI = arr.findIndex(s => s.id === from);
      if (fromI < 0) return secs;
      const [moved] = arr.splice(fromI, 1);
      let toI = arr.findIndex(s => s.id === dt.id);
      if (toI < 0) return secs;
      if (dt.pos === "after") toI += 1;
      arr.splice(toI, 0, moved);
      return arr;
    });
    onDragEnd();
  };

  // Filtered Palette Blocks
  const filteredPaletteBlocks = umbAp(() => {
    const q = paletteQuery.trim().toLowerCase();
    return (BLOCK_LIBRARY_V2 || []).filter(b => {
      if (paletteCat !== "All" && b.cat !== paletteCat) return false;
      if (!q) return true;
      return `${b.name} ${b.desc} ${b.cat}`.toLowerCase().includes(q);
    });
  }, [paletteCat, paletteQuery]);

  // ── Left Rail Navigation Icons ───────────────────────────────────────────
  const NAV_ITEMS = [
    { id: "pages",  label: "Pages",  svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { id: "add",    label: "Add",    svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M17.5 14v7M14 17.5h7"/></svg> },
    { id: "design", label: "Design", svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="14" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="14" r="1.5" fill="currentColor"/></svg> },
    { id: "store",  label: "Store",  svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg> },
  ];

  // Ensure a Merch Storefront section exists or focus it
  const focusOrInsertStore = () => {
    const existing = activeSections.find(s => s.type === "store");
    if (existing) {
      setSelectedId(existing.id);
      if (window.toast) window.toast({ title: "MERCH STOREFRONT", text: `Focused storefront on "${activePage.title}".`, kind: "good" });
    } else {
      insertSection("store", activeSections.length ? activeSections[activeSections.length - 1].id : null);
    }
  };

  // ── Left Workspace Panel Content ─────────────────────────────────────────
  const leftWorkspaceContent = (
    <div style={{ display: "flex", height: "100%", minHeight: 0, overflow: "hidden" }}>
      {/* Slim Vertical Icon Rail (58px) */}
      <nav aria-label="Builder workspace navigation" style={{
        width: 58, flexShrink: 0, borderRight: "1px solid var(--c-line)", background: "var(--c-bg)",
        display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", gap: 6,
      }}>
        <button
          onClick={() => { if (window.navigate) window.navigate("/"); else window.location.hash = "#/"; }}
          title="Back to Cina Cinema"
          style={{
            width: 42, height: 34, marginBottom: 4, borderRadius: 2, background: "transparent",
            border: "1px solid var(--c-line)", color: "var(--c-ink-3)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        {NAV_ITEMS.map(item => {
          const on = leftTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setLeftTab(item.id)}
              title={item.label}
              aria-pressed={on}
              style={{
                width: 48, padding: "8px 2px", borderRadius: 2, cursor: "pointer",
                background: on ? "rgba(var(--accent-rgb),.12)" : "transparent",
                border: `1px solid ${on ? "var(--c-amber)" : "transparent"}`,
                color: on ? "var(--c-amber)" : "var(--c-ink-3)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              {item.svg}
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: on ? 700 : 500 }}>
                {item.label}
              </span>
            </button>
          );
        })}

        <span style={{ flex: 1 }}/>

        <button
          onClick={() => setLogoStudioOpen(true)}
          title="Studio Wordmark & Logo"
          style={{
            width: 46, padding: "7px 2px", borderRadius: 2, cursor: "pointer",
            background: "transparent", border: "1px solid var(--c-line)", color: "var(--c-ink-3)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}
        >
          <Icon name="spark" size={14}/>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 8.5, textTransform: "uppercase" }}>Logo</span>
        </button>

        <button
          onClick={() => setWizardOpen(true)}
          title="Guided Studio Setup Wizard"
          style={{
            width: 46, padding: "7px 2px", borderRadius: 2, cursor: "pointer",
            background: "transparent", border: "1px solid var(--c-line)", color: "var(--c-ink-3)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}
        >
          <Icon name="sparkles" size={14}/>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 8.5, textTransform: "uppercase" }}>Setup</span>
        </button>
      </nav>

      {/* Active Left Docked Drawer */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--c-panel)" }}>
        {/* Studio Header */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--c-line)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span className="t-mono" style={{ fontSize: 10, color: "var(--c-amber)", letterSpacing: ".14em" }}>
              {leftTab === "pages" ? "PAGES & LAYERS" : leftTab === "add" ? "SECTION PALETTE" : leftTab === "design" ? "DESIGN SYSTEM" : "MERCH CATALOG"}
            </span>
            <span className="t-mono" style={{ fontSize: 10, color: "var(--c-ink-4)" }}>{page.domain}</span>
          </div>
          <div className="t-display" style={{ fontStyle: "italic", fontSize: 20, color: "var(--c-ink)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {page.studioName}
          </div>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>

          {/* ── TAB 1: MULTI-PAGE MANAGER + ACTIVE PAGE LAYERS ── */}
          {leftTab === "pages" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="t-mono" style={{ fontSize: 10.5, color: "var(--c-ink-3)", letterSpacing: ".14em" }}>SITE PAGES · {(page.pages || []).length}</span>
                  <button
                    onClick={() => setAddPageOpen(o => !o)}
                    style={{
                      padding: "4px 9px", background: addPageOpen ? "var(--c-amber)" : "var(--c-bg)",
                      color: addPageOpen ? tkc("on-amber") : "var(--c-amber)",
                      border: "1px solid rgba(var(--accent-rgb),.45)", borderRadius: 2, cursor: "pointer",
                      fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".1em", fontWeight: 700,
                    }}
                  >{addPageOpen ? "CLOSE" : "+ NEW PAGE"}</button>
                </div>

                {addPageOpen && (
                  <div style={{ padding: 10, marginBottom: 10, background: "var(--c-bg)", border: "1px solid var(--c-amber)", borderRadius: 2 }}>
                    <div className="t-mono" style={{ fontSize: 10, color: "var(--c-amber)", letterSpacing: ".12em", marginBottom: 8 }}>CHOOSE PAGE STARTER</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                      {[
                        ["blank", "Blank Page"],
                        ["work", "Film Catalog"],
                        ["store", "Merch Store"],
                        ["about", "About & EPK"],
                        ["journal", "Journal"],
                        ["contact", "Contact"],
                      ].map(([k, lbl]) => (
                        <button key={k} onClick={() => createNewPage(k)} style={{
                          padding: "7px 8px", textAlign: "left", background: "var(--c-panel-2)", border: "1px solid var(--c-line-2)",
                          borderRadius: 2, color: "var(--c-ink)", cursor: "pointer", fontSize: 11.5, fontWeight: 500,
                        }}>+ {lbl}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(page.pages || []).map((pg, idx) => {
                    const isCur = pg.id === activePage.id;
                    return (
                      <div
                        key={pg.id}
                        style={{
                          padding: "8px 9px", borderRadius: 2,
                          background: isCur ? "rgba(var(--accent-rgb),.09)" : "var(--c-bg)",
                          border: `1px solid ${isCur ? "var(--c-amber)" : "var(--c-line)"}`,
                          display: "flex", flexDirection: "column", gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            onClick={() => switchPage(pg.id)}
                            style={{
                              flex: 1, minWidth: 0, all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                            }}
                          >
                            <span style={{ color: pg.isHome ? "var(--c-amber)" : "var(--c-ink-4)", fontSize: 12, width: 14, flexShrink: 0 }}>{pg.isHome ? "⌂" : "•"}</span>
                            <span style={{ fontSize: 13, fontWeight: isCur ? 600 : 400, color: isCur ? "var(--c-ink)" : "var(--c-ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {pg.title}
                            </span>
                            <span className="t-mono" style={{ fontSize: 10, color: "var(--c-ink-4)", marginLeft: "auto", flexShrink: 0 }}>
                              {pg.isHome ? "/" : `/${pg.slug}`}
                            </span>
                          </button>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            onClick={() => updatePageMeta(pg.id, { inMenu: pg.inMenu === false })}
                            title={pg.inMenu !== false ? "Visible in site header navigation" : "Hidden from site header navigation"}
                            style={{
                              padding: "2px 6px", borderRadius: 2, cursor: "pointer",
                              background: pg.inMenu !== false ? "rgba(var(--accent-rgb),.1)" : "transparent",
                              border: `1px solid ${pg.inMenu !== false ? "rgba(var(--accent-rgb),.4)" : "var(--c-line-2)"}`,
                              color: pg.inMenu !== false ? "var(--c-amber)" : "var(--c-ink-4)",
                              fontFamily: "var(--f-mono)", fontSize: 9.5, letterSpacing: ".08em",
                            }}
                          >{pg.inMenu !== false ? "NAV ON" : "HIDDEN"}</button>

                          <button
                            onClick={() => { switchPage(pg.id); setSelectedId(null); setRightDesignTab("seo"); if (compactUI) { setShowMobileOutline(false); setShowMobileInspector(true); } }}
                            title="Edit page SEO, slug & social unfurl"
                            style={{
                              padding: "2px 6px", borderRadius: 2, cursor: "pointer", background: "transparent",
                              border: "1px solid var(--c-line-2)", color: "var(--c-ink-3)", fontFamily: "var(--f-mono)", fontSize: 9.5,
                            }}
                          >SEO</button>

                          <span style={{ flex: 1 }}/>

                          <button onClick={() => movePageOrder(pg.id, -1)} disabled={idx === 0} title="Move left in nav" style={{ ...smBtnV2, padding: "1px 5px", fontSize: 10 }}>↑</button>
                          <button onClick={() => movePageOrder(pg.id, 1)}  disabled={idx === (page.pages || []).length - 1} title="Move right in nav" style={{ ...smBtnV2, padding: "1px 5px", fontSize: 10 }}>↓</button>
                          <button onClick={() => duplicateSitePage(pg.id)} title="Duplicate page" style={{ ...smBtnV2, padding: "1px 5px", fontSize: 10 }}>⧉</button>
                          {!pg.isHome && (
                            <>
                              <button onClick={() => setHomePage(pg.id)} title="Set as Home page" style={{ ...smBtnV2, padding: "1px 5px", fontSize: 10 }}>⌂</button>
                              <button onClick={() => deleteSitePage(pg.id)} title="Delete page" style={{ ...smBtnV2, padding: "1px 5px", fontSize: 10, color: "var(--c-blood-l)", borderColor: "var(--c-blood)" }}>×</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Page Layers */}
              <div style={{ borderTop: "1px solid var(--c-line)", paddingTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="t-mono" style={{ fontSize: 10.5, color: "var(--c-ink-3)", letterSpacing: ".14em" }}>
                    LAYERS · {activePage.title.toUpperCase()} ({activeSections.length})
                  </span>
                  <button onClick={() => setLeftTab("add")} style={{ background: "transparent", border: "none", color: "var(--c-amber)", cursor: "pointer", fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".08em" }}>+ ADD</button>
                </div>

                {activeSections.map((s) => {
                  const meta = (BLOCK_LIBRARY_V2 || []).find(b => b.type === s.type);
                  const isDragging = draggingId === s.id;
                  const showBefore = dropTarget && dropTarget.id === s.id && dropTarget.pos === "before";
                  const showAfter = dropTarget && dropTarget.id === s.id && dropTarget.pos === "after";
                  return (
                    <div
                      key={s.id}
                      style={{ position: "relative" }}
                      onDragOver={(e) => onDragOverItem(e, s.id)}
                      onDrop={commitDrop}
                    >
                      {showBefore && <span style={{ position: "absolute", top: -2, left: 4, right: 4, height: 2, background: "var(--c-amber)", zIndex: 2 }}/>}
                      <div
                        draggable
                        role="button"
                        tabIndex={0}
                        onDragStart={(e) => onDragStart(e, s.id)}
                        onDragEnd={onDragEnd}
                        onClick={() => { setSelectedId(s.id); if (compactUI) { setShowMobileOutline(false); setShowMobileInspector(true); } }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(s.id); } }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 8px", marginBottom: 3, boxSizing: "border-box",
                          background: selectedId === s.id ? "rgba(var(--accent-rgb),.12)" : "var(--c-bg)",
                          border: `1px solid ${selectedId === s.id ? "var(--c-amber)" : "var(--c-line)"}`,
                          borderRadius: 2, cursor: "grab", color: "var(--c-ink-2)", fontSize: 12.5,
                          opacity: isDragging ? 0.4 : 1,
                        }}
                      >
                        <span style={{ color: "var(--c-ink-4)", width: 11, letterSpacing: "-1px" }}>⠿</span>
                        <span style={{ fontSize: 12, color: "var(--c-amber)", width: 16, textAlign: "center" }}>{meta?.icon || "■"}</span>
                        <span style={{ flex: 1, color: selectedId === s.id ? "var(--c-ink)" : "var(--c-ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.title || meta?.name || s.type}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateSectionMeta(s.id, { inMenu: !s.inMenu }); }}
                          title="Toggle anchor link in section menu"
                          style={{
                            fontFamily: "var(--f-mono)", fontSize: 9, padding: "1px 4px", borderRadius: 2, cursor: "pointer",
                            color: s.inMenu ? "var(--c-amber)" : "var(--c-ink-4)",
                            border: `1px solid ${s.inMenu ? "rgba(var(--accent-rgb),.4)" : "var(--c-line)"}`,
                            background: "transparent",
                          }}
                        >#</button>
                      </div>
                      {showAfter && <span style={{ position: "absolute", bottom: 1, left: 4, right: 4, height: 2, background: "var(--c-amber)", zIndex: 2 }}/>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 2: VISUAL DRAG-AND-DROP SECTION PALETTE & LAYOUTS ── */}
          {leftTab === "add" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 3, background: "var(--c-bg)", border: "1px solid var(--c-line)", borderRadius: 2 }}>
                {[["blocks", "Sections"], ["layouts", "Presets"]].map(([k, l]) => (
                  <button key={k} onClick={() => setPaletteSub(k)} style={{
                    padding: "6px 8px", borderRadius: 2, cursor: "pointer", border: "none",
                    background: paletteSub === k ? "var(--c-amber)" : "transparent",
                    color: paletteSub === k ? tkc("on-amber") : "var(--c-ink-3)",
                    fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: ".1em", fontWeight: 700, textTransform: "uppercase",
                  }}>{l}</button>
                ))}
              </div>

              {paletteSub === "blocks" ? (
                <>
                  <div style={{ fontSize: 11.5, color: "var(--c-ink-3)", lineHeight: 1.4 }}>
                    Drag any section directly onto the canvas drop zones — or click to append to <b>{activePage.title}</b>.
                  </div>

                  <input
                    value={paletteQuery}
                    onChange={e => setPaletteQuery(e.target.value)}
                    placeholder="Filter sections…"
                    style={inpV2}
                  />

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {["All", ...(window.CATS_ORDER_V3 || ["Heroes", "Media", "Story", "Catalog", "Community", "Commerce", "Tail"])].map(cat => {
                      const on = paletteCat === cat;
                      return (
                        <button key={cat} onClick={() => setPaletteCat(cat)} style={{
                          padding: "4px 8px", borderRadius: 2, cursor: "pointer",
                          background: on ? "rgba(var(--accent-rgb),.14)" : "var(--c-bg)",
                          border: `1px solid ${on ? "var(--c-amber)" : "var(--c-line)"}`,
                          color: on ? "var(--c-amber)" : "var(--c-ink-3)",
                          fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".08em",
                        }}>{cat}</button>
                      );
                    })}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {filteredPaletteBlocks.map(b => (
                      <div
                        key={b.type}
                        draggable
                        onDragStart={(e) => {
                          const payload = { kind: "block", type: b.type };
                          window.__cinaPaletteDrag = payload;
                          if (e.dataTransfer) {
                            e.dataTransfer.effectAllowed = "copy";
                            try { e.dataTransfer.setData("application/x-cina-palette", JSON.stringify(payload)); } catch {}
                          }
                        }}
                        onDragEnd={() => { window.__cinaPaletteDrag = null; }}
                        onClick={() => insertSection(b.type, selectedId || (activeSections[activeSections.length - 1]?.id || null))}
                        title={`Drag onto canvas or click to add ${b.name}`}
                        style={{
                          padding: 6, background: "var(--c-bg)", border: "1px solid var(--c-line)", borderRadius: 2,
                          cursor: "grab", display: "flex", flexDirection: "column", gap: 5, minWidth: 0,
                        }}
                      >
                        {window.BlockThumb && <BlockThumb type={b.type} accent={page.theme?.accent || tkc("amber")}/>}
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--c-ink-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {b.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="t-mono" style={{ fontSize: 10, color: "var(--c-amber)", letterSpacing: ".12em" }}>PAGE LAYOUT PRESETS</div>
                  {(window.WB_PAGE_TEMPLATES || []).map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      style={{
                        padding: 10, textAlign: "left", background: "var(--c-bg)", border: "1px solid var(--c-line-2)",
                        borderRadius: 2, cursor: "pointer", display: "flex", flexDirection: "column", gap: 4,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-ink)" }}>{tpl.name}</span>
                        <span className="t-mono" style={{ fontSize: 9.5, color: "var(--c-amber)", letterSpacing: ".1em" }}>{tpl.tag}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--c-ink-3)", lineHeight: 1.4 }}>{tpl.blurb}</span>
                    </button>
                  ))}

                  {savedSections.length > 0 && (
                    <>
                      <div className="t-mono" style={{ fontSize: 10, color: "var(--c-ink-3)", letterSpacing: ".12em", marginTop: 6 }}>SAVED SECTIONS</div>
                      {savedSections.map(sv => (
                        <div
                          key={sv.sid}
                          draggable
                          onDragStart={(e) => {
                            const payload = { kind: "saved", spec: sv.spec };
                            window.__cinaPaletteDrag = payload;
                            if (e.dataTransfer) {
                              e.dataTransfer.effectAllowed = "copy";
                              try { e.dataTransfer.setData("application/x-cina-palette", JSON.stringify(payload)); } catch {}
                            }
                          }}
                          onDragEnd={() => { window.__cinaPaletteDrag = null; }}
                          onClick={() => insertSpec(sv.spec, selectedId)}
                          style={{
                            padding: 9, background: "var(--c-bg)", border: "1px solid var(--c-line)", borderRadius: 2,
                            cursor: "grab", display: "flex", alignItems: "center", gap: 8,
                          }}
                        >
                          <span style={{ flex: 1, fontSize: 12, color: "var(--c-ink)" }}>{sv.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); window.wbDeleteSavedSection && window.wbDeleteSavedSection(sv.sid); }}
                            style={{ ...smBtnV2, padding: "2px 6px" }}
                          >×</button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: GLOBAL DESIGN SYSTEM SHORTCUTS ── */}
          {leftTab === "design" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="t-mono" style={{ fontSize: 10, color: "var(--c-amber)", letterSpacing: ".14em", marginBottom: 8 }}>CURATED PALETTES</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {(window.WB_GLOBAL_PALETTES || []).map(p => {
                    const on = String(page.theme?.bg).toLowerCase() === p.bg.toLowerCase() && String(page.theme?.accent).toLowerCase() === p.accent.toLowerCase();
                    return (
                      <button
                        key={p.id}
                        onClick={() => updateTheme({ bg: p.bg, ink: p.ink, accent: p.accent })}
                        style={{
                          padding: 8, textAlign: "left", background: p.bg, color: p.ink, borderRadius: 2, cursor: "pointer",
                          border: `1.5px solid ${on ? p.accent : "var(--c-line-2)"}`,
                        }}
                      >
                        <div className="t-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em" }}>{p.name}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                          <span style={{ width: 12, height: 12, borderRadius: 1, background: p.bg, border: "1px solid rgba(128,128,128,.4)" }}/>
                          <span style={{ width: 12, height: 12, borderRadius: 1, background: p.ink }}/>
                          <span style={{ width: 12, height: 12, borderRadius: 1, background: p.accent }}/>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="t-mono" style={{ fontSize: 10, color: "var(--c-amber)", letterSpacing: ".14em", marginBottom: 8 }}>TYPOGRAPHIC PAIRINGS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {(WB_FONT_PAIRINGS || []).map(pr => {
                    const active = page.theme?.headlineFont === pr.headline && page.theme?.bodyFont === pr.body;
                    return (
                      <button
                        key={pr.name}
                        onClick={() => updateTheme({ headlineFont: pr.headline, bodyFont: pr.body })}
                        style={{
                          padding: 8, textAlign: "left", background: active ? "rgba(var(--accent-rgb),.1)" : "var(--c-bg)",
                          border: `1px solid ${active ? "var(--c-amber)" : "var(--c-line)"}`,
                          borderRadius: 2, cursor: "pointer", color: "var(--c-ink)",
                        }}
                      >
                        <div style={{ fontFamily: wbFont(pr.headline), fontStyle: "italic", fontSize: 17 }}>Ag</div>
                        <div className="t-mono" style={{ fontSize: 9.5, color: active ? "var(--c-amber)" : "var(--c-ink-4)", marginTop: 3 }}>{pr.name.toUpperCase()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="t-mono" style={{ fontSize: 10, color: "var(--c-ink-3)", letterSpacing: ".14em", marginBottom: 8 }}>OPEN IN RIGHT INSPECTOR</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    ["colors", "Colors & Contrast Swatches"],
                    ["type", "Typography Scale & Specimen"],
                    ["layout", "Spacing Rhythm, Corners & Buttons"],
                    ["chrome", "Header & Footer Presets"],
                    ["seo", "Active Page SEO & Slug"],
                    ["identity", "Domain, Logo & Custom CSS"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSelectedId(null);
                        setRightDesignTab(id);
                        if (compactUI) { setShowMobileOutline(false); setShowMobileInspector(true); }
                      }}
                      style={{
                        padding: "9px 10px", textAlign: "left", background: "var(--c-bg)",
                        border: `1px solid ${rightDesignTab === id && !selected ? "var(--c-amber)" : "var(--c-line)"}`,
                        borderRadius: 2, color: "var(--c-ink-2)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5,
                      }}
                    >
                      <span>{label}</span>
                      <span style={{ color: "var(--c-amber)" }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: INTEGRATED MERCH STOREFRONT CATALOG ── */}
          {leftTab === "store" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={addNewProduct}
                  style={{
                    flex: 1, padding: "9px 10px", background: "var(--c-amber)", color: tkc("on-amber"),
                    border: "none", borderRadius: 2, cursor: "pointer",
                    fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: ".1em", fontWeight: 700,
                  }}
                >+ NEW PRODUCT</button>
                <button
                  onClick={() => window.cinaCart && window.cinaCart.open(page.theme?.accent)}
                  style={{ ...smBtnV2, padding: "8px 10px" }}
                  title="Open Cart Drawer Preview"
                >Cart Drawer</button>
              </div>

              <button
                onClick={focusOrInsertStore}
                style={{
                  width: "100%", padding: "8px 10px", background: "var(--c-bg)", border: "1px dashed var(--c-line-2)",
                  borderRadius: 2, color: "var(--c-amber)", cursor: "pointer",
                  fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase",
                }}
              >
                {activeSections.some(s => s.type === "store") ? "Focus Storefront Section on Canvas" : "+ Add Storefront Section to Page"}
              </button>

              <div className="t-mono" style={{ fontSize: 10, color: "var(--c-ink-4)", letterSpacing: ".12em" }}>
                CATALOG · {storeCatalog.filter(p => p.status === "active").length} ACTIVE / {storeCatalog.length} TOTAL
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {storeCatalog.map(prod => {
                  const isOpen = editingProdId === prod.id;
                  const isActive = prod.status === "active";
                  return (
                    <div key={prod.id} style={{
                      background: "var(--c-bg)", border: `1px solid ${isOpen ? "var(--c-amber)" : "var(--c-line)"}`,
                      borderRadius: 2, overflow: "hidden",
                    }}>
                      <div
                        onClick={() => setEditingProdId(isOpen ? null : prod.id)}
                        style={{ padding: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: 2, flexShrink: 0,
                          background: prod.image ? `url(${prod.image}) center/cover` : (prod.color || page.theme?.accent),
                          border: "1px solid var(--c-line-2)",
                        }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {prod.title}
                          </div>
                          <div className="t-mono" style={{ fontSize: 10, color: "var(--c-ink-3)", marginTop: 2 }}>
                            ${prod.price} · {prod.kind || "EDITION"}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateProduct(prod.id, { status: isActive ? "draft" : "active" }); }}
                          style={{
                            padding: "2px 6px", borderRadius: 2, cursor: "pointer",
                            background: isActive ? "rgba(95,165,106,.12)" : "transparent",
                            border: `1px solid ${isActive ? "var(--c-good)" : "var(--c-line-2)"}`,
                            color: isActive ? "var(--c-good)" : "var(--c-ink-4)",
                            fontFamily: "var(--f-mono)", fontSize: 9.5,
                          }}
                        >{isActive ? "ACTIVE" : "DRAFT"}</button>
                      </div>

                      {isOpen && (
                        <div style={{ padding: "10px", borderTop: "1px solid var(--c-line)", display: "flex", flexDirection: "column", gap: 8 }}>
                          <input value={prod.title || ""} placeholder="Product title" onChange={e => updateProduct(prod.id, { title: e.target.value })} style={inpV2}/>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                            <input type="number" min="0" value={prod.price ?? 0} placeholder="Price" onChange={e => updateProduct(prod.id, { price: parseFloat(e.target.value) || 0 })} style={inpV2}/>
                            <input value={prod.kind || ""} placeholder="Kind (POSTER, VINYL)" onChange={e => updateProduct(prod.id, { kind: e.target.value })} style={inpV2}/>
                          </div>
                          <input value={prod.badge || ""} placeholder="Badge (optional, e.g. SIGNED)" onChange={e => updateProduct(prod.id, { badge: e.target.value })} style={inpV2}/>
                          <textarea value={prod.description || ""} rows={2} placeholder="Short product note" onChange={e => updateProduct(prod.id, { description: e.target.value })} style={{ ...inpV2, resize: "vertical" }}/>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="color" value={prod.color || "#E48D3C"} onChange={e => updateProduct(prod.id, { color: e.target.value })} style={{ width: 28, height: 28, padding: 0, border: "1px solid var(--c-line-2)", background: "transparent", cursor: "pointer" }}/>
                            <button
                              onClick={() => window.openMediaLibrary && window.openMediaLibrary({ type: "image", onPick: (src) => updateProduct(prod.id, { image: src }) })}
                              style={{ ...smBtnV2, flex: 1, padding: "6px 8px" }}
                            >{prod.image ? "Change Photo" : "Add Photo"}</button>
                            <button onClick={() => deleteProduct(prod.id)} style={{ ...smBtnV2, padding: "6px 8px", color: "var(--c-blood-l)", borderColor: "var(--c-blood)" }}>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  const wrapLeft = (kids) => compactUI
    ? (showMobileOutline ? <CinaSheet side="left" title="Workspace" onClose={() => setShowMobileOutline(false)} width={phoneUI ? 360 : 350} bodyStyle={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>{kids}</CinaSheet> : null)
    : <aside style={{ borderRight: "1px solid var(--c-line)", display: "flex", flexDirection: "column", background: "var(--c-panel)", overflow: "hidden" }}>{kids}</aside>;

  const wrapRight = (kids) => compactUI
    ? (showMobileInspector ? <CinaSheet title={selected ? "Section Inspector" : "Design System"} onClose={() => setShowMobileInspector(false)} width={phoneUI ? 400 : 380} bodyStyle={{ padding: 0 }}>{kids}</CinaSheet> : null)
    : <aside style={{ borderLeft: "1px solid var(--c-line)", overflowY: "auto", overflowX: "hidden", minHeight: 0, height: "100vh", background: "var(--c-panel)" }}>{kids}</aside>;

  return (
    <div style={{
      height: "100vh",
      display: "grid",
      gridTemplateColumns: compactUI ? "1fr" : "336px 1fr 324px",
      gridTemplateRows: "100vh",
      background: "var(--c-bg)",
      color: "var(--c-ink)",
      overflow: "hidden",
    }}>
      {/* LEFT DOCKED RAIL */}
      {wrapLeft(leftWorkspaceContent)}

      {/* CENTER EDITORIAL FLUID CANVAS */}
      <main style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, gridColumn: compactUI ? "1" : "auto" }}>
        <BuilderToolbar
          page={page}
          activePage={activePage}
          onSwitchPage={switchPage}
          onOpenPageSeo={() => { setSelectedId(null); setRightDesignTab("seo"); if (compactUI) setShowMobileInspector(true); }}
          editMode={editMode}
          setEditMode={setEditMode}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          dirty={dirty}
          publish={publish}
          viewLive={viewLive}
          undo={undo}
          redo={redo}
          canUndo={history.current.past.length > 0}
          canRedo={history.current.future.length > 0}
          openVersions={() => setVersionsOpen(true)}
          compactUI={compactUI}
          onSections={() => { setShowMobileOutline(true); setShowMobileInspector(false); }}
          onDesign={() => { setShowMobileInspector(true); setShowMobileOutline(false); }}
          onPlan={() => setPlanOpen(true)}
        />

        <div
          data-builder-canvas="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#060608",
            padding: previewMode === "desktop" ? 0 : 28,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <PreviewCanvasV2
            page={page}
            activePage={activePage}
            mode={previewMode}
            editMode={editMode}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              if (compactUI && id) { setShowMobileOutline(false); setShowMobileInspector(true); }
            }}
            onInsertAfter={(id) => {
              setInsertAfter(id);
              setInsertTab("blocks");
              setInsertOpen(true);
            }}
            onDropPaletteAt={insertSectionAt}
            onUpdateSectionProps={updateSection}
            onSwitchPage={switchPage}
            onMove={moveSection}
            onRemove={removeSection}
            onDuplicate={duplicateSection}
            draggingId={draggingId}
            dropTarget={dropTarget}
            onDragStartSec={onDragStart}
            onDragOverSec={onDragOverItem}
            onDropSec={commitDrop}
            onDragEndSec={onDragEnd}
          />
        </div>
      </main>

      {/* RIGHT DOCKED INSPECTOR */}
      {wrapRight(
        selected
          ? React.createElement(window.SectionInspectorV3 || SectionInspectorV2, {
              section: selected,
              previewMode,
              onChange: (p) => updateSection(selected.id, p),
              onChangeMeta: (p) => updateSectionMeta(selected.id, p),
              onMove: (d) => moveSection(selected.id, d),
              onDuplicate: () => duplicateSection(selected.id),
              onSaveTemplate: () => saveSectionAsTemplate(selected.id),
              onBackToDesign: () => setSelectedId(null),
              onOpenStoreCatalog: () => { setLeftTab("store"); if (compactUI) { setShowMobileInspector(false); setShowMobileOutline(true); } },
              onRemove: () => removeSection(selected.id),
            })
          : <ThemeInspectorV2
              page={page}
              activePage={activePage}
              activeTab={rightDesignTab}
              onTabChange={setRightDesignTab}
              onUpdate={updatePage}
              onTheme={updateTheme}
              onHeader={updateHeader}
              onFooter={updateFooter}
              onUpdatePageMeta={updatePageMeta}
              previewMode={previewMode}
              onOpenLogoStudio={() => setLogoStudioOpen(true)}
            />
      )}

      {/* Optional Sheets & Modals */}
      {planOpen && <BuilderPlanSheet page={page} onClose={() => setPlanOpen(false)} onPick={(id) => { updatePage({ tier: id, _upsell: null }); setPlanOpen(false); }}/>}

      {insertOpen && (
        <InsertOverlayV3
          activeCat={insertCat}
          setActiveCat={setInsertCat}
          initialTab={insertTab}
          accent={page.theme.accent}
          onClose={() => setInsertOpen(false)}
          onInsertBlock={(t, patch) => insertSection(t, insertAfter, patch)}
          onInsertTemplate={(tpl) => applyTemplate(tpl)}
          onInsertSaved={(spec) => insertSpec(spec, insertAfter)}
        />
      )}

      {logoStudioOpen && (
        <LogoStudio
          logo={page.logo}
          setLogo={(l) => setPage(p => ({ ...p, logo: l }))}
          studioName={page.studioName}
          accent={page.theme.accent}
          onClose={() => setLogoStudioOpen(false)}
        />
      )}

      {versionsOpen && (
        <VersionsModalV2
          creatorId={creator.id}
          livePage={pages[creator.id]}
          onClose={() => setVersionsOpen(false)}
          onRestore={(pg, kind) => {
            setPage(wbNormalizeSite(pg, creator));
            setVersionsOpen(false);
            if (window.toast) {
              window.toast({
                title: kind === "live" ? "REVERTED TO LIVE" : "SNAPSHOT RESTORED",
                text: "Canvas restored — hit Publish when ready to go live.",
                kind: "good",
              });
            }
          }}
        />
      )}

      {aiOpen && (
        <CinaAssistV2
          page={page}
          onClose={() => setAiOpen(false)}
          onApply={(updates) => {
            setPage(p => wbNormalizeSite({ ...p, ...updates }, creator));
            setAiOpen(false);
          }}
        />
      )}

      {wizardOpen && window.CinaSiteWizard && (
        <CinaSiteWizard
          page={page}
          creator={creator}
          onClose={() => setWizardOpen(false)}
          onApply={(updates) => {
            setPage(p => wbNormalizeSite({ ...p, ...updates }, creator));
            if (window.toast) window.toast({ title: "SITE GENERATED", text: "Updated layout from studio catalog.", kind: "good" });
          }}
        />
      )}

      {goLiveOpen && window.GoLiveModal && (
        <GoLiveModal
          page={page}
          updatePage={updatePage}
          onClose={() => setGoLiveOpen(false)}
          onConfirm={(view) => { setGoLiveOpen(false); if (view) viewLive(); else publish(); }}
        />
      )}

      {window.MediaLibraryHost && <MediaLibraryHost/>}
    </div>
  );
}

window.CreatorBuilder = StudioBuilder;
window.StudioBuilder = StudioBuilder;
Object.assign(window, { StudioBuilder });
