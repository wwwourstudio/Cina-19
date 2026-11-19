/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  Check,
  Clapperboard,
  Clock,
  Copy,
  Film,
  Flame,
  HeartHandshake,
  MessageSquare,
  Pause,
  Play,
  Radio,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
  Volume1,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';

export interface CinemaFeature {
  id: string;
  frameCode: string;
  title: string;
  director: string;
  studio: string;
  genre: 'Noir' | 'Sci-Fi' | 'Drama' | 'Western' | 'Thriller';
  kind: 'film' | 'series' | 'branched';
  season?: number;
  episodes?: number;
  watchedEps?: number;
  forksCount?: number;
  cutsCount?: number;
  watchedMinutes: number;
  totalMinutes: number;
  lastWatchedAt?: number;
  year: number;
  runtime: string;
  rating: string;
  logline: string;
  thumbnail: string;
  accentHex: string;
  routeHash: string;
}

const INITIAL_NOW = Date.now();
const HOUR_MS = 3600 * 1000;

const FEATURED_CINEMA: CinemaFeature[] = [
  {
    id: 'll',
    frameCode: '01',
    title: 'Last Light',
    director: 'Elias Voss',
    studio: 'Cina Pictures',
    genre: 'Noir',
    kind: 'series',
    season: 1,
    episodes: 8,
    watchedEps: 3,
    watchedMinutes: 166,
    totalMinutes: 368,
    lastWatchedAt: INITIAL_NOW - HOUR_MS * 2,
    year: 2026,
    runtime: 'Season 1 · 8 EP',
    rating: '4.7',
    logline:
      'A photographer discovers her missing sister inside an undeveloped roll of 35mm film, one frame per week.',
    thumbnail: '/assets/covers/a4.png',
    accentHex: '#e5482f',
    routeHash: '#/series/ll',
  },
  {
    id: 'swallows',
    frameCode: '02',
    title: 'The Swallows',
    director: 'Yara Kim',
    studio: 'Kestrel House',
    genre: 'Drama',
    kind: 'branched',
    forksCount: 4,
    cutsCount: 81,
    watchedMinutes: 134,
    totalMinutes: 134,
    lastWatchedAt: INITIAL_NOW - HOUR_MS * 72,
    year: 2025,
    runtime: '2h 14m',
    rating: '4.7',
    logline:
      'Three sisters return to their coastal childhood house to bury a fourth they never told anyone about.',
    thumbnail: '/assets/covers/a3.png',
    accentHex: '#c88c52',
    routeHash: '#/branches/swallows',
  },
  {
    id: 'drift',
    frameCode: '03',
    title: 'Drift',
    director: 'Tao Reng',
    studio: 'Meridian Orbital',
    genre: 'Sci-Fi',
    kind: 'film',
    watchedMinutes: 124,
    totalMinutes: 124,
    lastWatchedAt: INITIAL_NOW - HOUR_MS * 96,
    year: 2024,
    runtime: '2h 04m',
    rating: '4.6',
    logline:
      'Fourteen months beyond Mars orbit, a solitary telemetry pilot makes the unrecorded choice to turn around.',
    thumbnail: '/assets/covers/c1.png',
    accentHex: '#6aa3b8',
    routeHash: '#/film/drift',
  },
  {
    id: 'thefence',
    frameCode: '04',
    title: 'The Fence',
    director: 'Yara Kim',
    studio: 'Kestrel House',
    genre: 'Western',
    kind: 'film',
    watchedMinutes: 90,
    totalMinutes: 122,
    lastWatchedAt: INITIAL_NOW - HOUR_MS * 6,
    year: 2026,
    runtime: '2h 02m',
    rating: '4.5',
    logline:
      'Across a red-mesa boundary line in 1894, a widow refuses to surrender the last water basin to the rail syndicate.',
    thumbnail: '/assets/covers/b1.png',
    accentHex: '#c8643c',
    routeHash: '#/film/thefence',
  },
  {
    id: 'marauder',
    frameCode: '05',
    title: 'Marauder',
    director: 'Lin Hara',
    studio: 'North Dock Films',
    genre: 'Sci-Fi',
    kind: 'series',
    season: 2,
    episodes: 6,
    watchedEps: 1,
    watchedMinutes: 76,
    totalMinutes: 312,
    lastWatchedAt: INITIAL_NOW - HOUR_MS * 19,
    year: 2026,
    runtime: 'Season 2 · 6 EP',
    rating: '4.4',
    logline:
      'A deep-ice salvage vessel on Europa recovers a resonant hull fragment that learns to mimic crew voices.',
    thumbnail: '/assets/covers/c3.png',
    accentHex: '#7eb6ff',
    routeHash: '#/series/marauder',
  },
  {
    id: 'kindling',
    frameCode: '06',
    title: 'Kindling',
    director: 'Soren Vail',
    studio: 'Ash & Iron',
    genre: 'Thriller',
    kind: 'film',
    watchedMinutes: 0,
    totalMinutes: 104,
    year: 2026,
    runtime: '1h 44m',
    rating: '4.3',
    logline:
      'An arson investigator begins reconstructing ash patterns that match the blueprints of her own childhood street.',
    thumbnail: '/assets/covers/d4.png',
    accentHex: '#d85c3a',
    routeHash: '#/film/kindling',
  },
  {
    id: 'frequency',
    frameCode: '07',
    title: 'Frequency 88.6',
    director: 'Tao Reng',
    studio: 'Meridian Orbital',
    genre: 'Sci-Fi',
    kind: 'branched',
    forksCount: 4,
    cutsCount: 81,
    watchedMinutes: 37,
    totalMinutes: 98,
    lastWatchedAt: INITIAL_NOW - HOUR_MS * 38,
    year: 2026,
    runtime: '1h 38m',
    rating: '4.3',
    logline:
      'A late-night pirate radio DJ in 1979 starts intercepting magnetic tape broadcasts recorded by her future self.',
    thumbnail: '/assets/covers/c2.png',
    accentHex: '#9b8ec4',
    routeHash: '#/branches/frequency',
  },
  {
    id: 'salt',
    frameCode: '08',
    title: 'Salt Year',
    director: 'Eve Roan',
    studio: 'Harbor Light',
    genre: 'Drama',
    kind: 'film',
    watchedMinutes: 0,
    totalMinutes: 96,
    year: 2025,
    runtime: '1h 36m',
    rating: '4.5',
    logline:
      'Over four quiet seasons on the northern coast, a widower preserves each catch using his late wife’s notebook.',
    thumbnail: '/assets/covers/d2.png',
    accentHex: '#d4c5a0',
    routeHash: '#/film/salt',
  },
];

const GENRE_OPTIONS: Array<CinemaFeature['genre']> = [
  'Noir',
  'Sci-Fi',
  'Drama',
  'Western',
  'Thriller',
];

export interface UpcomingPremiere {
  id: string;
  title: string;
  director: string;
  studio: string;
  genre: string;
  releaseDate: string;
  format: string;
  thumbnail: string;
  accentHex: string;
  logline: string;
}

const UPCOMING_PREMIERES: UpcomingPremiere[] = [
  {
    id: 'up-stillwater',
    title: 'Stillwater Echo',
    director: 'Elias Voss',
    studio: 'Darkroom',
    genre: 'Noir Thriller',
    releaseDate: '2026-12-04',
    format: 'Feature · 1h 54m',
    thumbnail: '/assets/covers/a4.png',
    accentHex: '#e5482f',
    logline: 'An acoustic archivist uncovers a 1978 tape reel recorded inside an abandoned hydro-station beneath Oslo.',
  },
  {
    id: 'up-orbital',
    title: 'Orbital Nine',
    director: 'Lin Hara',
    studio: 'Atlas',
    genre: 'Sci-Fi',
    releaseDate: '2026-12-18',
    format: 'Series · 6 EP',
    thumbnail: '/assets/covers/c3.png',
    accentHex: '#7eb6ff',
    logline: 'Nine relay technicians maintain an ice-ring beacon whose optical telemetry begins arriving twelve minutes early.',
  },
  {
    id: 'up-redmesa',
    title: 'Red Mesa',
    director: 'Yara Kim',
    studio: 'Plains',
    genre: 'Western',
    releaseDate: '2027-01-09',
    format: 'Feature · 2h 08m',
    thumbnail: '/assets/covers/b1.png',
    accentHex: '#c8643c',
    logline: 'Two estranged sisters ride south to reclaim their surveyor father’s ledger before winter seals the pass.',
  },
  {
    id: 'up-magnetic',
    title: 'Magnetic South',
    director: 'Tao Reng',
    studio: 'Tape',
    genre: 'Synth Noir',
    releaseDate: '2027-01-23',
    format: 'Feature · 1h 42m',
    thumbnail: '/assets/covers/c2.png',
    accentHex: '#9b8ec4',
    logline: 'A late-night cassette restorer traces a bootleg broadcast across rain-slicked harbor highways.',
  },
];

