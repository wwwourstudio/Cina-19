import React, { useEffect, useRef, useState } from 'react';
import { float32ToPcm16Base64, pcm24Base64ToAudioBuffer } from './liveAudioUtils';
import type { SuiteStation } from './CinaDirectorSuite';

export type ConciergeTab = 'chat' | 'live';
type OrbVisualState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface CatalogFilmLite {
  id: string;
  title: string;
  kind?: string;
  genre?: string[];
  runtime?: string;
  rating?: number | string;
  creator?: string;
  logline?: string;
  branched?: boolean;
  trailer?: string;
}

interface LiveToolCall {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
}

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sitePlan?: SiteArchitectPlan | null;
  error?: boolean;
}

interface SiteArchitectPlan {
  summary?: string;
  studioName?: string;
  theme?: {
    bg?: string;
    ink?: string;
    accent?: string;
    headlineFont?: string;
    bodyFont?: string;
    fontScale?: number;
    spacing?: number;
    radius?: number;
    btnRadius?: number;
    btnStyle?: string;
    grain?: number;
  };
  header?: { preset?: string; sticky?: boolean; transparent?: boolean };
  footer?: { preset?: string };
  defaultAnimation?: string;
  sections?: Array<{
    type: string;
    title?: string;
    inMenu?: boolean;
    width?: string;
    pad?: string;
    animate?: string;
    props?: Record<string, unknown>;
  }>;
  blogPosts?: Array<{ title: string; dek?: string; category?: string; body?: string }>;
  storeProducts?: Array<{ title: string; price?: number; kind?: string; description?: string; badge?: string }>;
  newsletterDraft?: { subject?: string; preheader?: string; body?: string };
}

declare global {
  interface Window {
    openCinaConcierge?: (mode?: ConciergeTab) => void;
    closeCinaConcierge?: () => void;
    toggleCinaConcierge?: (mode?: ConciergeTab) => void;
    openCinaAiChat?: (initialPrompt?: string) => void;
    CATALOG?: CatalogFilmLite[];
    SAVED?: Set<string> | string[];
    toggleSaved?: (id: string) => void;
    navigate?: (route: string) => void;
    CinaCommand?: { run: (text: string) => string | null };
    CinaAppearance?: { set: (patch: { mood?: string }) => void };
    openCinaAccountSettings?: (tab?: string) => void;
    openCinaAiSuite?: (station?: SuiteStation) => void;
    closeCinaAiSuite?: () => void;
    toggleCinaAtlas?: (open?: boolean) => void;
    __cinaStudioGo?: (view: string, sub?: string) => void;
    CinaAuth?: { open: (opts?: Record<string, unknown>) => void };
    openSignIn?: () => void;
    toast?: (opts: { title?: string; text?: string; kind?: string }) => void;
    CinaVoice?: {
      on?: (fn: (state: string, level: number) => void) => () => void;
      state?: string;
      stop?: () => void;
      speak?: (text: string, voiceName?: string, onEnd?: () => void) => void;
    };
  }
}

function getCatalogList(): CatalogFilmLite[] {
  return Array.isArray(window.CATALOG) ? window.CATALOG : [];
}