function useCinematicVideoStream(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  posterUrl: string,
  accentHex: string
) {
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const captureFn = (
      canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }
    ).captureStream;

    if (typeof captureFn !== 'function') return;

    let rafId = 0;
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = posterUrl;

    const startTime = performance.now();

    const drawFrame = (now: number) => {
      if (!active) return;
      const elapsed = (now - startTime) * 0.001;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#070709';
      ctx.fillRect(0, 0, w, h);

      if (img.complete && img.naturalWidth > 0) {
        const scale = 1.04 + Math.sin(elapsed * 0.18) * 0.03;
        const panX = Math.sin(elapsed * 0.14) * 18;
        const panY = Math.cos(elapsed * 0.11) * 10;

        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = w / h;
        let drawW = w * scale;
        let drawH = h * scale;
        if (imgAspect > canvasAspect) {
          drawW = drawH * imgAspect;
        } else {
          drawH = drawW / imgAspect;
        }
        const dx = (w - drawW) / 2 + panX;
        const dy = (h - drawH) / 2 + panY;
        ctx.drawImage(img, dx, dy, drawW, drawH);
      }

      const glowX = w * (0.28 + Math.sin(elapsed * 0.22) * 0.12);
      const glowY = h * (0.35 + Math.cos(elapsed * 0.19) * 0.08);
      const grad = ctx.createRadialGradient(glowX, glowY, 20, glowX, glowY, w * 0.55);
      grad.addColorStop(0, `${accentHex}24`);
      grad.addColorStop(0.5, 'rgba(10, 10, 12, 0.08)');
      grad.addColorStop(1, 'rgba(5, 5, 7, 0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      rafId = requestAnimationFrame(drawFrame);
    };

    try {
      const stream = captureFn.call(canvas, 24);
      videoEl.srcObject = stream;
      void videoEl.play().catch(() => {
        // Fallback poster renders beneath video cleanly
      });
      rafId = requestAnimationFrame(drawFrame);
    } catch {
      // Fallback poster renders cleanly
    }

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      if (videoEl.srcObject instanceof MediaStream) {
        for (const track of videoEl.srcObject.getTracks()) {
          track.stop();
        }
        videoEl.srcObject = null;
      }
    };
  }, [videoRef, posterUrl, accentHex]);
}

interface HeroProps {
  features: CinemaFeature[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onStartWatching: (feature: CinemaFeature) => void;
  onEnterWatchRoom?: (hash?: string) => void;
}

export function Hero({
  features,
  activeIndex,
  onSelectIndex,
  onStartWatching,
  onEnterWatchRoom,
}: HeroProps) {
  const activeFeature = features[activeIndex] || features[0];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  useCinematicVideoStream(videoRef, activeFeature.thumbnail, activeFeature.accentHex);

  return (
    <section
      className="pm-hero"
      aria-label="Featured premiere screening"
    >
      <div className="pm-hero__img">
        {!imgFailed[activeFeature.id] ? (
          <img
            src={activeFeature.thumbnail}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={() =>
              setImgFailed((prev) => ({ ...prev, [activeFeature.id]: true }))
            }
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full"
            style={{
              background: `radial-gradient(circle at 30% 35%, ${activeFeature.accentHex}33 0%, var(--c-void) 72%)`,
            }}
          />
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={activeFeature.thumbnail}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="pm-hero__scrim" aria-hidden="true" />

      <div className="relative z-10 w-full">
        <div className="grid w-full grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,62%)_minmax(0,34%)] lg:justify-between lg:gap-[4%]">
          <div className="flex max-w-[44rem] flex-col gap-4">
            <div
              className="flex flex-wrap items-center gap-2 text-[var(--fs-label)] uppercase tracking-[0.16em] text-[var(--c-ink-2)]"
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              <span className="font-semibold text-[var(--c-amber)]">
                Tonight&apos;s Premiere · {activeFeature.frameCode} / 0{features.length}
              </span>
              <span aria-hidden="true" className="text-[var(--c-ink-4)]">
                ·
              </span>
              <span>{activeFeature.studio}</span>
            </div>

            <h1 className="pm-xl">{activeFeature.title}</h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--fs-body)] text-[var(--c-ink-2)]">
              <span className="font-medium text-[var(--c-ink)]">
                Directed by {activeFeature.director}
              </span>
              <span aria-hidden="true" className="text-[var(--c-ink-4)]">
                ·
              </span>
              <span>{activeFeature.genre}</span>
              <span aria-hidden="true" className="text-[var(--c-ink-4)]">
                ·
              </span>
              <span className="tabular-nums">{activeFeature.year}</span>
              <span aria-hidden="true" className="text-[var(--c-ink-4)]">
                ·
              </span>
              <span className="tabular-nums">{activeFeature.runtime}</span>
              <span aria-hidden="true" className="text-[var(--c-ink-4)]">
                ·
              </span>
              <span className="tabular-nums text-[var(--c-amber)]">
                ★ {activeFeature.rating}
              </span>
            </div>

            <p className="max-w-[54ch] text-[var(--fs-lead)] leading-[1.55] text-[var(--c-ink-2)]">
              {activeFeature.logline}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onStartWatching(activeFeature)}
                className="pm-btn pm-btn--primary whitespace-nowrap shrink-0"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Start Watching</span>
              </button>

              {onEnterWatchRoom && (
                <button
                  type="button"
                  onClick={() => onEnterWatchRoom(activeFeature.routeHash)}
                  className="pm-btn pm-btn--glass whitespace-nowrap shrink-0"
                >
                  <span>Full Screening Room</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Premiere lineup"
            className="w-full border border-white/12 bg-[rgba(10,10,12,0.78)] backdrop-blur-xl"
          >
            <div
              className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]"
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              <span>On the Marquee</span>
              <span className="text-[var(--c-amber)]">35mm Master</span>
            </div>
            {features.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectIndex(idx)}
                  className={`grid w-full grid-cols-[1.75rem_4rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 px-4 py-3 text-left transition-colors last:border-b-0 cursor-pointer ${
                    isSelected ? 'bg-white/8' : 'hover:bg-white/4'
                  }`}
                >
                  <span
                    className={`text-[0.72rem] tabular-nums ${
                      isSelected ? 'text-[var(--c-amber)] font-semibold' : 'text-[var(--c-ink-4)]'
                    }`}
                    style={{ fontFamily: 'var(--f-mono)' }}
                  >
                    {item.frameCode}
                  </span>
                  <span className="aspect-[16/10] w-full overflow-hidden bg-[var(--c-panel-2)]">
                    <img
                      src={item.thumbnail}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className={`truncate text-[0.88rem] ${
                        isSelected ? 'font-semibold text-[var(--c-ink)]' : 'font-medium text-[var(--c-ink-2)]'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span
                      className="truncate text-[0.68rem] tracking-[0.06em] text-[var(--c-ink-3)]"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      {item.director} · {item.genre}
                    </span>
                  </span>
                  <span
                    className={`text-[0.7rem] tabular-nums ${
                      isSelected ? 'text-[var(--c-amber)]' : 'text-[var(--c-ink-4)]'
                    }`}
                    style={{ fontFamily: 'var(--f-mono)' }}
                  >
                    ★ {item.rating}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatRelativeActivity(ts?: number): string {
  if (!ts) return 'Recent';
  const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 2) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function formatDurationLabel(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const rm = minutes % 60;
  return h > 0 ? (rm > 0 ? `${h}h ${rm}m` : `${h}h`) : `${rm}m`;
}

interface FeaturedCinemaProps {
  items: CinemaFeature[];
  continueWatchingItems: CinemaFeature[];
  totalCount: number;
  selectedGenres: Array<CinemaFeature['genre']>;
  genreCounts: Record<string, number>;
  onToggleGenre: (genre: CinemaFeature['genre']) => void;
  onClearGenres: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectFeature: (feature: CinemaFeature) => void;
  userRatings: Record<string, number>;
  onRateFeature: (featureId: string, stars: number) => void;
}

export function FeaturedCinema({
  items,
  continueWatchingItems,
  totalCount,
  selectedGenres,
  genreCounts,
  onToggleGenre,
  onClearGenres,
  searchQuery,
  onSearchChange,
  onSelectFeature,
  userRatings,
  onRateFeature,
}: FeaturedCinemaProps) {
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({});

  return (
    <section
      id="featured-cinema"
      aria-labelledby="featured-cinema-heading"
      className="w-full px-[4.5%] py-[6vh]"
    >
      {/* Continue Watching Row — partially watched items ordered by most recent activity */}
      {continueWatchingItems.length > 0 && (
        <div
          aria-labelledby="continue-watching-heading"
          className="mb-[5vh] border-b border-[var(--c-line)] pb-[4vh]"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span
                className="text-[var(--fs-label)] uppercase tracking-[0.16em] text-[var(--c-amber)]"
                style={{ fontFamily: 'var(--f-mono)' }}
              >
                Resume Screening · Most Recent First
              </span>
              <h2 id="continue-watching-heading" className="pm-h2">
                Continue Watching
              </h2>
            </div>
            <span
              className="text-[var(--fs-label)] tabular-nums uppercase tracking-[0.14em] text-[var(--c-ink-3)]"
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              {continueWatchingItems.length} In Progress
            </span>
          </div>

          <div className="flex w-full gap-[1.8%] overflow-x-auto pb-2 snap-x snap-mandatory">
            {continueWatchingItems.map((cw) => {
              const ratio = cw.totalMinutes > 0 ? Math.min(1, cw.watchedMinutes / cw.totalMinutes) : 0;
              const pct = Math.round(ratio * 100);
              const remainingMin = Math.max(1, cw.totalMinutes - cw.watchedMinutes);
              const isBroken = brokenThumbs[cw.id];

              return (
                <button
                  key={`cw-${cw.id}`}
                  type="button"
                  onClick={() => onSelectFeature(cw)}
                  aria-label={`Resume ${cw.title} at ${pct}%`}
                  className="group flex w-[78%] shrink-0 snap-start flex-col gap-2.5 border border-[var(--c-line)] bg-[var(--c-panel)] p-3 text-left transition-colors hover:border-[var(--c-amber)] sm:w-[46%] lg:w-[31%] xl:w-[23.5%] cursor-pointer"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--c-void)]">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(145deg, ${cw.accentHex}29 0%, var(--c-panel) 55%, var(--c-void) 100%)`,
                      }}
                    />
                    {!isBroken && cw.thumbnail && (
                      <img
                        src={cw.thumbnail}
                        alt={cw.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={() =>
                          setBrokenThumbs((prev) => ({ ...prev, [cw.id]: true }))
                        }
                        className="relative z-10 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                    <div className="absolute inset-x-2.5 bottom-3 z-30 flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 border border-[rgba(var(--accent-rgb),0.55)] bg-black/80 px-2 py-1 text-[0.64rem] uppercase tracking-[0.12em] text-[var(--c-amber)]"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                        <span>Resume · {pct}%</span>
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.1em] text-[var(--c-ink-2)] tabular-nums"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        <Clock className="h-3 w-3 text-[var(--c-ink-3)]" aria-hidden="true" />
                        <span>{formatRelativeActivity(cw.lastWatchedAt)}</span>
                      </span>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[3px] bg-white/15">
                      <span
                        className="block h-full bg-[var(--c-amber)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[var(--fs-body)] font-semibold text-[var(--c-ink)] group-hover:text-[var(--c-amber-x)] transition-colors">
                        {cw.title}
                      </span>
                      <span
                        className="shrink-0 text-[0.64rem] text-[var(--c-amber)] tabular-nums"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        {formatDurationLabel(remainingMin)} left
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between gap-2 text-[0.66rem] text-[var(--c-ink-3)] tabular-nums"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      <span className="truncate">
                        {cw.director}
                        {cw.kind === 'series' ? ` · EP ${(cw.watchedEps || 0) + 1}` : ''}
                      </span>
                      <span className="shrink-0 text-[var(--c-ink-2)]">
                        {formatDurationLabel(cw.watchedMinutes)} / {formatDurationLabel(cw.totalMinutes)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[var(--c-line)] pb-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <span
            className="text-[var(--fs-label)] uppercase tracking-[0.16em] text-[var(--c-amber)]"
            style={{ fontFamily: 'var(--f-mono)' }}
          >
            Curated Catalogue · Searchable Index
          </span>
          <h2 id="featured-cinema-heading" className="pm-h2">
            Featured Cinema
          </h2>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <div
            role="group"
            aria-label="Filter featured cinema by one or more genres"
            className="flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              aria-pressed={selectedGenres.length === 0}
              onClick={onClearGenres}
              className={`border-b-2 pb-2 text-[var(--fs-body)] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedGenres.length === 0
                  ? 'border-[var(--c-amber)] text-[var(--c-ink)] font-semibold'
                  : 'border-transparent text-[var(--c-ink-3)] hover:text-[var(--c-ink)]'
              }`}
            >
              All Genres
            </button>

            {GENRE_OPTIONS.map((genre) => {
              const active = selectedGenres.includes(genre);
              const count = genreCounts[genre] || 0;
              return (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggleGenre(genre)}
                  className={`inline-flex items-center gap-1.5 border-b-2 pb-2 text-[var(--fs-body)] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'border-[var(--c-amber)] text-[var(--c-ink)] font-semibold'
                      : 'border-transparent text-[var(--c-ink-3)] hover:text-[var(--c-ink)]'
                  }`}
                >
                  {active && (
                    <Check className="h-3.5 w-3.5 text-[var(--c-amber)] shrink-0" aria-hidden="true" />
                  )}
                  <span>{genre}</span>
                  <span
                    className={`text-[0.68rem] tabular-nums ${
                      active ? 'text-[var(--c-amber)]' : 'text-[var(--c-ink-4)]'
                    }`}
                    style={{ fontFamily: 'var(--f-mono)' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedGenres.length > 0 && (
            <div
              className="flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.12em] text-[var(--c-ink-3)]"
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              <span className="text-[var(--c-amber)] tabular-nums">
                {selectedGenres.length} {selectedGenres.length === 1 ? 'genre' : 'genres'} active · {items.length} matches
              </span>
              <button
                type="button"
                onClick={onClearGenres}
                className="border-0 bg-transparent p-0 text-[var(--c-ink-2)] underline underline-offset-4 hover:text-[var(--c-ink)] cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-[var(--c-line-2)] pb-3 focus-within:border-[var(--c-amber)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--c-ink-3)]" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by director, studio, title, or keyword…"
          aria-label="Filter Featured Cinema by director, studio, title, or keyword"
          className="min-w-0 flex-1 bg-transparent text-[var(--fs-lead)] text-[var(--c-ink)] placeholder:text-[var(--c-ink-4)] focus:outline-none"
        />
        <span
          className="text-[var(--fs-label)] tabular-nums text-[var(--c-ink-3)] shrink-0"
          style={{ fontFamily: 'var(--f-mono)' }}
        >
          {items.length} / {totalCount}
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="pm-btn h-8 px-3 text-[var(--fs-label)] shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="border border-[var(--c-line)] bg-[var(--c-panel)] px-[4%] py-12 text-center">
          <p className="text-[var(--fs-lead)] text-[var(--c-ink-2)]">
            No titles match your current filters.
          </p>
          <button
            type="button"
            onClick={() => {
              onClearGenres();
              onSearchChange('');
            }}
            className="pm-btn mt-4"
          >
            Show All Selections
          </button>
        </div>
      ) : (
        <div className="pm-grid">
          {items.map((item) => {
            const isBroken = brokenThumbs[item.id];
            const ratio = item.totalMinutes > 0 ? Math.min(1, item.watchedMinutes / item.totalMinutes) : 0;
            const pct = Math.round(ratio * 100);
            const completed = ratio >= 0.96;
            const watched = ratio > 0;
            const fmtMins = (m: number) => {
              if (m <= 0) return '0m';
              const h = Math.floor(m / 60);
              const rm = m % 60;
              return h > 0 ? (rm > 0 ? `${h}h ${rm}m` : `${h}h`) : `${rm}m`;
            };
            const userRating = userRatings[item.id] || 0;
            const hoveredStar = hoveredRatings[item.id] || 0;
            const activeStarCount = hoveredStar || userRating;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className="pm-card group"
                onClick={() => onSelectFeature(item)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectFeature(item);
                  }
                }}
                aria-label={`Watch ${item.title} directed by ${item.director}`}
              >
                {item.kind === 'series' && (
                  <div className="flex w-full flex-col items-center gap-[2px] -mb-[1px]" aria-hidden="true">
                    <span className="block h-[2px] w-[82%] bg-white/18" />
                    <span className="block h-[2px] w-[91%] bg-[var(--c-amber)]/45" />
                  </div>
                )}
                <div className="pm-card__img aspect-[2/3]">
                  {/* Resilient thumbnail placeholder container */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 flex flex-col justify-between p-4"
                    style={{
                      background: `linear-gradient(145deg, ${item.accentHex}29 0%, var(--c-panel) 55%, var(--c-void) 100%)`,
                    }}
                  >
                    <span
                      className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--c-ink-3)]"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      Reel {item.frameCode} · {item.genre}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span
                        className="truncate text-[1.1rem] italic text-[var(--c-ink)]"
                        style={{ fontFamily: 'var(--f-display)' }}
                      >
                        {item.title}
                      </span>
                      <span className="truncate text-[0.75rem] text-[var(--c-ink-3)]">
                        {item.director}
                      </span>
                    </div>
                  </div>

                  {!isBroken && item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={`${item.title} — directed by ${item.director}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() =>
                        setBrokenThumbs((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="relative z-10 h-full w-full object-cover"
                    />
                  )}

                  {item.kind === 'series' && (
                    <span
                      className="absolute top-2 left-2 z-20 border border-white/15 bg-black/75 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.13em] text-[var(--c-ink)]"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      S{item.season || 1} · {item.episodes || 8} EP
                    </span>
                  )}

                  {item.kind === 'branched' && (
                    <span
                      className="absolute top-2 left-2 z-20 border border-[rgba(var(--accent-rgb),0.55)] bg-black/80 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.13em] text-[var(--c-amber)] font-semibold"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      Branched · {item.cutsCount || 81} Cuts
                    </span>
                  )}

                  {item.kind === 'series' && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-[3px] z-20 flex flex-col gap-1 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pt-7 pb-2 transition-opacity duration-200 group-hover:opacity-0"
                    >
                      <div
                        className="flex items-center justify-between text-[0.58rem] uppercase tracking-[0.12em] text-[var(--c-ink-2)] tabular-nums"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        <span>Season {item.season || 1}</span>
                        <span>{item.watchedEps || 0}/{item.episodes || 8} EP</span>
                      </div>
                      <div
                        className="grid gap-[2px]"
                        style={{ gridTemplateColumns: `repeat(${item.episodes || 8}, minmax(0, 1fr))` }}
                      >
                        {Array.from({ length: item.episodes || 8 }).map((_, idx) => {
                          const isEpDone = idx < (item.watchedEps || 0);
                          const isEpCurrent = idx === (item.watchedEps || 0) && watched;
                          return (
                            <span
                              key={idx}
                              className={`block h-[3px] ${
                                isEpDone
                                  ? 'bg-[#8fd4a4]'
                                  : isEpCurrent
                                  ? 'bg-[var(--c-amber)]'
                                  : 'bg-white/20'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {item.kind === 'branched' && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-[3px] z-20 flex flex-col gap-1 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pt-7 pb-2 transition-opacity duration-200 group-hover:opacity-0"
                    >
                      <svg viewBox="0 0 240 40" className="h-8 w-full" aria-hidden="true">
                        <path d="M12,20 C45,20 55,8 78,8" fill="none" stroke="#e5a93c" strokeWidth="1.8" />
                        <path d="M12,20 C45,20 55,32 78,32" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.9" />
                        <path d="M78,8 C105,8 115,20 142,20" fill="none" stroke="#e5a93c" strokeWidth="1.8" />
                        <path d="M78,8 C105,8 115,8 142,8" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.8" />
                        <path d="M142,20 C170,20 180,8 210,8" fill="none" stroke="#e5a93c" strokeWidth="1.8" />
                        <path d="M142,20 C170,20 180,32 210,32" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.8" />
                        <circle cx="12" cy="20" r="2.5" fill="#e5a93c" />
                        <circle cx="78" cy="8" r="3" fill="#e5a93c" stroke="#fff" strokeWidth="0.8" />
                        <circle cx="78" cy="32" r="2" fill="#18181b" stroke="rgba(255,255,255,0.35)" />
                        <circle cx="142" cy="20" r="3" fill="#e5a93c" stroke="#fff" strokeWidth="0.8" />
                        <circle cx="210" cy="8" r="3" fill="#e5a93c" stroke="#fff" strokeWidth="0.8" />
                        <circle cx="210" cy="32" r="2" fill="#18181b" stroke="rgba(255,255,255,0.35)" />
                      </svg>
                      <div
                        className="flex items-center justify-between text-[0.58rem] uppercase tracking-[0.12em] text-[var(--c-amber)] tabular-nums"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        <span>{item.forksCount || 4} Forks · {item.cutsCount || 81} Cuts</span>
                      </div>
                    </div>
                  )}

                  {/* Hover screening cue + quick-star rating selection overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end gap-2 bg-gradient-to-t from-black/92 via-black/45 to-transparent p-3 pb-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    <div
                      role="group"
                      aria-label={`Rate ${item.title}`}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      onMouseLeave={() =>
                        setHoveredRatings((prev) => ({ ...prev, [item.id]: 0 }))
                      }
                      className="pointer-events-auto flex w-full items-center justify-between gap-2 border border-white/15 bg-[rgba(10,10,12,0.88)] px-2.5 py-1.5 backdrop-blur-md transition-colors hover:border-[rgba(var(--accent-rgb),0.55)]"
                    >
                      <span
                        className={`text-[0.58rem] uppercase tracking-[0.12em] tabular-nums whitespace-nowrap ${
                          userRating > 0 || hoveredStar > 0
                            ? 'font-semibold text-[var(--c-amber)]'
                            : 'text-[var(--c-ink-3)]'
                        }`}
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        {hoveredStar > 0
                          ? `${hoveredStar} / 5`
                          : userRating > 0
                          ? `You · ${userRating}/5`
                          : 'Rate'}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const lit = star <= activeStarCount;
                          return (
                            <button
                              key={star}
                              type="button"
                              aria-label={`Rate ${item.title} ${star} out of 5 stars`}
                              aria-pressed={userRating === star}
                              title={`Rate ${star}/5`}
                              onMouseEnter={() =>
                                setHoveredRatings((prev) => ({ ...prev, [item.id]: star }))
                              }
                              onFocus={() =>
                                setHoveredRatings((prev) => ({ ...prev, [item.id]: star }))
                              }
                              onBlur={() =>
                                setHoveredRatings((prev) => ({ ...prev, [item.id]: 0 }))
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                onRateFeature(item.id, star);
                              }}
                              className={`inline-flex h-5 w-5 items-center justify-center transition-transform duration-150 hover:scale-115 cursor-pointer ${
                                lit ? 'text-[var(--c-amber)]' : 'text-white/30'
                              }`}
                            >
                              <Star
                                className={`h-3 w-3 ${lit ? 'fill-current' : ''}`}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="truncate text-[0.66rem] uppercase tracking-[0.14em] text-[var(--c-ink-2)]"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        {item.genre} · ★ {item.rating}
                      </span>
                      <span
                        className="inline-flex shrink-0 items-center gap-1.5 border border-[rgba(var(--accent-rgb),0.5)] bg-black/75 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.14em] text-[var(--c-amber)]"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                        {watched && !completed ? 'Resume' : 'Watch'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom watch progress line on thumbnail */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[3px] bg-white/12 overflow-hidden">
                    <span
                      className={`block h-full ${completed ? 'bg-[#8fd4a4]' : 'bg-[var(--c-amber)]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-1 pt-0.5">
                  <span className="pm-card__t">{item.title}</span>
                  <span className="pm-card__m">
                    {item.director} · {item.year} · {item.runtime}
                    {userRating > 0 ? ` · You ★ ${userRating}/5` : ''}
                  </span>
                  <div className="mt-0.5 flex flex-col gap-1 border-t border-[var(--c-line)] pt-1">
                    <div
                      className="flex items-center justify-between gap-2 text-[0.64rem] tabular-nums"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      <span
                        className={`uppercase tracking-[0.08em] ${
                          completed
                            ? 'font-semibold text-[#8fd4a4]'
                            : watched
                            ? 'font-semibold text-[var(--c-amber)]'
                            : 'text-[var(--c-ink-4)]'
                        }`}
                      >
                        {completed ? 'Watched' : watched ? `Watched · ${pct}%` : 'Not watched'}
                      </span>
                      <span className="text-[var(--c-ink-2)]">
                        {watched
                          ? completed
                            ? `${fmtMins(item.totalMinutes)} watched`
                            : `${fmtMins(item.watchedMinutes)} / ${fmtMins(item.totalMinutes)}`
                          : `0m / ${fmtMins(item.totalMinutes)}`}
                      </span>
                    </div>
                    <div className="h-[2px] w-full bg-white/10 overflow-hidden">
                      <span
                        className={`block h-full ${completed ? 'bg-[#8fd4a4]' : 'bg-[var(--c-amber)]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface UpcomingPremieresProps {
  items: UpcomingPremiere[];
  notifiedIds: Record<string, boolean>;
  onToggleNotify: (id: string) => void;
}

export function UpcomingPremieres({ items, notifiedIds, onToggleNotify }: UpcomingPremieresProps) {
  return (
    <section
      id="upcoming-premieres"
      aria-labelledby="upcoming-premieres-heading"
      className="w-full border-t border-[var(--c-line)] px-[4.5%] py-[6vh]"
    >
      <div className="mb-8 flex flex-col justify-between gap-2 border-b border-[var(--c-line)] pb-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <span
            className="text-[var(--fs-label)] uppercase tracking-[0.16em] text-[var(--c-amber)]"
            style={{ fontFamily: 'var(--f-mono)' }}
          >
            Scheduled Release Calendar
          </span>
          <h2 id="upcoming-premieres-heading" className="pm-h2">
            Upcoming Premieres
          </h2>
        </div>
        <span
          className="text-[var(--fs-label)] tabular-nums uppercase tracking-[0.14em] text-[var(--c-ink-3)]"
          style={{ fontFamily: 'var(--f-mono)' }}
        >
          {items.length} World Premieres Scheduled
        </span>
      </div>

      <div className="grid w-full grid-cols-1 gap-[2.2vh_2%] md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const isNotified = !!notifiedIds[item.id];
          return (
            <article
              key={item.id}
              className="flex flex-col justify-between gap-4 border border-[var(--c-line)] bg-[var(--c-panel)] p-4"
            >
              <div className="flex flex-col gap-3">
                <div className="pm-card__img aspect-[16/9]">
                  <img
                    src={item.thumbnail}
                    alt={`${item.title} — directed by ${item.director}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div
                  className="flex items-center justify-between gap-2 border-b border-[var(--c-line)] pb-2 text-[var(--fs-label)] tabular-nums uppercase tracking-[0.12em]"
                  style={{ fontFamily: 'var(--f-mono)' }}
                >
                  <span className="font-semibold text-[var(--c-amber)]">{item.releaseDate}</span>
                  <span className="text-[var(--c-ink-3)]">{item.format}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3
                    className="text-[var(--fs-lead)] italic text-[var(--c-ink)]"
                    style={{ fontFamily: 'var(--f-display)' }}
                  >
                    {item.title}
                  </h3>
                  <span className="text-[var(--fs-label)] text-[var(--c-ink-3)]">
                    {item.director} · {item.studio} · {item.genre}
                  </span>
                  <p className="mt-1 text-[var(--fs-body)] leading-snug text-[var(--c-ink-2)]">
                    {item.logline}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-pressed={isNotified}
                onClick={() => onToggleNotify(item.id)}
                className={`pm-btn w-full justify-center whitespace-nowrap ${
                  isNotified ? 'border-[var(--c-amber)] text-[var(--c-amber)]' : ''
                }`}
              >
                {isNotified ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                <span>{isNotified ? 'Notified' : 'Notify Me'}</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type ScreeningReactionKey = 'applause' | 'cinema' | 'fire' | 'shock' | 'heartbreak';

interface ScreeningParticipant {
  userId: string;
  handle: string;
  color: string;
  joinedAt: number;
}

interface ScreeningChatMessage {
  id: string;
  roomId: string;
  userId: string;
  handle: string;
  color: string;
  kind: 'chat' | 'reaction' | 'system';
  text: string;
  reaction?: ScreeningReactionKey;
  timecode?: string;
  createdAt: number;
}

interface ReactionBurst {
  id: string;
  reaction: ScreeningReactionKey;
  handle: string;
  offsetX: number;
}

const SCREENING_REACTIONS: Array<{
  key: ScreeningReactionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'applause', label: 'Bravo', icon: Sparkles },
  { key: 'cinema', label: 'Cinema', icon: Clapperboard },
  { key: 'fire', label: 'Heat', icon: Flame },
  { key: 'shock', label: 'Shock', icon: Zap },
  { key: 'heartbreak', label: 'Cut Deep', icon: HeartHandshake },
];

const VIEWER_ACCENTS = ['#e8a33d', '#e5482f', '#5ca4a9', '#c88c52', '#9b87f5', '#68b684'];

function getOrCreateViewerIdentity() {
  try {
    let userId = window.localStorage.getItem('cina_screening_user_id');
    if (!userId) {
      userId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      window.localStorage.setItem('cina_screening_user_id', userId);
    }
    let handle = window.localStorage.getItem('cina_screening_handle');
    if (!handle) {
      handle = `Guest-${userId.slice(-3).toUpperCase()}`;
      window.localStorage.setItem('cina_screening_handle', handle);
    }
    let color = window.localStorage.getItem('cina_screening_color');
    if (!color) {
      color = VIEWER_ACCENTS[Math.floor(Math.random() * VIEWER_ACCENTS.length)];
      window.localStorage.setItem('cina_screening_color', color);
    }
    return { userId, handle, color };
  } catch {
    return {
      userId: `v_${Date.now().toString(36)}`,
      handle: 'Guest',
      color: '#e8a33d',
    };
  }
}

function formatClockTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatProgressClock(progressPct: number, totalMinutes: number): string {
  const totalSec = Math.max(60, Math.round((totalMinutes || 90) * 60));
  const curSec = Math.round((Math.max(0, Math.min(100, progressPct)) / 100) * totalSec);
  const h = Math.floor(curSec / 3600);
  const m = Math.floor((curSec % 3600) / 60);
  const s = curSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface ScreeningPlaybackState {
  playing: boolean;
  progress: number;
  muted: boolean;
  volume: number;
  updatedBy: string;
  updatedByHandle: string;
  updatedAt: number;
  seq: number;
}

interface ScreeningModalProps {
  feature: CinemaFeature;
  onClose: () => void;
  onEnterWatchRoom?: (hash?: string) => void;
  onProgressUpdate?: (featureId: string, watchedMinutes: number) => void;
}

function ScreeningModal({
  feature,
  onClose,
  onEnterWatchRoom,
  onProgressUpdate,
}: ScreeningModalProps) {
  const initialProgress = useMemo(() => {
    if (
      feature.totalMinutes > 0 &&
      feature.watchedMinutes > 0 &&
      feature.watchedMinutes < feature.totalMinutes
    ) {
      return Math.max(1, Math.min(99, Math.round((feature.watchedMinutes / feature.totalMinutes) * 100)));
    }
    return 14;
  }, [feature.id, feature.watchedMinutes, feature.totalMinutes]);

  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingQueueRef = useRef<string[]>([]);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  const [identity, setIdentity] = useState(() => getOrCreateViewerIdentity());
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [progress, setProgress] = useState(initialProgress);
  const [syncWatch, setSyncWatch] = useState(true);
  const [syncedByLabel, setSyncedByLabel] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [participants, setParticipants] = useState<ScreeningParticipant[]>([]);
  const [messages, setMessages] = useState<ScreeningChatMessage[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<ScreeningReactionKey, number>>({
    applause: 0,
    cinema: 0,
    fire: 0,
    shock: 0,
    heartbreak: 0,
  });
  const [bursts, setBursts] = useState<ReactionBurst[]>([]);
  const [draft, setDraft] = useState('');
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleInput, setHandleInput] = useState(identity.handle);
  const [copiedLink, setCopiedLink] = useState(false);

  const syncWatchRef = useRef(syncWatch);
  syncWatchRef.current = syncWatch;
  const isApplyingRemoteSyncRef = useRef(false);
  const lastRemoteSeqRef = useRef(0);
  const latestRoomPlaybackRef = useRef<ScreeningPlaybackState | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const roomId = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const customRoom = params.get('room');
      if (customRoom && customRoom.trim()) {
        return customRoom.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 64);
      }
    } catch {
      // ignore
    }
    return `screening-${feature.id}`;
  }, [feature.id]);

  useCinematicVideoStream(modalVideoRef, feature.thumbnail, feature.accentHex);

  // Keep DOM video element playing/muted/volume synchronized with React state
  useEffect(() => {
    const v = modalVideoRef.current;
    if (!v) return;
    v.muted = muted;
    v.volume = muted ? 0 : Math.max(0, Math.min(1, volume));
    if (playing) {
      if (v.paused) void v.play().catch(() => {});
    } else if (!v.paused) {
      v.pause();
    }
  }, [playing, muted, volume]);

  // Report watch progress + recency back to App for 'Continue Watching' ordering
  useEffect(() => {
    if (!onProgressUpdate || feature.totalMinutes <= 0) return;
    const mins = Math.max(
      1,
      Math.min(feature.totalMinutes, Math.round((progress / 100) * feature.totalMinutes))
    );
    onProgressUpdate(feature.id, mins);
  }, [feature.id, feature.totalMinutes, Math.floor(progress / 2), onProgressUpdate]);

  const applyRemotePlaybackState = useCallback(
    (pb: ScreeningPlaybackState) => {
      if (!pb || typeof pb.seq !== 'number') return;
      latestRoomPlaybackRef.current = pb;
      if (!syncWatchRef.current) return;
      if (pb.seq <= 0) return;
      if (pb.seq <= lastRemoteSeqRef.current) return;

      lastRemoteSeqRef.current = pb.seq;
      isApplyingRemoteSyncRef.current = true;
      setPlaying(Boolean(pb.playing));
      if (typeof pb.progress === 'number' && Number.isFinite(pb.progress)) {
        setProgress(Math.max(0, Math.min(100, pb.progress)));
      }
      if (typeof pb.muted === 'boolean') {
        setMuted(pb.muted);
      }
      if (typeof pb.volume === 'number' && Number.isFinite(pb.volume)) {
        setVolume(Math.max(0, Math.min(1, pb.volume)));
      }
      if (pb.updatedBy && pb.updatedBy !== identity.userId && pb.updatedByHandle) {
        setSyncedByLabel(`Aligned with ${pb.updatedByHandle}`);
      } else {
        setSyncedByLabel('Room aligned');
      }
      window.setTimeout(() => {
        isApplyingRemoteSyncRef.current = false;
      }, 0);
    },
    [identity.userId]
  );

  const spawnBurst = useCallback((reaction: ScreeningReactionKey, handle: string, id: string) => {
    const offsetX = Math.floor(Math.random() * 54) - 27;
    setBursts((prev) => [...prev.slice(-8), { id, reaction, handle, offsetX }]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 2150);
  }, []);

  const appendUniqueMessage = useCallback((incoming: ScreeningChatMessage) => {
    if (!incoming?.id) return;
    setMessages((prev) => {
      if (seenMessageIdsRef.current.has(incoming.id) && prev.some((m) => m.id === incoming.id)) {
        return prev;
      }
      seenMessageIdsRef.current.add(incoming.id);
      return [...prev.slice(-199), incoming];
    });
  }, []);

  // Real WebSocket room connection with auto-reconnect & authoritative sync
  useEffect(() => {
    let disposed = false;
    let reconnectTimer: number | null = null;
    let reconnectAttempt = 0;

    seenMessageIdsRef.current = new Set();
    lastRemoteSeqRef.current = 0;
    setMessages([]);
    setParticipants([]);
    setWsStatus('connecting');

    const connect = () => {
      if (disposed) return;
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const qs = new URLSearchParams({
        roomId,
        userId: identity.userId,
        handle: identity.handle,
        color: identity.color,
      });
      const ws = new WebSocket(`${wsProto}//${window.location.host}/ws/screening?${qs.toString()}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) {
          ws.close();
          return;
        }
        reconnectAttempt = 0;
        setWsStatus('connected');
        while (pendingQueueRef.current.length > 0) {
          const nextPayload = pendingQueueRef.current.shift();
          if (nextPayload && ws.readyState === WebSocket.OPEN) {
            ws.send(nextPayload);
          }
        }
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        let data: {
          type?: string;
          participants?: ScreeningParticipant[];
          messages?: ScreeningChatMessage[];
          message?: ScreeningChatMessage;
          event?: ScreeningChatMessage;
          reactionCounts?: Record<ScreeningReactionKey, number>;
          playbackState?: ScreeningPlaybackState;
        } | null = null;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!data?.type) return;

        if (data.type === 'room:sync') {
          const syncedMessages = Array.isArray(data.messages) ? data.messages : [];
          seenMessageIdsRef.current = new Set(syncedMessages.map((m) => m.id));
          setMessages(syncedMessages);
          if (Array.isArray(data.participants)) {
            setParticipants(data.participants);
          }
          if (data.reactionCounts) {
            setReactionCounts((prev) => ({ ...prev, ...data.reactionCounts }));
          }
          if (data.playbackState) {
            applyRemotePlaybackState(data.playbackState);
          }
        } else if (data.type === 'presence:update') {
          if (Array.isArray(data.participants)) {
            setParticipants(data.participants);
          }
        } else if (data.type === 'chat:message' && data.message) {
          appendUniqueMessage(data.message);
        } else if (data.type === 'reaction:event' && data.event) {
          if (data.reactionCounts) {
            setReactionCounts((prev) => ({ ...prev, ...data.reactionCounts }));
          }
          if (data.event.reaction) {
            spawnBurst(data.event.reaction, data.event.handle, data.event.id);
          }
          appendUniqueMessage(data.event);
        } else if (data.type === 'playback:state' && data.playbackState) {
          applyRemotePlaybackState(data.playbackState);
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        if (disposed) return;
        setWsStatus('reconnecting');
        const delay = Math.min(8000, 600 * Math.pow(1.6, reconnectAttempt));
        reconnectAttempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [roomId, appendUniqueMessage, spawnBurst, applyRemotePlaybackState]);

  // Auto-scroll messages feed when new messages arrive
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, chatOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : +(prev + 0.4).toFixed(1)));
    }, 250);
    return () => window.clearInterval(timer);
  }, [playing]);

  const sendSocketPayload = useCallback((payload: Record<string, unknown>) => {
    const encoded = JSON.stringify(payload);
    const sock = wsRef.current;
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(encoded);
    } else {
      pendingQueueRef.current.push(encoded);
    }
  }, []);

  const broadcastPlaybackSync = useCallback(
    (overrides?: Partial<{ playing: boolean; progress: number; muted: boolean; volume: number }>) => {
      if (!syncWatchRef.current || isApplyingRemoteSyncRef.current) return;
      sendSocketPayload({
        type: 'playback:sync',
        roomId,
        playing: overrides?.playing ?? playingRef.current,
        progress: overrides?.progress ?? progressRef.current,
        muted: overrides?.muted ?? mutedRef.current,
        volume: overrides?.volume ?? volumeRef.current,
      });
    },
    [roomId, sendSocketPayload]
  );

  const handleToggleSyncWatch = () => {
    setSyncWatch((prev) => {
      const next = !prev;
      syncWatchRef.current = next;
      if (next) {
        const remote = latestRoomPlaybackRef.current;
        if (remote && remote.seq > 0) {
          lastRemoteSeqRef.current = 0;
          applyRemotePlaybackState(remote);
        } else {
          sendSocketPayload({
            type: 'playback:sync',
            roomId,
            playing: playingRef.current,
            progress: progressRef.current,
            muted: mutedRef.current,
            volume: volumeRef.current,
          });
          setSyncedByLabel('Room aligned');
        }
      } else {
        setSyncedByLabel(null);
      }
      return next;
    });
  };

  const currentTimecode = formatProgressClock(progress, feature.totalMinutes);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    const msgId = `msg_${identity.userId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const optimistic: ScreeningChatMessage = {
      id: msgId,
      roomId,
      userId: identity.userId,
      handle: identity.handle,
      color: identity.color,
      kind: 'chat',
      text: clean,
      timecode: currentTimecode,
      createdAt: Date.now(),
    };
    appendUniqueMessage(optimistic);
    sendSocketPayload({
      type: 'chat:send',
      id: msgId,
      roomId,
      text: clean,
      timecode: currentTimecode,
    });
    setDraft('');
  };

  const handleSendReaction = (reaction: ScreeningReactionKey) => {
    const rxId = `rx_${identity.userId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    spawnBurst(reaction, identity.handle, rxId);
    setReactionCounts((prev) => ({
      ...prev,
      [reaction]: (prev[reaction] || 0) + 1,
    }));
    const labelMap: Record<ScreeningReactionKey, string> = {
      applause: 'applauded',
      cinema: 'marked pure cinema',
      fire: 'loved this moment',
      shock: 'gasped',
      heartbreak: 'felt that cut',
    };
    appendUniqueMessage({
      id: rxId,
      roomId,
      userId: identity.userId,
      handle: identity.handle,
      color: identity.color,
      kind: 'reaction',
      reaction,
      text: labelMap[reaction],
      timecode: currentTimecode,
      createdAt: Date.now(),
    });
    sendSocketPayload({
      type: 'reaction:send',
      id: rxId,
      roomId,
      reaction,
      timecode: currentTimecode,
    });
  };

  const handleSaveHandle = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = handleInput.trim().slice(0, 28) || identity.handle;
    setIdentity((prev) => ({ ...prev, handle: cleaned }));
    setHandleInput(cleaned);
    setEditingHandle(false);
    try {
      window.localStorage.setItem('cina_screening_handle', cleaned);
    } catch {
      // ignore
    }
    sendSocketPayload({
      type: 'profile:update',
      handle: cleaned,
      color: identity.color,
    });
  };

  const handleCopyInvite = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      void navigator.clipboard?.writeText(url.toString());
    } catch {
      // ignore
    }
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  const togglePlay = () => {
    const nextPlaying = !playingRef.current;
    setPlaying(nextPlaying);
    broadcastPlaybackSync({ playing: nextPlaying });
  };

  const handleSeek = (nextPct: number) => {
    setProgress(nextPct);
    broadcastPlaybackSync({ progress: nextPct });
  };

  const handleToggleMute = () => {
    const nextMuted = !mutedRef.current;
    setMuted(nextMuted);
    broadcastPlaybackSync({ muted: nextMuted });
  };

  const handleVolumeChange = (nextVol: number) => {
    const clamped = Math.max(0, Math.min(1, nextVol));
    const nextMuted = clamped === 0;
    setVolume(clamped);
    setMuted(nextMuted);
    broadcastPlaybackSync({ volume: clamped, muted: nextMuted });
  };

  const activeWatcherCount = Math.max(participants.length, wsStatus === 'connected' ? 1 : 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Screening ${feature.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-[2.5%] backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-[82rem] flex-col overflow-y-auto border border-[var(--c-line-2)] bg-[var(--c-panel)] shadow-2xl lg:overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--c-line)] px-[2.5%] py-3">
          <div className="flex min-w-0 flex-1 items-baseline gap-3">
            <span
              className="truncate text-[var(--fs-lead)] italic text-[var(--c-ink)]"
              style={{ fontFamily: 'var(--f-display)' }}
            >
              {feature.title}
            </span>
            <span
              className="hidden truncate text-[0.7rem] uppercase tracking-[0.14em] text-[var(--c-ink-3)] md:inline"
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              Dir. {feature.director} · {feature.genre} · {feature.runtime}
            </span>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span
              className="hidden items-center gap-1.5 border border-[var(--c-line)] bg-[var(--c-bg)] px-2.5 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-[var(--c-ink-2)] tabular-nums sm:inline-flex"
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              <Users className="h-3.5 w-3.5 text-[var(--c-amber)]" aria-hidden="true" />
              <span>{activeWatcherCount} Watching</span>
            </span>

            <button
              type="button"
              onClick={handleToggleSyncWatch}
              aria-pressed={syncWatch}
              title="Keep playback position, play/pause, and volume aligned with everyone in this screening room"
              className={`inline-flex h-9 items-center gap-1.5 border px-3 text-[0.7rem] uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                syncWatch
                  ? 'border-[var(--c-amber)] bg-[rgba(var(--accent-rgb),0.16)] text-[var(--c-amber)] font-semibold'
                  : 'border-[var(--c-line-2)] bg-transparent text-[var(--c-ink-3)] hover:border-[var(--c-amber)] hover:text-[var(--c-ink)]'
              }`}
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sync Watch: {syncWatch ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="inline-flex h-9 items-center gap-1.5 border border-[var(--c-line-2)] bg-transparent px-3 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--c-ink-2)] transition-colors hover:border-[var(--c-amber)] hover:text-[var(--c-ink)] cursor-pointer"
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--c-amber)]" aria-hidden="true" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Invite</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setChatOpen((prev) => !prev)}
              aria-pressed={chatOpen}
              className={`inline-flex h-9 items-center gap-1.5 border px-3 text-[0.7rem] uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                chatOpen
                  ? 'border-[var(--c-amber)] bg-[rgba(var(--accent-rgb),0.14)] text-[var(--c-ink)]'
                  : 'border-[var(--c-line-2)] bg-transparent text-[var(--c-ink-2)] hover:border-[var(--c-amber)] hover:text-[var(--c-ink)]'
              }`}
              style={{ fontFamily: 'var(--f-mono)' }}
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close screening player"
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--c-line-2)] text-[var(--c-ink-2)] transition-colors hover:border-[var(--c-amber)] hover:text-[var(--c-ink)] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Body: Stage (left) + Real-Time Screening Chat Sidebar (right) */}
        <div
          className={`grid min-h-0 flex-1 ${
            chatOpen
              ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30%)]'
              : 'grid-cols-1'
          }`}
        >
          {/* Left Column: Cinema Video Stage + Logline Footer */}
          <div className="flex min-w-0 flex-col bg-[var(--c-void)]">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--c-void)]">
              <img
                src={feature.thumbnail}
                alt={feature.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-85"
              />
              <video
                ref={modalVideoRef}
                autoPlay
                muted={muted}
                loop
                playsInline
                poster={feature.thumbnail}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />

              {/* Floating Real-Time WebSocket Reaction Bursts */}
              {bursts.length > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-24 right-[4%] z-10 flex flex-col items-end gap-1.5"
                >
                  {bursts.map((burst) => {
                    const rxMeta = SCREENING_REACTIONS.find((r) => r.key === burst.reaction);
                    const RxIcon = rxMeta?.icon || Sparkles;
                    return (
                      <div
                        key={burst.id}
                        className="cina-reaction-burst inline-flex items-center gap-1.5 border border-[rgba(var(--accent-rgb),0.45)] bg-black/75 px-2.5 py-1 text-[0.72rem] text-[var(--c-ink)] backdrop-blur-sm"
                        style={{ marginRight: `${Math.max(0, burst.offsetX + 18)}px` }}
                      >
                        <RxIcon className="h-3.5 w-3.5 text-[var(--c-amber)]" />
                        <span className="font-medium">{burst.handle}</span>
                        <span
                          className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--c-ink-3)]"
                          style={{ fontFamily: 'var(--f-mono)' }}
                        >
                          {rxMeta?.label || burst.reaction}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Video Transport Controls */}
              <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-[3%]">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={progress}
                    aria-label="Screening timeline"
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="h-1 flex-1 cursor-pointer accent-[var(--c-amber)]"
                  />
                  <span
                    className="text-[0.7rem] tabular-nums text-[var(--c-ink-2)]"
                    style={{ fontFamily: 'var(--f-mono)' }}
                  >
                    {currentTimecode} · {Math.floor(progress)}%
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="pm-btn pm-btn--primary h-9 px-4"
                    >
                      {playing ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2 border border-white/18 bg-black/55 px-2.5 h-9 backdrop-blur-md">
                      <button
                        type="button"
                        onClick={handleToggleMute}
                        aria-label={muted ? 'Unmute screening audio' : 'Mute screening audio'}
                        className="border-0 bg-transparent p-0 text-[var(--c-ink-2)] hover:text-[var(--c-ink)] cursor-pointer"
                      >
                        {muted || volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : volume < 0.5 ? (
                          <Volume1 className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={muted ? 0 : Math.round(volume * 100)}
                        aria-label="Screening volume"
                        onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
                        className="h-1 w-16 cursor-pointer accent-[var(--c-amber)] sm:w-20"
                      />
                      <span
                        className="w-8 text-right text-[0.64rem] tabular-nums text-[var(--c-ink-2)]"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        {muted ? '0%' : `${Math.round(volume * 100)}%`}
                      </span>
                    </div>

                    {syncWatch && (
                      <span
                        className="hidden items-center gap-1.5 border border-[rgba(var(--accent-rgb),0.4)] bg-black/60 px-2.5 h-9 text-[0.64rem] uppercase tracking-[0.12em] text-[var(--c-amber)] sm:inline-flex"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        <Radio className="h-3 w-3" aria-hidden="true" />
                        <span>{syncedByLabel || 'Sync Active'}</span>
                      </span>
                    )}
                  </div>

                  {onEnterWatchRoom && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEnterWatchRoom(feature.routeHash);
                      }}
                      className="pm-btn pm-btn--glass h-9"
                    >
                      <Film className="h-3.5 w-3.5" />
                      <span>Open Full Dossier in Cina Watch</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[var(--c-line)] bg-[var(--c-bg)] px-[3.2%] py-3.5 sm:flex-row sm:items-center">
              <p className="max-w-[65ch] text-[var(--fs-body)] leading-relaxed text-[var(--c-ink-2)]">
                {feature.logline}
              </p>
              <span
                className="shrink-0 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--c-ink-3)] tabular-nums"
                style={{ fontFamily: 'var(--f-mono)' }}
              >
                {feature.studio} · ★ {feature.rating}
              </span>
            </div>
          </div>

          {/* Right Column: Real-Time Screening Chat Sidebar */}
          {chatOpen && (
            <aside
              aria-label="Screening Chat"
              className="flex min-h-[22rem] max-h-[44vh] flex-col border-t border-[var(--c-line)] bg-[var(--c-panel)] lg:max-h-[42rem] lg:min-h-0 lg:border-l lg:border-t-0"
            >
              {/* Chat Header + Live Presence + Editable Handle */}
              <div className="flex flex-col gap-2.5 border-b border-[var(--c-line)] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div
                      className="text-[0.64rem] uppercase tracking-[0.16em] text-[var(--c-amber)]"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      Screening Chat
                    </div>
                    <div
                      className="truncate text-[1.05rem] italic text-[var(--c-ink)]"
                      style={{ fontFamily: 'var(--f-display)' }}
                    >
                      Watch With Friends
                    </div>
                  </div>
                  <div
                    className="shrink-0 text-right text-[0.65rem] uppercase tracking-[0.12em] tabular-nums"
                    style={{
                      fontFamily: 'var(--f-mono)',
                      color:
                        wsStatus === 'connected'
                          ? 'var(--c-ink-2)'
                          : 'var(--c-amber)',
                    }}
                  >
                    {wsStatus === 'connected'
                      ? `${activeWatcherCount} online`
                      : wsStatus === 'reconnecting'
                        ? 'Reconnecting'
                        : 'Connecting'}
                  </div>
                </div>

                {/* Connected Friends & Self Handle Editor */}
                {editingHandle ? (
                  <form onSubmit={handleSaveHandle} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={handleInput}
                      maxLength={28}
                      onChange={(e) => setHandleInput(e.target.value)}
                      placeholder="Your screen name…"
                      aria-label="Your screening chat handle"
                      autoFocus
                      className="h-8 min-w-0 flex-1 border border-[var(--c-line-2)] bg-[var(--c-bg)] px-2.5 text-[0.78rem] text-[var(--c-ink)] focus:border-[var(--c-amber)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-8 bg-[var(--c-amber)] px-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--c-on-amber)] cursor-pointer"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
                      {participants.length === 0 ? (
                        <span
                          className="text-[0.68rem] text-[var(--c-ink-3)]"
                          style={{ fontFamily: 'var(--f-mono)' }}
                        >
                          Signed in as {identity.handle}
                        </span>
                      ) : (
                        participants.slice(0, 5).map((p) => {
                          const isSelf = p.userId === identity.userId;
                          return (
                            <span
                              key={p.userId}
                              title={p.handle}
                              className="inline-flex shrink-0 items-center gap-1 border border-[var(--c-line)] bg-[var(--c-bg)] px-2 py-0.5 text-[0.65rem] text-[var(--c-ink-2)]"
                              style={{ fontFamily: 'var(--f-mono)' }}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0"
                                style={{ backgroundColor: isSelf ? 'var(--c-amber)' : p.color }}
                              />
                              <span className="max-w-[5.5rem] truncate">
                                {isSelf ? `${p.handle} (you)` : p.handle}
                              </span>
                            </span>
                          );
                        })
                      )}
                      {participants.length > 5 && (
                        <span
                          className="shrink-0 text-[0.65rem] text-[var(--c-ink-3)] tabular-nums"
                          style={{ fontFamily: 'var(--f-mono)' }}
                        >
                          +{participants.length - 5}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setHandleInput(identity.handle);
                        setEditingHandle(true);
                      }}
                      className="shrink-0 border-0 bg-transparent p-0 text-[0.66rem] uppercase tracking-[0.12em] text-[var(--c-amber)] underline-offset-4 hover:underline cursor-pointer"
                      style={{ fontFamily: 'var(--f-mono)' }}
                    >
                      Name
                    </button>
                  </div>
                )}
              </div>

              {/* Live Reactions Strip */}
              <div className="grid grid-cols-5 border-b border-[var(--c-line)] bg-[var(--c-bg)]">
                {SCREENING_REACTIONS.map((rx, idx) => {
                  const IconComp = rx.icon;
                  const count = reactionCounts[rx.key] || 0;
                  return (
                    <button
                      key={rx.key}
                      type="button"
                      onClick={() => handleSendReaction(rx.key)}
                      title={`Send ${rx.label} reaction`}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[var(--c-ink-2)] transition-colors hover:bg-[rgba(var(--accent-rgb),0.1)] hover:text-[var(--c-ink)] cursor-pointer ${
                        idx > 0 ? 'border-l border-[var(--c-line)]' : ''
                      }`}
                    >
                      <IconComp className="h-3.5 w-3.5 text-[var(--c-amber)]" aria-hidden="true" />
                      <span
                        className="text-[0.62rem] uppercase tracking-[0.06em] tabular-nums"
                        style={{ fontFamily: 'var(--f-mono)' }}
                      >
                        {count > 0 ? count : rx.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Live Messages & Reactions Feed */}
              <div
                ref={chatScrollRef}
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3.5"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                    <MessageSquare className="h-5 w-5 text-[var(--c-ink-4)]" aria-hidden="true" />
                    <p className="max-w-[24ch] text-[0.82rem] leading-relaxed text-[var(--c-ink-3)]">
                      Screening room is quiet. Share the room link with friends or drop the first reaction below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.userId === identity.userId;
                    if (msg.kind === 'reaction') {
                      const rxMeta = SCREENING_REACTIONS.find((r) => r.key === msg.reaction);
                      const RxIcon = rxMeta?.icon || Sparkles;
                      return (
                        <div
                          key={msg.id}
                          className="flex items-center justify-between gap-2 border-l-2 border-[var(--c-amber)] bg-[rgba(var(--accent-rgb),0.06)] px-2.5 py-1.5 text-[0.74rem] text-[var(--c-ink-2)]"
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            <RxIcon className="h-3.5 w-3.5 shrink-0 text-[var(--c-amber)]" aria-hidden="true" />
                            <span className="truncate font-medium text-[var(--c-ink)]">
                              {isSelf ? `${msg.handle} (you)` : msg.handle}
                            </span>
                            <span className="truncate text-[var(--c-ink-3)]">{msg.text}</span>
                          </div>
                          {msg.timecode && (
                            <span
                              className="shrink-0 text-[0.64rem] text-[var(--c-ink-4)] tabular-nums"
                              style={{ fontFamily: 'var(--f-mono)' }}
                            >
                              @{msg.timecode}
                            </span>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className="flex flex-col gap-1 border-b border-[var(--c-line)] pb-2.5 last:border-b-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              className="h-1.5 w-1.5 shrink-0"
                              style={{ backgroundColor: isSelf ? 'var(--c-amber)' : msg.color || '#e8a33d' }}
                            />
                            <span
                              className={`truncate text-[0.78rem] font-semibold ${
                                isSelf ? 'text-[var(--c-amber)]' : 'text-[var(--c-ink)]'
                              }`}
                            >
                              {isSelf ? `${msg.handle} (you)` : msg.handle}
                            </span>
                            {msg.timecode && (
                              <span
                                className="text-[0.64rem] text-[var(--c-ink-4)] tabular-nums"
                                style={{ fontFamily: 'var(--f-mono)' }}
                              >
                                @{msg.timecode}
                              </span>
                            )}
                          </div>
                          <span
                            className="shrink-0 text-[0.64rem] text-[var(--c-ink-4)] tabular-nums"
                            style={{ fontFamily: 'var(--f-mono)' }}
                          >
                            {formatClockTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="break-words text-[0.84rem] leading-snug text-[var(--c-ink-2)]">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 border-t border-[var(--c-line)] bg-[var(--c-bg)] p-3"
              >
                <input
                  type="text"
                  value={draft}
                  maxLength={480}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Whisper to the screening room…"
                  aria-label="Send a message to Screening Chat"
                  className="h-9 min-w-0 flex-1 border border-[var(--c-line-2)] bg-[var(--c-panel)] px-3 text-[0.84rem] text-[var(--c-ink)] placeholder:text-[var(--c-ink-4)] focus:border-[var(--c-amber)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send message"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 bg-[var(--c-amber)] px-3.5 text-[0.74rem] font-semibold uppercase tracking-[0.1em] text-[var(--c-on-amber)] transition-opacity disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                  style={{ fontFamily: 'var(--f-mono)' }}
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </form>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

interface AppProps {
  onEnterWatch?: (hash?: string) => void;
}

interface WatchActivityRecord {
  watchedMinutes: number;
  lastWatchedAt: number;
}

function loadSavedWatchActivity(): Record<string, WatchActivityRecord> {
  try {
    const raw = window.localStorage.getItem('cina_watch_activity_v1');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, WatchActivityRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function loadSavedUserRatings(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem('cina_user_ratings_v1');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function App({ onEnterWatch }: AppProps) {
  const heroFeatures = useMemo(() => FEATURED_CINEMA.slice(0, 4), []);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<Array<CinemaFeature['genre']>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifiedIds, setNotifiedIds] = useState<Record<string, boolean>>({});
  const [activeScreeningId, setActiveScreeningId] = useState<string | null>(null);
  const [watchActivity, setWatchActivity] = useState<Record<string, WatchActivityRecord>>(() =>
    loadSavedWatchActivity()
  );
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() =>
    loadSavedUserRatings()
  );

  const handleToggleGenre = useCallback((genre: CinemaFeature['genre']) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }, []);

  const handleClearGenres = useCallback(() => {
    setSelectedGenres([]);
  }, []);

  const handleRateFeature = useCallback((featureId: string, stars: number) => {
    const clamped = Math.max(1, Math.min(5, Math.round(stars)));
    setUserRatings((prev) => {
      const next = { ...prev, [featureId]: clamped };
      try {
        window.localStorage.setItem('cina_user_ratings_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const featuresWithProgress = useMemo(() => {
    return FEATURED_CINEMA.map((item) => {
      const override = watchActivity[item.id];
      if (!override) return item;
      return {
        ...item,
        watchedMinutes: override.watchedMinutes,
        lastWatchedAt: override.lastWatchedAt,
      };
    });
  }, [watchActivity]);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    featuresWithProgress.forEach((item) => {
      counts[item.genre] = (counts[item.genre] || 0) + 1;
    });
    return counts;
  }, [featuresWithProgress]);

  const continueWatchingItems = useMemo(() => {
    return featuresWithProgress
      .filter(
        (item) =>
          item.totalMinutes > 0 &&
          item.watchedMinutes > 0 &&
          item.watchedMinutes < item.totalMinutes
      )
      .sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0));
  }, [featuresWithProgress]);

  const visibleCinema = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return featuresWithProgress.filter((item) => {
      if (selectedGenres.length > 0 && !selectedGenres.includes(item.genre)) return false;
      if (!q) return true;
      const haystack = `${item.title} ${item.director} ${item.studio} ${item.genre} ${item.logline} ${item.year}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [featuresWithProgress, selectedGenres, searchQuery]);

  const activeScreening = useMemo(
    () => featuresWithProgress.find((f) => f.id === activeScreeningId) || null,
    [featuresWithProgress, activeScreeningId]
  );

  const handleProgressUpdate = useCallback((featureId: string, watchedMinutes: number) => {
    setWatchActivity((prev) => {
      const now = Date.now();
      const existing = prev[featureId];
      if (existing && existing.watchedMinutes === watchedMinutes && now - existing.lastWatchedAt < 4000) {
        return prev;
      }
      const next = {
        ...prev,
        [featureId]: {
          watchedMinutes,
          lastWatchedAt: now,
        },
      };
      try {
        window.localStorage.setItem('cina_watch_activity_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const openAtlas = () => {
    const w = window as unknown as { toggleCinaAtlas?: (force?: boolean) => boolean };
    if (typeof w.toggleCinaAtlas === 'function') {
      w.toggleCinaAtlas(true);
    } else if (onEnterWatch) {
      onEnterWatch('#/');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--c-bg)] text-[var(--c-ink)]">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 flex h-[3.75rem] w-full items-center justify-between gap-8 border-b border-[var(--c-line)] bg-[rgba(10,10,10,0.88)] px-[4.5%]">
        <a
          href="#top"
          className="text-[1.45rem] italic tracking-[-0.025em] text-[var(--c-ink)] no-underline whitespace-nowrap shrink-0"
          style={{ fontFamily: 'var(--f-display)' }}
        >
          Cina
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-[var(--fs-body)] font-medium text-[var(--c-ink-3)]"
        >
          <a
            href="#featured-cinema"
            className="text-[var(--c-ink)] no-underline hover:text-[var(--c-amber-x)] transition-colors whitespace-nowrap shrink-0"
          >
            Featured
          </a>
          <button
            type="button"
            onClick={() => onEnterWatch?.('#/')}
            className="bg-transparent border-0 p-0 text-inherit hover:text-[var(--c-ink)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Screening Room
          </button>
          <a
            href="Cina.html"
            className="text-inherit no-underline hover:text-[var(--c-ink)] transition-colors whitespace-nowrap shrink-0"
          >
            Studio
          </a>
          <a
            href="Producers.html"
            className="text-inherit no-underline hover:text-[var(--c-ink)] transition-colors whitespace-nowrap shrink-0"
          >
            Producers
          </a>
          <a
            href="About.html"
            className="text-inherit no-underline hover:text-[var(--c-ink)] transition-colors whitespace-nowrap shrink-0"
          >
            Manifesto
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openAtlas}
            className="pm-btn h-9 px-4 text-[var(--fs-label)] uppercase tracking-[0.12em] whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--f-mono)' }}
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Workspace Atlas</span>
          </button>
        </div>
      </header>

      <main id="top" className="w-full">
        <Hero
          features={heroFeatures}
          activeIndex={heroIndex}
          onSelectIndex={setHeroIndex}
          onStartWatching={(feature) => setActiveScreeningId(feature.id)}
          onEnterWatchRoom={onEnterWatch}
        />

        <FeaturedCinema
          items={visibleCinema}
          continueWatchingItems={continueWatchingItems}
          totalCount={featuresWithProgress.length}
          selectedGenres={selectedGenres}
          genreCounts={genreCounts}
          onToggleGenre={handleToggleGenre}
          onClearGenres={handleClearGenres}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectFeature={(feature) => setActiveScreeningId(feature.id)}
          userRatings={userRatings}
          onRateFeature={handleRateFeature}
        />

        <UpcomingPremieres
          items={UPCOMING_PREMIERES}
          notifiedIds={notifiedIds}
          onToggleNotify={(id) =>
            setNotifiedIds((prev) => ({ ...prev, [id]: !prev[id] }))
          }
        />
      </main>

      <footer className="flex w-full flex-col justify-between gap-4 border-t border-[var(--c-line)] px-[4.5%] py-[4vh] text-[var(--fs-label)] text-[var(--c-ink-3)] sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span
            className="text-[1.15rem] italic text-[var(--c-ink)]"
            style={{ fontFamily: 'var(--f-display)' }}
          >
            Cina
          </span>
          <span aria-hidden="true" className="text-[var(--c-ink-4)]">
            ·
          </span>
          <span>Curated cinema &amp; director-owned studios</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={() => onEnterWatch?.('#/')}
            className="bg-transparent border-0 p-0 text-inherit hover:text-[var(--c-ink)] transition-colors cursor-pointer whitespace-nowrap"
          >
            Watch Screening Room
          </button>
          <a
            href="Cina.html"
            className="text-inherit no-underline hover:text-[var(--c-ink)] transition-colors whitespace-nowrap"
          >
            Cina Studio
          </a>
          <a
            href="Producers.html"
            className="text-inherit no-underline hover:text-[var(--c-ink)] transition-colors whitespace-nowrap"
          >
            Producers Market
          </a>
          <a
            href="About.html"
            className="text-inherit no-underline hover:text-[var(--c-ink)] transition-colors whitespace-nowrap"
          >
            Manifesto
          </a>
        </div>
      </footer>

      {activeScreening && (
        <ScreeningModal
          feature={activeScreening}
          onClose={() => setActiveScreeningId(null)}
          onEnterWatchRoom={onEnterWatch}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
    </div>
  );
}