function findMatchingFilms(query: string, kind = 'all'): CatalogFilmLite[] {
  const q = String(query || '').trim().toLowerCase();
  const list = getCatalogList().filter((f) => {
    if (kind === 'film') return f.kind !== 'series';
    if (kind === 'series') return f.kind === 'series';
    return true;
  });
  if (!q) return list.slice(0, 8);

  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = list
    .map((f) => {
      const hay = [
        f.title,
        f.id,
        f.creator,
        (f.genre || []).join(' '),
        f.logline,
        f.branched ? 'branched interactive fork' : '',
        f.kind === 'series' ? 'series episodic show' : 'film movie feature',
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      if (f.title?.toLowerCase() === q || f.id?.toLowerCase() === q) score += 100;
      else if (f.title?.toLowerCase().includes(q)) score += 45;
      for (const tok of tokens) {
        if (hay.includes(tok)) score += 10;
      }
      if (q.includes('short') && f.runtime && /\b(1\dm|2\dm|3\dm|[0-9]m)\b/i.test(f.runtime)) {
        score += 12;
      }
      return { film: f, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 8).map((s) => s.film);
}

function navigateSurface(surface: string, path: string): string {
  const cleanSurface = String(surface || 'watch').toLowerCase();
  const rawPath = String(path || '/').trim();
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  const onWatch = currentFile === '' || currentFile === 'index.html';
  const onStudio = currentFile.toLowerCase() === 'cina.html';
  const onProducers = currentFile.toLowerCase() === 'producers.html';

  if (cleanSurface === 'studio') {
    const station = rawPath.replace(/^#?\/?/, '');
    const routeSet = new Set(['dashboard', 'promo', 'analytics', 'site', 'new']);
    if (onStudio) {
      if (routeSet.has(station)) {
        window.dispatchEvent(new CustomEvent('cina:setRoute', { detail: station }));
      } else if (window.__cinaStudioGo) {
        window.__cinaStudioGo(station || 'chat');
      } else {
        window.dispatchEvent(new CustomEvent('cina:setRoute', { detail: 'studio' }));
        window.dispatchEvent(new CustomEvent('cina:setView', { detail: station || 'chat' }));
      }
    } else {
      window.location.href = station ? `Cina.html#${station}` : 'Cina.html';
    }
    return `Studio: ${station || 'slate'}`;
  }

  if (cleanSurface === 'producers') {
    const tab = rawPath.replace(/^#?\/?/, '') || 'market';
    if (onProducers) {
      window.location.hash = `#${tab}`;
    } else {
      window.location.href = `Producers.html#${tab}`;
    }
    return `Producers: ${tab}`;
  }

  if (cleanSurface === 'about') {
    if (rawPath === '/' || rawPath === '/manifesto' || rawPath === 'manifesto') {
      window.location.href = 'About.html';
      return 'About Cina Manifesto';
    }
    const aboutHash = rawPath.startsWith('/about') ? rawPath : `/about/${rawPath.replace(/^\/+/, '')}`;
    if (onWatch && window.navigate) {
      window.navigate(aboutHash);
    } else {
      window.location.href = `index.html#${aboutHash}`;
    }
    return aboutHash;
  }

  const watchPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  if (onWatch && window.navigate) {
    window.navigate(watchPath);
  } else {
    window.location.href = `index.html#${watchPath}`;
  }
  return watchPath;
}

async function executeUniversalVoiceTool(
  call: LiveToolCall,
  onEndSession: () => void
): Promise<Record<string, unknown>> {
  const name = call.name || '';
  const args = call.args || {};

  try {
    if (name === 'navigate_app') {
      const surface = String(args.surface || 'watch');
      const path = String(args.path || '/');
      const dest = navigateSurface(surface, path);
      return { ok: true, navigatedTo: dest, surface };
    }

    if (name === 'search_catalog') {
      const query = String(args.query || '');
      const kind = String(args.kind || 'all');
      const matches = findMatchingFilms(query, kind);
      return {
        ok: true,
        count: matches.length,
        matches: matches.map((f) => ({
          id: f.id,
          title: f.title,
          kind: f.kind || 'film',
          genre: f.genre,
          runtime: f.runtime,
          rating: f.rating,
          director: (f.creator || '').split('·')[0].trim(),
          branched: Boolean(f.branched),
          logline: f.logline,
        })),
      };
    }

    if (name === 'open_or_play_film') {
      const query = String(args.query || '');
      const autoplay = Boolean(args.autoplay);
      const matches = findMatchingFilms(query, 'all');
      const target = matches[0];
      if (!target) {
        return { ok: false, error: `No film or series found matching "${query}".` };
      }
      const route =
        target.kind === 'series'
          ? `/series/${target.id}`
          : autoplay && target.branched
          ? `/premiere/${target.id}`
          : `/film/${target.id}`;
      navigateSurface('watch', route);
      if (autoplay) {
        setTimeout(() => {
          const playBtn = document.querySelector<HTMLButtonElement>(
            'button[data-play-main="true"], .pm-hero__play, button[aria-label*="Play" i], button[aria-label*="Watch" i]'
          );
          playBtn?.click();
        }, 420);
      }
      return {
        ok: true,
        opened: target.title,
        id: target.id,
        kind: target.kind || 'film',
        route,
      };
    }

    if (name === 'manage_watchlist') {
      const action = String(args.action || 'toggle').toLowerCase();
      const q = String(args.query || 'current').trim();
      let targetId = '';
      let targetTitle = '';

      if (!q || q.toLowerCase() === 'current') {
        const hashParts = (window.location.hash || '').replace(/^#\/?/, '').split('/');
        if ((hashParts[0] === 'film' || hashParts[0] === 'series' || hashParts[0] === 'premiere') && hashParts[1]) {
          targetId = hashParts[1];
          const f = getCatalogList().find((x) => x.id === targetId);
          targetTitle = f?.title || targetId;
        }
      } else {
        const f = findMatchingFilms(q)[0];
        if (f) {
          targetId = f.id;
          targetTitle = f.title;
        }
      }

      if (!targetId) {
        return { ok: false, error: 'Could not identify which film to update on your watchlist.' };
      }

      const savedSet =
        window.SAVED instanceof Set
          ? window.SAVED
          : new Set(Array.isArray(window.SAVED) ? window.SAVED : []);
      const isSaved = savedSet.has(targetId);
      const shouldToggle =
        action === 'toggle' ||
        (action === 'add' && !isSaved) ||
        (action === 'remove' && isSaved);

      if (shouldToggle && typeof window.toggleSaved === 'function') {
        window.toggleSaved(targetId);
      }

      return {
        ok: true,
        film: targetTitle,
        saved: action === 'add' ? true : action === 'remove' ? false : !isSaved,
      };
    }

    if (name === 'set_display_mood') {
      const mood = String(args.mood || 'premiere').toLowerCase();
      const allowed = new Set(['premiere', 'programmer', 'darkroom', 'midnight', 'daylight']);
      const safeMood = allowed.has(mood) ? mood : 'premiere';
      document.body.dataset.cinaMood = safeMood;
      try {
        localStorage.setItem('cina:mood', safeMood);
      } catch {
        // ignore
      }
      if (window.CinaAppearance?.set) {
        window.CinaAppearance.set({ mood: safeMood });
      }
      return { ok: true, mood: safeMood };
    }

    if (name === 'open_ui_modal') {
      const modal = String(args.modal || '').toLowerCase();
      const tab = String(args.tab || 'profile').toLowerCase();
      if (modal === 'settings') {
        if (window.openCinaAccountSettings) {
          window.openCinaAccountSettings(tab);
        } else {
          navigateSurface('watch', `/account?tab=${encodeURIComponent(tab)}`);
        }
        return { ok: true, opened: 'settings', tab };
      }
      if (modal === 'workspace_atlas') {
        window.toggleCinaAtlas?.(true);
        return { ok: true, opened: 'workspace_atlas' };
      }
      if (modal === 'credits' || modal === 'team') {
        window.dispatchEvent(new CustomEvent('cina:openPanel', { detail: modal }));
        return { ok: true, opened: modal };
      }
      if (modal === 'signin') {
        if (window.CinaAuth?.open) window.CinaAuth.open({});
        else window.openSignIn?.();
        return { ok: true, opened: 'signin' };
      }
      if (modal.startsWith('ai_')) {
        const station = modal.replace('ai_', '') as SuiteStation;
        const currentFile = window.location.pathname.split('/').pop() || 'index.html';
        if (currentFile.toLowerCase() === 'cina.html') {
          const map: Record<string, string> = {
            chat: 'chat',
            image: 'board',
            video: 'generate',
            music: 'score',
            transcribe: 'script',
            scout: 'bible',
            vault: 'chat',
          };
          navigateSurface('studio', map[station] || 'chat');
        } else {
          window.openCinaAiSuite?.(station);
        }
        return { ok: true, opened: modal };
      }
      return { ok: false, error: `Unknown UI modal: ${modal}` };
    }

    if (name === 'studio_create_asset') {
      const tool = String(args.tool || '');
      const prompt = String(args.prompt || '').trim();
      const map: Record<string, SuiteStation> = {
        generate_image: 'image',
        generate_video: 'video',
        compose_score: 'music',
        scout_location: 'scout',
      };
      const station = map[tool] || 'chat';
      const currentFile = window.location.pathname.split('/').pop() || 'index.html';
      if (currentFile.toLowerCase() === 'cina.html') {
        window.dispatchEvent(new CustomEvent('cina:voiceStudioTrigger', { detail: { tool, prompt, station } }));
        navigateSurface('studio', station === 'image' ? 'board' : station === 'video' ? 'generate' : station === 'music' ? 'score' : 'bible');
      } else {
        window.openCinaAiSuite?.(station);
      }
      return { ok: true, launchedTool: tool, prompt };
    }

    if (name === 'create_new_film') {
      const title = String(args.title || '').trim();
      const logline = String(args.logline || '').trim();
      const currentFile = window.location.pathname.split('/').pop() || 'index.html';
      if (currentFile.toLowerCase() === 'cina.html') {
        window.dispatchEvent(new CustomEvent('cina:setRoute', { detail: 'new' }));
        window.dispatchEvent(new CustomEvent('cina:newFilmSeed', { detail: { title, logline } }));
      } else {
        window.location.href = 'Cina.html#new';
      }
      return { ok: true, startedNewFilm: title || 'Untitled' };
    }

    if (name === 'end_voice_session') {
      setTimeout(() => onEndSession(), 900);
      return { ok: true, closing: true };
    }

    return { ok: false, error: `Unsupported action: ${name}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Action execution failed.',
    };
  }
}

export function applySiteArchitectPlanToStorage(plan: SiteArchitectPlan): void {
  try {
    // 1. Apply blog posts to cina:studio-notebook if present
    if (Array.isArray(plan.blogPosts) && plan.blogPosts.length > 0) {
      const existing = JSON.parse(localStorage.getItem('cina:studio-notebook') || '[]');
      const list = Array.isArray(existing) ? existing : [];
      const today = new Date().toISOString().slice(0, 10);
      const added = plan.blogPosts.map((bp, idx) => ({
        id: `post-ai-${Date.now()}-${idx}`,
        title: bp.title || 'Untitled Dispatch',
        dek: bp.dek || '',
        category: bp.category || 'Essay',
        date: today,
        status: 'published',
        coverFilmId: 'll',
        blocks: [{ id: `blk-${idx}`, kind: 'p', value: bp.body || bp.dek || '' }],
      }));
      localStorage.setItem('cina:studio-notebook', JSON.stringify([...added, ...list]));
      window.dispatchEvent(new Event('cina:notebook-changed'));
    }

    // 2. Apply store products to cina:studio-store if present
    if (Array.isArray(plan.storeProducts) && plan.storeProducts.length > 0) {
      const existing = JSON.parse(localStorage.getItem('cina:studio-store') || '[]');
      const list = Array.isArray(existing) ? existing : [];
      const added = plan.storeProducts.map((sp, idx) => ({
        id: `prod-ai-${Date.now()}-${idx}`,
        creatorId: 'voss',
        title: sp.title || 'Studio Edition',
        price: Number(sp.price) || 40,
        type: (sp.kind || 'EDITION').toUpperCase(),
        kind: (sp.kind || 'EDITION').toUpperCase(),
        status: 'active',
        swatch: plan.theme?.accent || '#E48D3C',
        color: plan.theme?.accent || '#E48D3C',
        desc: sp.description || '',
        description: sp.description || '',
        badge: sp.badge || 'NEW',
        variants: ['Standard'],
      }));
      localStorage.setItem('cina:studio-store', JSON.stringify([...added, ...list]));
      window.dispatchEvent(new Event('cina:store-changed'));
    }

    // 3. Store newsletter draft if generated
    if (plan.newsletterDraft?.subject || plan.newsletterDraft?.body) {
      localStorage.setItem('cina:site-newsletter-draft', JSON.stringify(plan.newsletterDraft));
      window.dispatchEvent(new Event('cina:newsletter-changed'));
    }

    // 4. Broadcast live event to Builder & Studio Site Panel
    window.dispatchEvent(new CustomEvent('cina:ai-apply-site', { detail: plan }));
  } catch {
    // ignore storage errors
  }
}

function isSiteBuilderContext(): boolean {
  const h = (window.location.hash || '').toLowerCase();
  const f = (window.location.pathname.split('/').pop() || '').toLowerCase();
  return h.includes('/build') || (f === 'cina.html' && (h.includes('site') || h === ''));
}

function looksLikeSiteBuildPrompt(text: string): boolean {
  if (isSiteBuilderContext()) return true;
  return /\b(build|create|design|make|generate|redesign|update|style)\b.*\b(site|website|page|store|blog|theme|font|template|hero|portfolio|palett)/i.test(text);
}

export const CinaConciergeWidget: React.FC<{
  onOpenChange?: (isOpen: boolean) => void;
}> = ({ onOpenChange }) => {
  const [orbState, setOrbState] = useState<OrbVisualState>('idle');
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Describe the website, aesthetic, Google Fonts, sections, merch store, or journal you want — I will build and apply it live.',
    },
  ]);

  const orbStateRef = useRef<OrbVisualState>('idle');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const liveWsRef = useRef<WebSocket | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveInputCtxRef = useRef<AudioContext | null>(null);
  const liveOutputCtxRef = useRef<AudioContext | null>(null);
  const liveProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const liveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const liveNextStartRef = useRef<number>(0);

  const externalBusStateRef = useRef<{ state: string; level: number }>({ state: 'idle', level: 0 });
  const micLevelRef = useRef<number>(0);
  const outLevelRef = useRef<number>(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatOpen, busy]);

  const setSyncedState = (next: OrbVisualState) => {
    orbStateRef.current = next;
    setOrbState(next);
    const active = next !== 'idle' && next !== 'error';
    onOpenChange?.(active);
  };

  const stopLiveVoice = () => {
    if (liveProcessorRef.current) {
      try {
        liveProcessorRef.current.disconnect();
      } catch {
        // ignore
      }
      liveProcessorRef.current = null;
    }
    if (liveWsRef.current) {
      try {
        liveWsRef.current.close();
      } catch {
        // ignore
      }
      liveWsRef.current = null;
    }
    if (liveStreamRef.current) {
      for (const track of liveStreamRef.current.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      liveStreamRef.current = null;
    }
    for (const src of liveSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore
      }
    }
    liveSourcesRef.current.clear();
    inputAnalyserRef.current = null;
    outputAnalyserRef.current = null;
    if (liveInputCtxRef.current) {
      liveInputCtxRef.current.close().catch(() => {});
      liveInputCtxRef.current = null;
    }
    if (liveOutputCtxRef.current) {
      liveOutputCtxRef.current.close().catch(() => {});
      liveOutputCtxRef.current = null;
    }
    liveNextStartRef.current = 0;
    micLevelRef.current = 0;
    outLevelRef.current = 0;
    setSyncedState('idle');
  };

  const startLiveVoice = async () => {
    if (orbStateRef.current !== 'idle' && orbStateRef.current !== 'error') {
      stopLiveVoice();
      return;
    }

    window.CinaVoice?.stop?.();
    setSyncedState('connecting');

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      liveStreamRef.current = micStream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      liveInputCtxRef.current = inputCtx;
      liveOutputCtxRef.current = outputCtx;
      liveNextStartRef.current = 0;

      const inAnalyser = inputCtx.createAnalyser();
      inAnalyser.fftSize = 128;
      inAnalyser.smoothingTimeConstant = 0.72;
      inputAnalyserRef.current = inAnalyser;

      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 128;
      outAnalyser.smoothingTimeConstant = 0.68;
      outAnalyser.connect(outputCtx.destination);
      outputAnalyserRef.current = outAnalyser;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws/live?voice=Kore&role=omni`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(micStream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        liveProcessorRef.current = processor;

        processor.onaudioprocess = (ev) => {
          const activeWs = liveWsRef.current;
          if (!activeWs || activeWs.readyState !== WebSocket.OPEN) return;
          const samples = ev.inputBuffer.getChannelData(0);
          const base64Audio = float32ToPcm16Base64(samples, inputCtx.sampleRate);
          activeWs.send(JSON.stringify({ audio: base64Audio }));
        };

        source.connect(inAnalyser);
        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = async (event) => {
        let msg: {
          type?: string;
          audio?: string;
          error?: string;
          functionCalls?: LiveToolCall[];
        } | null = null;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!msg) return;

        if (msg.type === 'ready') {
          setSyncedState('listening');
          return;
        }

        if (msg.type === 'audio' && msg.audio && liveOutputCtxRef.current) {
          const outCtx = liveOutputCtxRef.current;
          if (outCtx.state === 'suspended') {
            outCtx.resume().catch(() => {});
          }
          const audioBuffer = pcm24Base64ToAudioBuffer(outCtx, msg.audio);
          if (audioBuffer) {
            setSyncedState('speaking');
            const sourceNode = outCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            if (outputAnalyserRef.current) {
              sourceNode.connect(outputAnalyserRef.current);
            } else {
              sourceNode.connect(outCtx.destination);
            }
            const startAt = Math.max(outCtx.currentTime, liveNextStartRef.current);
            sourceNode.start(startAt);
            liveNextStartRef.current = startAt + audioBuffer.duration;
            liveSourcesRef.current.add(sourceNode);
            sourceNode.onended = () => {
              liveSourcesRef.current.delete(sourceNode);
              if (
                liveSourcesRef.current.size === 0 &&
                orbStateRef.current === 'speaking'
              ) {
                setSyncedState('listening');
              }
            };
          }
          return;
        }

        if (msg.type === 'toolCall' && Array.isArray(msg.functionCalls)) {
          setSyncedState('thinking');
          const responses = [];
          for (const call of msg.functionCalls) {
            const result = await executeUniversalVoiceTool(call, stopLiveVoice);
            responses.push({
              id: call.id,
              name: call.name,
              response: result,
            });
          }
          if (liveWsRef.current && liveWsRef.current.readyState === WebSocket.OPEN) {
            liveWsRef.current.send(JSON.stringify({ toolResponses: responses }));
          }
          if (liveSourcesRef.current.size === 0 && orbStateRef.current === 'thinking') {
            setSyncedState('listening');
          }
          return;
        }

        if (msg.type === 'interrupted' && liveOutputCtxRef.current) {
          for (const node of liveSourcesRef.current) {
            try {
              node.stop();
            } catch {
              // ignore
            }
          }
          liveSourcesRef.current.clear();
          liveNextStartRef.current = liveOutputCtxRef.current.currentTime;
          setSyncedState('listening');
          return;
        }

        if (msg.type === 'turnComplete') {
          if (liveSourcesRef.current.size === 0 && orbStateRef.current !== 'idle') {
            setSyncedState('listening');
          }
          return;
        }

        if (msg.type === 'error') {
          window.toast?.({
            title: 'Cina Voice',
            text: msg.error || 'Voice connection interrupted.',
            kind: 'bad',
          });
          stopLiveVoice();
        }
      };

      ws.onerror = () => {
        window.toast?.({
          title: 'Cina Voice',
          text: 'Unable to start live voice session right now.',
          kind: 'bad',
        });
        stopLiveVoice();
      };

      ws.onclose = () => {
        if (orbStateRef.current !== 'idle') {
          stopLiveVoice();
        }
      };
    } catch (err) {
      window.toast?.({
        title: 'Microphone access needed',
        text: err instanceof Error ? err.message : 'Allow microphone access to talk to Cina.',
        kind: 'bad',
      });
      stopLiveVoice();
    }
  };

  const sendPrompt = async (customText?: string) => {
    const prompt = (customText ?? input).trim();
    if (!prompt || busy) return;
    if (!customText) setInput('');

    const userMsg: ChatEntry = { id: `u-${Date.now()}`, role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    try {
      if (looksLikeSiteBuildPrompt(prompt)) {
        let studioName = 'Elias Voss Studio';
        let currentTheme: Record<string, unknown> | undefined;
        try {
          const drafts = JSON.parse(localStorage.getItem('cina:builder-draft-v2') || '{}');
          const live = JSON.parse(localStorage.getItem('cina:studio-pages-v2') || '{}');
          const cur = drafts.voss || live.voss;
          if (cur) {
            studioName = cur.studioName || studioName;
            currentTheme = cur.theme;
          }
        } catch {
          // ignore
        }

        const res = await fetch('/api/ai/site-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, studioName, currentTheme }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `Server error (${res.status})`);
        }
        const plan = (data.plan || data) as SiteArchitectPlan;
        applySiteArchitectPlanToStorage(plan);

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: plan.summary || 'Generated and applied your new site architecture live.',
            sitePlan: plan,
          },
        ]);
        window.toast?.({
          title: 'AI ARCHITECT APPLIED',
          text: `${plan.sections?.length || 0} sections & ${plan.theme?.headlineFont || 'editorial'} typography applied.`,
          kind: 'good',
        });
      } else {
        const res = await fetch('/api/ai/concierge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: prompt,
            catalog: getCatalogList().slice(0, 12).map((f) => ({
              id: f.id,
              title: f.title,
              genre: f.genre,
              creator: f.creator,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `Server error (${res.status})`);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.reply || data.text || 'How can I help with your cinema experience or studio site?',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: err instanceof Error ? err.message : 'Unable to reach Gemini right now.',
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    window.openCinaAiChat = (initialPrompt?: string) => {
      setChatOpen(true);
      if (initialPrompt && typeof initialPrompt === 'string') {
        void sendPrompt(initialPrompt);
      }
    };
    window.openCinaConcierge = (mode?: ConciergeTab) => {
      if (mode === 'live') {
        void startLiveVoice();
      } else {
        setChatOpen(true);
      }
    };
    window.closeCinaConcierge = () => {
      setChatOpen(false);
      stopLiveVoice();
    };
    window.toggleCinaConcierge = (mode?: ConciergeTab) => {
      if (mode === 'live') {
        if (orbStateRef.current === 'idle' || orbStateRef.current === 'error') {
          void startLiveVoice();
        } else {
          stopLiveVoice();
        }
        return;
      }
      setChatOpen((o) => !o);
    };

    const unsubVoice = window.CinaVoice?.on?.((st, lvl) => {
      externalBusStateRef.current = { state: st, level: lvl || 0 };
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (orbStateRef.current !== 'idle') stopLiveVoice();
        else if (chatOpen) setChatOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      unsubVoice?.();
      window.removeEventListener('keydown', onKeyDown);
      stopLiveVoice();
    };
  }, [chatOpen]);

  useEffect(() => {
    let raf = 0;
    const freqBuf = new Uint8Array(64);
    let smoothMic = 0;
    let smoothOut = 0;
    let phase = 0;

    const readRms = (analyser: AnalyserNode | null) => {
      if (!analyser) return 0;
      analyser.getByteFrequencyData(freqBuf);
      let sum = 0;
      const len = Math.min(28, freqBuf.length);
      for (let i = 0; i < len; i++) sum += freqBuf[i];
      return Math.min(1, sum / (len * 140));
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const size = 96;
      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        raf = requestAnimationFrame(draw);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;

      const bus = externalBusStateRef.current;
      const liveState = orbStateRef.current;
      const effectiveState: OrbVisualState =
        liveState !== 'idle'
          ? liveState
          : bus.state === 'speaking'
          ? 'speaking'
          : bus.state === 'thinking'
          ? 'thinking'
          : busy
          ? 'thinking'
          : 'idle';

      const rawMic = readRms(inputAnalyserRef.current);
      const rawOut = Math.max(
        readRms(outputAnalyserRef.current),
        bus.state === 'speaking' ? 0.55 + 0.35 * Math.sin(phase * 2.8) : 0
      );

      smoothMic += (rawMic - smoothMic) * 0.24;
      smoothOut += (rawOut - smoothOut) * 0.28;
      micLevelRef.current = smoothMic;
      outLevelRef.current = smoothOut;

      const energy =
        effectiveState === 'speaking'
          ? Math.max(0.28, smoothOut)
          : effectiveState === 'listening'
          ? Math.max(0.14, smoothMic)
          : effectiveState === 'thinking'
          ? 0.24
          : effectiveState === 'connecting'
          ? 0.16
          : 0.05;

      phase += 0.025 + energy * 0.095;

      const haloR = 28 + energy * 20 + Math.sin(phase * 0.7) * 2.2;
      const haloGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, haloR + 12);
      if (effectiveState === 'speaking') {
        haloGrad.addColorStop(0, `rgba(244, 178, 84, ${0.46 + energy * 0.35})`);
        haloGrad.addColorStop(0.55, `rgba(232, 80, 42, ${0.28 + energy * 0.25})`);
        haloGrad.addColorStop(1, 'rgba(232, 80, 42, 0)');
      } else if (effectiveState === 'listening') {
        haloGrad.addColorStop(0, `rgba(232, 80, 42, ${0.38 + energy * 0.4})`);
        haloGrad.addColorStop(0.65, `rgba(214, 154, 70, ${0.18 + energy * 0.2})`);
        haloGrad.addColorStop(1, 'rgba(232, 80, 42, 0)');
      } else if (effectiveState === 'connecting' || effectiveState === 'thinking') {
        haloGrad.addColorStop(0, 'rgba(244, 178, 84, 0.4)');
        haloGrad.addColorStop(1, 'rgba(244, 178, 84, 0)');
      } else {
        haloGrad.addColorStop(0, 'rgba(232, 80, 42, 0.24)');
        haloGrad.addColorStop(1, 'rgba(232, 80, 42, 0)');
      }
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, haloR + 12, 0, Math.PI * 2);
      ctx.fill();

      const ringCount = effectiveState === 'idle' ? 1 : 3;
      for (let rIdx = 0; rIdx < ringCount; rIdx++) {
        const baseR =
          effectiveState === 'idle'
            ? 27 + Math.sin(phase * 0.6) * 1.1
            : 27 + rIdx * 6 + energy * (6 + rIdx * 4.5);

        ctx.beginPath();
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const waveAmp =
            effectiveState === 'speaking'
              ? (1.8 + smoothOut * 5.2) * (1 - rIdx * 0.18)
              : effectiveState === 'listening'
              ? (0.9 + smoothMic * 4.5) * (1 - rIdx * 0.22)
              : effectiveState === 'thinking'
              ? 1.4
              : 0;
          const wobble =
            Math.sin(theta * (3 + rIdx) + phase * (1.4 + rIdx * 0.35)) * waveAmp +
            Math.cos(theta * 5 - phase * 1.1) * waveAmp * 0.45;
          const rr = baseR + wobble;
          const x = cx + Math.cos(theta) * rr;
          const y = cy + Math.sin(theta) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const alpha =
          effectiveState === 'idle'
            ? 0.34
            : Math.max(0.12, 0.62 - rIdx * 0.15 + energy * 0.22);
        ctx.strokeStyle =
          rIdx === 0 && effectiveState === 'speaking'
            ? `rgba(248, 206, 128, ${alpha})`
            : `rgba(232, 80, 42, ${alpha})`;
        ctx.lineWidth = rIdx === 0 ? 1.6 : 1.05;
        ctx.stroke();
      }

      if (effectiveState === 'connecting' || effectiveState === 'thinking') {
        const arcR = 30;
        ctx.strokeStyle = 'rgba(248, 206, 128, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, phase * 1.9, phase * 1.9 + Math.PI * 0.65);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, phase * 1.9 + Math.PI, phase * 1.9 + Math.PI * 1.45);
        ctx.stroke();
      }

      const coreScale =
        effectiveState === 'speaking'
          ? 1 + smoothOut * 0.14
          : effectiveState === 'listening'
          ? 1 + smoothMic * 0.09
          : 1 + Math.sin(phase * 0.75) * 0.02;
      const bodyR = 23.5 * coreScale;

      const bodyGrad = ctx.createRadialGradient(cx - 6, cy - 7, 2, cx, cy, bodyR);
      bodyGrad.addColorStop(0, '#342620');
      bodyGrad.addColorStop(0.55, '#15141a');
      bodyGrad.addColorStop(1, '#08080c');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle =
        effectiveState === 'idle'
          ? 'rgba(255, 255, 255, 0.24)'
          : 'rgba(244, 178, 84, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const irisR =
        effectiveState === 'speaking'
          ? 8 + smoothOut * 7.5 + Math.sin(phase * 3.1) * 1.1
          : effectiveState === 'listening'
          ? 7.2 + smoothMic * 5.2
          : effectiveState === 'connecting' || effectiveState === 'thinking'
          ? 7.8 + Math.sin(phase * 2.4) * 1.4
          : 6.2 + Math.sin(phase * 0.8) * 0.55;

      const irisGrad = ctx.createRadialGradient(cx - 1.5, cy - 1.5, 0.6, cx, cy, irisR + 4.5);
      if (effectiveState === 'speaking') {
        irisGrad.addColorStop(0, '#fff3d6');
        irisGrad.addColorStop(0.38, '#f4b254');
        irisGrad.addColorStop(0.75, '#e8502a');
        irisGrad.addColorStop(1, 'rgba(232, 80, 42, 0)');
      } else if (effectiveState === 'listening') {
        irisGrad.addColorStop(0, '#ffd8b8');
        irisGrad.addColorStop(0.45, '#e8502a');
        irisGrad.addColorStop(1, 'rgba(232, 80, 42, 0)');
      } else {
        irisGrad.addColorStop(0, '#f4b254');
        irisGrad.addColorStop(0.55, '#e8502a');
        irisGrad.addColorStop(1, 'rgba(232, 80, 42, 0)');
      }
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, irisR + 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [busy]);

  const isActive = orbState !== 'idle' && orbState !== 'error';
  const quickPrompts = isSiteBuilderContext()
    ? [
        'Awwwards brutalist serif darkroom portfolio + vinyl store + 2 essays',
        'Gallery Paper light editorial theme with Cormorant Garamond & warm vermilion',
        'Midnight architectural monolith with Syne display typography & film reel',
      ]
    : [
        'Build a darkroom film director portfolio website with a merch store',
        'Recommend interactive branched films to watch tonight',
      ];

  return (
    <div className="cina-voice-orb-wrap" data-state={busy ? 'thinking' : orbState}>
      {chatOpen && (
        <section className="cina-ai-copilot" role="dialog" aria-label="Cina AI Architect">
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              background: 'rgba(18,18,24,0.9)',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.16em',
                  color: 'var(--c-amber)',
                  fontWeight: 700,
                }}
              >
                CINA AI ARCHITECT
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--c-ink-3)', marginTop: 2 }}>
                {isActive ? `Live voice · ${orbState}` : 'Chat to generate or restyle your entire site'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => void startLiveVoice()}
                style={{
                  padding: '5px 10px',
                  borderRadius: 2,
                  border: `1px solid ${isActive ? 'var(--c-amber)' : 'rgba(255,255,255,0.16)'}`,
                  background: isActive ? 'rgba(232,163,61,0.18)' : 'transparent',
                  color: isActive ? 'var(--c-amber)' : 'var(--c-ink-2)',
                  fontFamily: 'var(--f-mono)',
                  fontSize: '0.66rem',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                {isActive ? 'STOP MIC' : 'VOICE'}
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="Close AI Architect"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'transparent',
                  color: 'var(--c-ink-3)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  padding: '9px 12px',
                  borderRadius: 2,
                  background:
                    m.role === 'user'
                      ? 'rgba(232, 163, 61, 0.16)'
                      : m.error
                      ? 'rgba(185, 65, 52, 0.18)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${
                    m.role === 'user'
                      ? 'rgba(232, 163, 61, 0.36)'
                      : m.error
                      ? 'rgba(185, 65, 52, 0.45)'
                      : 'rgba(255, 255, 255, 0.09)'
                  }`,
                  fontSize: '0.84rem',
                  lineHeight: 1.48,
                  color: m.error ? '#ffb4ab' : 'var(--c-ink)',
                }}
              >
                <div>{m.text}</div>
                {m.sitePlan && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      fontFamily: 'var(--f-mono)',
                      fontSize: '0.66rem',
                      color: 'var(--c-amber)',
                    }}
                  >
                    <span>✓ {m.sitePlan.sections?.length || 0} SECTIONS</span>
                    {m.sitePlan.theme?.headlineFont && (
                      <span>· TYPE: {String(m.sitePlan.theme.headlineFont).toUpperCase()}</span>
                    )}
                    {Array.isArray(m.sitePlan.blogPosts) && m.sitePlan.blogPosts.length > 0 && (
                      <span>· {m.sitePlan.blogPosts.length} POSTS</span>
                    )}
                    {Array.isArray(m.sitePlan.storeProducts) && m.sitePlan.storeProducts.length > 0 && (
                      <span>· {m.sitePlan.storeProducts.length} PRODUCTS</span>
                    )}
                    {!window.location.hash.includes('/build') && (
                      <a
                        href="index.html#/build"
                        style={{
                          marginLeft: 'auto',
                          color: '#0A0A0C',
                          background: 'var(--c-amber)',
                          padding: '3px 8px',
                          borderRadius: 2,
                          textDecoration: 'none',
                          fontWeight: 700,
                        }}
                      >
                        OPEN BUILDER →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 12px',
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'var(--f-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  color: 'var(--c-amber)',
                }}
              >
                COMPOSING ARCHITECTURE, TYPOGRAPHY &amp; COPY…
              </div>
            )}

            {messages.length <= 2 && !busy && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                <div
                  style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: '0.64rem',
                    letterSpacing: '0.12em',
                    color: 'var(--c-ink-4)',
                  }}
                >
                  TRY A ONE-CLICK BUILD PROMPT
                </div>
                {quickPrompts.map((qp) => (
                  <button
                    key={qp}
                    type="button"
                    onClick={() => void sendPrompt(qp)}
                    style={{
                      textAlign: 'left',
                      padding: '7px 10px',
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--c-ink-2)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      lineHeight: 1.35,
                    }}
                  >
                    ✦ {qp}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendPrompt();
            }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: 6,
              background: 'rgba(10,10,13,0.96)',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the site, fonts, sections, or store to build…"
              disabled={busy}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '8px 10px',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.16)',
                background: '#08080a',
                color: 'var(--c-ink)',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              style={{
                padding: '0 14px',
                borderRadius: 2,
                border: 'none',
                background: busy || !input.trim() ? 'rgba(255,255,255,0.1)' : 'var(--c-amber)',
                color: busy || !input.trim() ? 'var(--c-ink-4)' : '#0a0a0c',
                fontFamily: 'var(--f-mono)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                cursor: busy || !input.trim() ? 'default' : 'pointer',
              }}
            >
              BUILD
            </button>
          </form>
        </section>
      )}

      <div className="cina-orb-dock">
        <button
          type="button"
          onClick={() => setChatOpen((o) => !o)}
          className={`cina-voice-orb ${isActive ? 'cina-voice-orb--active' : ''}`}
          aria-label={chatOpen ? 'Minimize Cina AI Architect' : 'Open Cina AI Architect'}
          aria-expanded={chatOpen}
          title={chatOpen ? 'Close Cina AI Architect (Esc)' : 'Open Cina AI Chat & Site Builder'}
        >
          <canvas
            ref={canvasRef}
            className="cina-voice-orb__canvas"
            aria-hidden="true"
          />
        </button>
        {!chatOpen && (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="cina-orb-badge"
            title="Chat with Cina AI to build your website"
          >
            ✦ AI ARCHITECT
          </button>
        )}
      </div>
    </div>
  );
};
