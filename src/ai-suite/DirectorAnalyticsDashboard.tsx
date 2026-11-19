import React, { useEffect, useMemo, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  Film,
  Globe,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';

export interface StudioProjectMetric {
  id: string;
  title: string;
  code: string;
  kind: string;
  status: string;
  genre: string;
  runtime: string;
  published?: boolean;
  views?: number;
  avgWatch?: number;
  completionRate?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  countries?: number;
  topRegion?: string;
  rating?: number;
  ratings?: number;
  dailyViews?: number[];
  retention?: number[];
}

export interface CatalogFilmMetric {
  id: string;
  title: string;
  creator: string;
  creatorId: string;
  kind: string;
  genre: string[];
  year: number;
  rating: number;
  ratings: number;
  views: number;
}

declare global {
  interface Window {
    PROJECTS?: StudioProjectMetric[];
    openDirectorAnalytics?: (focusFilmId?: string) => void;
    closeDirectorAnalytics?: () => void;
    mountDirectorAnalytics?: (
      container: HTMLElement | null,
      props?: DirectorAnalyticsProps
    ) => (() => void) | void;
  }
}

export interface DirectorAnalyticsProps {
  embedded?: boolean;
  initialRange?: '7d' | '14d' | '30d';
  initialFocusId?: string;
  onSelectFilm?: (filmId: string) => void;
  onClose?: () => void;
}

const FALLBACK_PROJECTS: StudioProjectMetric[] = [
  {
    id: 'p1',
    title: 'LAST LIGHT',
    code: 'LL-01',
    kind: 'movie',
    status: 'in production',
    genre: 'Neo-Noir Thriller',
    runtime: '1h 42m',
    published: true,
    views: 142835,
    avgWatch: 0.78,
    completionRate: 0.61,
    likes: 8421,
    comments: 312,
    shares: 1840,
    countries: 47,
    topRegion: 'United States',
    rating: 4.7,
    ratings: 1284,
    dailyViews: [4200, 5100, 4800, 6300, 7100, 9400, 12800, 14200, 13100, 16800, 18400, 15600, 11200, 8400],
    retention: [
      100, 99, 98, 97, 96, 95, 93, 91, 89, 88, 87, 87, 86, 85, 84, 84, 83, 82, 82, 81, 80, 79, 79, 78, 78,
      77, 77, 76, 76, 75, 75, 74, 74, 73, 73, 72, 72, 71, 71, 70, 69, 69, 68, 68, 67, 67, 66, 66, 65, 65,
      64, 64, 63, 63, 62, 62, 61, 61, 60, 60, 59, 59, 58, 58, 57, 57, 56, 56, 55, 55, 54, 54, 53, 53, 52,
      52, 51, 51, 50, 50, 49, 49, 48, 48, 47, 47, 46, 46, 45, 45, 44, 44, 43, 43, 42, 41, 40, 38, 35, 30,
    ],
  },
  {
    id: 'p5',
    title: 'BLUEJAY',
    code: 'BJ-05',
    kind: 'movie',
    status: 'released',
    genre: 'Drama Short',
    runtime: '0h 28m',
    published: true,
    views: 481220,
    avgWatch: 0.86,
    completionRate: 0.74,
    likes: 32140,
    comments: 1092,
    shares: 6480,
    countries: 89,
    topRegion: 'Japan',
    rating: 4.9,
    ratings: 4211,
    dailyViews: [38000, 42000, 51000, 48000, 39000, 32000, 28000, 24000, 22000, 19000, 17000, 15000, 14000, 13000],
    retention: [
      100, 99, 99, 98, 98, 97, 97, 96, 96, 95, 95, 94, 94, 94, 93, 93, 93, 92, 92, 92, 91, 91, 91, 90, 90,
      90, 90, 89, 89, 89, 89, 88, 88, 88, 88, 88, 87, 87, 87, 87, 87, 86, 86, 86, 86, 86, 85, 85, 85, 85,
      85, 85, 84, 84, 84, 84, 84, 84, 83, 83, 83, 83, 83, 83, 82, 82, 82, 82, 82, 82, 81, 81, 81, 81, 81,
      81, 80, 80, 80, 80, 80, 80, 79, 79, 79, 79, 79, 79, 78, 78, 78, 77, 76, 75, 74, 73, 72, 70, 68, 65,
    ],
  },
];

const FALLBACK_CATALOG: CatalogFilmMetric[] = [
  { id: 'drift', title: 'Drift', creator: 'Tao Reng', creatorId: 'reng', kind: 'film', genre: ['Sci-fi'], year: 2024, rating: 4.6, ratings: 58200, views: 1300000 },
  { id: 'swallows', title: 'The Swallows', creator: 'Yara Kim', creatorId: 'ykim', kind: 'film', genre: ['Drama'], year: 2025, rating: 4.7, ratings: 44500, views: 1100000 },
  { id: 'bluejay', title: 'Bluejay', creator: 'Elias Voss', creatorId: 'voss', kind: 'film', genre: ['Drama'], year: 2025, rating: 4.6, ratings: 38000, views: 920000 },
  { id: 'after', title: 'Afterlight', creator: 'Mira Sten', creatorId: 'sten', kind: 'film', genre: ['Romance'], year: 2025, rating: 4.4, ratings: 31200, views: 620000 },
  { id: 'frequency', title: 'Frequency 88.6', creator: 'Tao Reng', creatorId: 'reng', kind: 'film', genre: ['Sci-fi'], year: 2026, rating: 4.3, ratings: 22100, views: 540000 },
  { id: 'cardinal', title: 'Cardinal Rules', creator: 'Anson Park', creatorId: 'park', kind: 'film', genre: ['Comedy'], year: 2025, rating: 4.0, ratings: 22200, views: 480000 },
  { id: 'marauder', title: 'Marauder', creator: 'Lin Hara', creatorId: 'hara', kind: 'series', genre: ['Sci-fi'], year: 2026, rating: 4.4, ratings: 12300, views: 410000 },
  { id: 'll', title: 'Last Light', creator: 'Elias Voss', creatorId: 'voss', kind: 'series', genre: ['Noir thriller'], year: 2026, rating: 4.7, ratings: 8412, views: 184000 },
];

const GEO_SHARES = [
  { region: 'United States', code: 'US', pct: 34, color: '#e5482f' },
  { region: 'Japan', code: 'JP', pct: 18, color: '#e5a93c' },
  { region: 'Germany', code: 'DE', pct: 11, color: '#6ea8fe' },
  { region: 'United Kingdom', code: 'UK', pct: 9, color: '#38b87c' },
  { region: 'Brazil', code: 'BR', pct: 8, color: '#d4cfc7' },
  { region: 'South Korea', code: 'KR', pct: 7, color: '#b07df0' },
  { region: 'Rest of World', code: 'ROW', pct: 13, color: '#64646c' },
];

const DEVICE_MIX = [
  { device: 'Mobile', share: 52 },
  { device: 'TV / Living Room', share: 28 },
  { device: 'Desktop', share: 16 },
  { device: 'Tablet', share: 4 },
];

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function calcFilmRevenue(f: StudioProjectMetric): number {
  const base = (f.views || 0) * 0.0094;
  const sub = (f.views || 0) * (f.completionRate || 0.5) * 0.006;
  return Math.round(base + sub);
}

function calcMomentum(f: StudioProjectMetric): number {
  const d = f.dailyViews || [];
  if (d.length < 6) return 0;
  const recent = d.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const prior = d.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
  if (!prior) return 0;
  return ((recent - prior) / prior) * 100;
}

function extendSeriesTo30(d: number[]): number[] {
  if (!d.length) return [];
  const head: number[] = [];
  const first = d[0] || 1000;
  for (let i = 16; i > 0; i--) {
    head.push(Math.round(first * (0.52 + (0.48 * (16 - i)) / 16) * (0.88 + (i % 3) * 0.05)));
  }
  return [...head, ...d];
}

function DarkTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string | number;
  formatter?: (name: string, val: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-[var(--c-line-2)] bg-[#111114] px-3 py-2 text-xs shadow-xl">
      <div className="mb-1.5 font-[family-name:var(--f-mono)] text-[0.66rem] uppercase tracking-[0.14em] text-[var(--c-ink-3)]">
        {label}
      </div>
      <div className="space-y-1">
        {payload.map((entry, idx) => {
          const val = Number(entry.value ?? 0);
          const name = String(entry.name ?? '');
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[var(--c-ink-2)]">
                <span
                  className="inline-block h-2 w-2"
                  style={{ backgroundColor: entry.color || '#e5482f' }}
                />
                {name}
              </span>
              <span className="font-[family-name:var(--f-mono)] font-semibold text-[var(--c-ink)] tabular-nums">
                {formatter ? formatter(name, val) : val.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DirectorAnalyticsDashboard({
  embedded = false,
  initialRange = '14d',
  initialFocusId = 'all',
  onSelectFilm,
  onClose,
}: DirectorAnalyticsProps) {
  const [range, setRange] = useState<'7d' | '14d' | '30d'>(initialRange);
  const [focusId, setFocusId] = useState<string>(initialFocusId);
  const [activeTab, setActiveTab] = useState<'popularity' | 'retention' | 'studio'>('popularity');

  const projects = useMemo<StudioProjectMetric[]>(() => {
    const raw = typeof window !== 'undefined' && Array.isArray(window.PROJECTS) && window.PROJECTS.length
      ? window.PROJECTS
      : FALLBACK_PROJECTS;
    return raw.filter((p) => p.published && Array.isArray(p.dailyViews) && p.dailyViews.length > 0);
  }, []);

  const catalog = useMemo<CatalogFilmMetric[]>(() => {
    const winCatalog =
      typeof window !== 'undefined'
        ? (window as unknown as { CATALOG?: CatalogFilmMetric[] }).CATALOG
        : undefined;
    const raw =
      Array.isArray(winCatalog) && winCatalog.length
        ? winCatalog
        : FALLBACK_CATALOG;
    return raw;
  }, []);

  const kpis = useMemo(() => {
    const studioViews = projects.reduce((acc, f) => acc + (f.views || 0), 0);
    const catalogViews = catalog.reduce((acc, f) => acc + (f.views || 0), 0);
    const filmRev = projects.reduce((acc, f) => acc + calcFilmRevenue(f), 0);
    const storeSales = Math.round(studioViews * 0.0021);
    const totalRevenue = filmRev + storeSales;
    const avgFinish = projects.length
      ? (projects.reduce((acc, f) => acc + (f.completionRate || 0), 0) / projects.length) * 100
      : 68;
    const watchHours = Math.round(
      projects.reduce((acc, f) => {
        const hrs = parseFloat(f.runtime) || 1.4;
        return acc + (f.views || 0) * (f.avgWatch || 0.75) * hrs;
      }, 0) / 60
    );
    const avgRating = catalog.length
      ? catalog.reduce((acc, f) => acc + (f.rating || 4.2), 0) / catalog.length
      : 4.5;

    return {
      studioViews,
      catalogViews,
      filmRev,
      storeSales,
      totalRevenue,
      avgFinish,
      watchHours,
      avgRating,
    };
  }, [projects, catalog]);

  // Daily popularity time-series for Recharts AreaChart
  const dailyChartData = useMemo(() => {
    const targetProjects =
      focusId === 'all' ? projects : projects.filter((p) => p.id === focusId);
    const primary = targetProjects[0] || projects[0];
    const secondary = targetProjects[1];
    if (!primary?.dailyViews) return [];

    const sliceFor = (arr: number[]) => {
      if (range === '7d') return arr.slice(-7);
      if (range === '30d') return extendSeriesTo30(arr);
      return arr;
    };

    const s1 = sliceFor(primary.dailyViews);
    const s2 = secondary?.dailyViews ? sliceFor(secondary.dailyViews) : null;
    const n = s1.length;
    const baseDate = new Date('2026-05-12T12:00:00');

    return s1.map((val, idx) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - (n - 1 - idx));
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const row: Record<string, string | number> = {
        date: label,
        [primary.title]: val,
      };
      if (secondary && s2) {
        row[secondary.title] = s2[idx] ?? 0;
        row.Combined = val + (s2[idx] ?? 0);
      }
      return row;
    });
  }, [projects, focusId, range]);

  // Top Catalog Titles Comparison (ComposedChart: Views + Rating)
  const catalogChartData = useMemo(() => {
    return [...catalog]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 8)
      .map((f) => ({
        title: f.title.length > 14 ? `${f.title.slice(0, 13)}…` : f.title,
        fullTitle: f.title,
        viewsK: Math.round((f.views || 0) / 1000),
        rating: f.rating,
        ratingsCount: f.ratings || 0,
      }));
  }, [catalog]);

  // Audience Retention Curve across runtime % (sample every 5% for clean chart points)
  const retentionData = useMemo(() => {
    const p1 = projects[0];
    const p2 = projects[1];
    const points: Array<Record<string, string | number>> = [];
    for (let i = 0; i < 100; i += 5) {
      const row: Record<string, string | number> = {
        runtime: `${i + 1}%`,
      };
      if (p1?.retention?.[i] != null) row[p1.title] = p1.retention[i];
      if (p2?.retention?.[i] != null) row[p2.title] = p2.retention[i];
      points.push(row);
    }
    return points;
  }, [projects]);

  // Revenue Streams breakdown
  const revenueStreams = useMemo(() => {
    return [
      { stream: 'Ad Revenue', amount: Math.round(kpis.filmRev * 0.42), color: '#e5482f' },
      { stream: 'Subscriptions', amount: Math.round(kpis.filmRev * 0.29), color: '#e5a93c' },
      { stream: 'Rentals & Buy', amount: Math.round(kpis.filmRev * 0.14), color: '#6ea8fe' },
      { stream: 'Site Store', amount: kpis.storeSales, color: '#38b87c' },
      { stream: 'Producer Share', amount: Math.round(kpis.filmRev * 0.08), color: '#b07df0' },
    ];
  }, [kpis]);

  // Studio leaderboard derived from catalog
  const studioPerformance = useMemo(() => {
    const map = new Map<string, { studio: string; views: number; titles: number; ratingSum: number }>();
    for (const f of catalog) {
      const key = f.creator || 'Independent';
      const existing = map.get(key) || { studio: key, views: 0, titles: 0, ratingSum: 0 };
      existing.views += f.views || 0;
      existing.titles += 1;
      existing.ratingSum += f.rating || 4.0;
      map.set(key, existing);
    }
    return [...map.values()]
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
      .map((s) => ({
        studio: s.studio.split('·')[0].trim(),
        viewsK: Math.round(s.views / 1000),
        titles: s.titles,
        avgRating: Number((s.ratingSum / s.titles).toFixed(2)),
      }));
  }, [catalog]);

  const primaryFilm = (focusId === 'all' ? projects[0] : projects.find((p) => p.id === focusId)) || projects[0];
  const secondaryFilm = focusId === 'all' ? projects[1] : undefined;

  return (
    <div
      className={`border border-[var(--c-line)] bg-[var(--c-bg)] text-[var(--c-ink)] ${
        embedded ? 'p-4 sm:p-6' : 'p-5 sm:p-7'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--c-line)] pb-4">
        <div>
          <div className="font-[family-name:var(--f-mono)] text-[0.68rem] uppercase tracking-[0.18em] text-[var(--c-amber)]">
            Director Analytics · Telemetry &amp; Studio Performance
          </div>
          <h2 className="mt-1 font-[family-name:var(--f-display)] italic text-[clamp(1.5rem,2.5vw,2.2rem)] leading-none tracking-tight text-[var(--c-ink)]">
            Film Popularity &amp; Studio Metrics
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range toggle */}
          <div className="flex border border-[var(--c-line-2)] bg-[var(--c-panel)]">
            {(['7d', '14d', '30d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 font-[family-name:var(--f-mono)] text-[0.68rem] uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                  range === r
                    ? 'bg-[var(--c-amber)] text-[#0b0806] font-semibold'
                    : 'text-[var(--c-ink-3)] hover:text-[var(--c-ink)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Film Focus Filter */}
          <select
            aria-label="Filter by studio slate"
            value={focusId}
            onChange={(e) => setFocusId(e.target.value)}
            className="h-8 border border-[var(--c-line-2)] bg-[var(--c-panel)] px-2.5 font-[family-name:var(--f-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--c-ink)] focus:border-[var(--c-amber)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Published Slates</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Director Analytics"
              className="flex h-8 w-8 items-center justify-center border border-[var(--c-line-2)] text-[var(--c-ink-3)] hover:border-[var(--c-amber)] hover:text-[var(--c-ink)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-[var(--c-line)] bg-[var(--c-panel)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--c-line)]">
        {[
          {
            label: 'Catalog Views',
            value: fmtCompact(kpis.catalogViews),
            delta: `${catalog.length} titles`,
            icon: Film,
          },
          {
            label: 'Slate Views',
            value: fmtCompact(kpis.studioViews),
            delta: '+12.4% 3d',
            icon: TrendingUp,
          },
          {
            label: 'Watch Hours',
            value: fmtCompact(kpis.watchHours),
            delta: '+8.1% wk',
            icon: Clock,
          },
          {
            label: 'Avg Finish',
            value: `${Math.round(kpis.avgFinish)}%`,
            delta: '+2.3pt',
            icon: Activity,
          },
          {
            label: 'Studio Revenue',
            value: fmtMoney(kpis.totalRevenue),
            delta: '+14.0%',
            icon: DollarSign,
          },
          {
            label: 'Avg Rating',
            value: `★ ${kpis.avgRating.toFixed(2)}`,
            delta: 'viewer score',
            icon: Star,
          },
        ].map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <div key={kpi.label} className="p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-2 font-[family-name:var(--f-mono)] text-[0.62rem] uppercase tracking-[0.16em] text-[var(--c-ink-4)]">
                <span>{kpi.label}</span>
                <IconComp className="h-3.5 w-3.5 text-[var(--c-amber)]" />
              </div>
              <div className="font-[family-name:var(--f-display)] italic text-[1.6rem] leading-none text-[var(--c-ink)] tabular-nums">
                {kpi.value}
              </div>
              <div className="font-[family-name:var(--f-mono)] text-[0.65rem] text-[var(--c-good,#38b87c)] tabular-nums">
                {kpi.delta}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section View Tabs */}
      <div className="mt-5 flex flex-wrap items-center gap-1 border-b border-[var(--c-line)]">
        {[
          { id: 'popularity', label: 'Film Popularity & Trends', icon: BarChart3 },
          { id: 'retention', label: 'Audience Retention & Geography', icon: Globe },
          { id: 'studio', label: 'Studio Revenue & Roster', icon: DollarSign },
        ].map((t) => {
          const IconComp = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'border-[var(--c-amber)] text-[var(--c-ink)]'
                  : 'border-transparent text-[var(--c-ink-3)] hover:text-[var(--c-ink)]'
              }`}
            >
              <IconComp className={`h-3.5 w-3.5 ${active ? 'text-[var(--c-amber)]' : ''}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: POPULARITY & CATALOG RANKINGS */}
      {activeTab === 'popularity' && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Daily Popularity Area Chart */}
          <div className="lg:col-span-7 border border-[var(--c-line)] bg-[var(--c-panel)] p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <div>
                <div className="font-[family-name:var(--f-mono)] text-[0.64rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]">
                  Daily Stream Velocity ({range.toUpperCase()})
                </div>
                <div className="mt-1 font-[family-name:var(--f-display)] italic text-xl text-[var(--c-ink)]">
                  {focusId === 'all' ? 'Slate Daily Views' : `${primaryFilm?.title || 'Film'} Daily Views`}
                </div>
              </div>
              <span className="font-[family-name:var(--f-mono)] text-[0.65rem] text-[var(--c-amber)] tabular-nums">
                {primaryFilm ? `${fmtCompact(primaryFilm.views || 0)} cumulative` : ''}
              </span>
            </div>

            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cinaAmberFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e5482f" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#e5482f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cinaGoldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e5a93c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e5a93c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8e8d94', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtCompact(Number(v))}
                    tick={{ fill: '#8e8d94', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <Tooltip
                    content={
                      <DarkTooltip
                        formatter={(name, val) => `${val.toLocaleString()} views`}
                      />
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                  {primaryFilm && (
                    <Area
                      type="monotone"
                      dataKey={primaryFilm.title}
                      stroke="#e5482f"
                      strokeWidth={2}
                      fill="url(#cinaAmberFill)"
                      activeDot={{ r: 4 }}
                    />
                  )}
                  {secondaryFilm && (
                    <Area
                      type="monotone"
                      dataKey={secondaryFilm.title}
                      stroke="#e5a93c"
                      strokeWidth={2}
                      fill="url(#cinaGoldFill)"
                      activeDot={{ r: 4 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Catalog Popularity vs Viewer Rating ComposedChart */}
          <div className="lg:col-span-5 border border-[var(--c-line)] bg-[var(--c-panel)] p-4 sm:p-5">
            <div className="mb-4">
              <div className="font-[family-name:var(--f-mono)] text-[0.64rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]">
                Top Catalog Films
              </div>
              <div className="mt-1 font-[family-name:var(--f-display)] italic text-xl text-[var(--c-ink)]">
                Views (K) vs. Audience Score
              </div>
            </div>

            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={catalogChartData}
                  margin={{ top: 8, right: 4, left: 0, bottom: 24 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="title"
                    angle={-25}
                    textAnchor="end"
                    height={54}
                    interval={0}
                    tick={{ fill: '#8e8d94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(v) => `${v}K`}
                    tick={{ fill: '#8e8d94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[3.5, 5]}
                    tick={{ fill: '#e5a93c', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    content={
                      <DarkTooltip
                        formatter={(name, val) =>
                          name.includes('Rating') ? `★ ${val.toFixed(1)}` : `${val.toLocaleString()}K views`
                        }
                      />
                    }
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="viewsK"
                    name="Views (K)"
                    fill="#e5482f"
                    radius={[2, 2, 0, 0]}
                    barSize={20}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rating"
                    name="Rating ★"
                    stroke="#e5a93c"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#e5a93c' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIENCE RETENTION & GEOGRAPHY */}
      {activeTab === 'retention' && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 border border-[var(--c-line)] bg-[var(--c-panel)] p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <div>
                <div className="font-[family-name:var(--f-mono)] text-[0.64rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]">
                  Runtime Retention Curve (0% → 100%)
                </div>
                <div className="mt-1 font-[family-name:var(--f-display)] italic text-xl text-[var(--c-ink)]">
                  Audience Hold Through Act III
                </div>
              </div>
              <span className="font-[family-name:var(--f-mono)] text-[0.65rem] text-[var(--c-ink-3)]">
                Act-III inflection at 74% runtime
              </span>
            </div>

            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={retentionData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cinaRet1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6ea8fe" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#6ea8fe" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cinaRet2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38b87c" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#38b87c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="runtime"
                    tick={{ fill: '#8e8d94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[20, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: '#8e8d94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={<DarkTooltip formatter={(_n, val) => `${val}% still watching`} />}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                  {projects[0] && (
                    <Area
                      type="monotone"
                      dataKey={projects[0].title}
                      stroke="#6ea8fe"
                      strokeWidth={2}
                      fill="url(#cinaRet1)"
                    />
                  )}
                  {projects[1] && (
                    <Area
                      type="monotone"
                      dataKey={projects[1].title}
                      stroke="#38b87c"
                      strokeWidth={2}
                      fill="url(#cinaRet2)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 border border-[var(--c-line)] bg-[var(--c-panel)] p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="font-[family-name:var(--f-mono)] text-[0.64rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]">
                Territory &amp; Playback Distribution
              </div>
              <div className="mt-1 font-[family-name:var(--f-display)] italic text-xl text-[var(--c-ink)]">
                Global Audience Share
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center my-2">
              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={GEO_SHARES}
                      dataKey="pct"
                      nameKey="region"
                      innerRadius={44}
                      outerRadius={76}
                      paddingAngle={2}
                    >
                      {GEO_SHARES.map((g) => (
                        <Cell key={g.code} fill={g.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip formatter={(_n, val) => `${val}% share`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {GEO_SHARES.map((g) => (
                  <div key={g.code} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[var(--c-ink-2)] truncate">
                      <span className="h-2 w-2 shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="truncate">{g.region}</span>
                    </span>
                    <span className="font-[family-name:var(--f-mono)] text-[var(--c-ink)] tabular-nums">
                      {g.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--c-line)] pt-3 grid grid-cols-4 gap-2">
              {DEVICE_MIX.map((d) => (
                <div key={d.device}>
                  <div className="font-[family-name:var(--f-mono)] text-[0.6rem] uppercase tracking-[0.1em] text-[var(--c-ink-4)] truncate">
                    {d.device}
                  </div>
                  <div className="font-[family-name:var(--f-mono)] text-xs font-semibold text-[var(--c-ink)] tabular-nums">
                    {d.share}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDIO REVENUE & ROSTER */}
      {activeTab === 'studio' && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 border border-[var(--c-line)] bg-[var(--c-panel)] p-4 sm:p-5">
            <div className="mb-4">
              <div className="font-[family-name:var(--f-mono)] text-[0.64rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]">
                Studio Revenue Channels
              </div>
              <div className="mt-1 font-[family-name:var(--f-display)] italic text-xl text-[var(--c-ink)]">
                Monetization Breakdown ({fmtMoney(kpis.totalRevenue)})
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueStreams} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="stream"
                    tick={{ fill: '#8e8d94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtMoney(Number(v))}
                    tick={{ fill: '#8e8d94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                  />
                  <Tooltip content={<DarkTooltip formatter={(_n, val) => fmtMoney(val)} />} />
                  <Bar dataKey="amount" name="Revenue" radius={[2, 2, 0, 0]} barSize={32}>
                    {revenueStreams.map((entry) => (
                      <Cell key={entry.stream} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-6 border border-[var(--c-line)] bg-[var(--c-panel)] p-4 sm:p-5">
            <div className="mb-4">
              <div className="font-[family-name:var(--f-mono)] text-[0.64rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]">
                Studio House Rankings
              </div>
              <div className="mt-1 font-[family-name:var(--f-display)] italic text-xl text-[var(--c-ink)]">
                Views (K) &amp; Average Rating by Creator
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={studioPerformance}
                  margin={{ top: 8, right: 8, left: 0, bottom: 16 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="studio"
                    tick={{ fill: '#8e8d94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(v) => `${v}K`}
                    tick={{ fill: '#8e8d94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[3.5, 5]}
                    tick={{ fill: '#38b87c', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    content={
                      <DarkTooltip
                        formatter={(name, val) =>
                          name.includes('Rating') ? `★ ${val.toFixed(2)}` : `${val.toLocaleString()}K views`
                        }
                      />
                    }
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="viewsK"
                    name="Catalog Views (K)"
                    fill="#6ea8fe"
                    radius={[2, 2, 0, 0]}
                    barSize={26}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgRating"
                    name="Avg Rating ★"
                    stroke="#38b87c"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#38b87c' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Slate Comparison Ledger Table */}
      <div className="mt-5 border border-[var(--c-line)] bg-[var(--c-panel)] overflow-x-auto">
        <div className="flex items-center justify-between border-b border-[var(--c-line)] px-4 py-3">
          <span className="font-[family-name:var(--f-mono)] text-[0.68rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]">
            Published Studio Slates · Performance Ledger
          </span>
          <span className="font-[family-name:var(--f-mono)] text-[0.65rem] text-[var(--c-ink-4)]">
            Click a slate to inspect · Search real-time comparable reception
          </span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--c-line)] bg-[var(--c-bg)] font-[family-name:var(--f-mono)] text-[0.62rem] uppercase tracking-[0.14em] text-[var(--c-ink-4)]">
              <th className="py-2.5 px-4">Title</th>
              <th className="py-2.5 px-3">Genre</th>
              <th className="py-2.5 px-3 text-right">Views</th>
              <th className="py-2.5 px-3 text-right">Finish Rate</th>
              <th className="py-2.5 px-3 text-right">3d Momentum</th>
              <th className="py-2.5 px-3 text-right">Est. Revenue</th>
              <th className="py-2.5 px-4 text-right">Research</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-line)]">
            {projects.map((p) => {
              const mom = calcMomentum(p);
              const isSelected = focusId === p.id;
              return (
                <tr
                  key={p.id}
                  onClick={() => {
                    setFocusId(isSelected ? 'all' : p.id);
                    onSelectFilm?.(p.id);
                  }}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-[rgba(var(--accent-rgb),0.08)]' : 'hover:bg-[rgba(255,255,255,0.03)]'
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-[var(--c-ink)]">
                    <span className="font-[family-name:var(--f-display)] italic text-sm">{p.title}</span>
                    <span className="ml-2 font-[family-name:var(--f-mono)] text-[0.64rem] text-[var(--c-ink-4)]">
                      {p.code}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[var(--c-ink-3)]">{p.genre}</td>
                  <td className="py-3 px-3 text-right font-[family-name:var(--f-mono)] tabular-nums">
                    {fmtCompact(p.views || 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-[family-name:var(--f-mono)] tabular-nums">
                    {Math.round((p.completionRate || 0) * 100)}%
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-[family-name:var(--f-mono)] tabular-nums ${
                      mom >= 0 ? 'text-[#38b87c]' : 'text-[#e56b55]'
                    }`}
                  >
                    {mom >= 0 ? '+' : ''}
                    {Math.round(mom)}%
                  </td>
                  <td className="py-3 px-3 text-right font-[family-name:var(--f-mono)] text-[var(--c-amber)] tabular-nums">
                    {fmtMoney(calcFilmRevenue(p))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.openCinemaSearch?.(
                          `${p.genre} independent cinema comparable box office and critical reception trends`,
                          'reviews',
                          true,
                          p.title
                        );
                      }}
                      className="border border-[var(--c-line-2)] px-2.5 py-1 font-[family-name:var(--f-mono)] text-[0.62rem] uppercase tracking-[0.12em] text-[var(--c-ink-2)] hover:border-[var(--c-amber)] hover:text-[var(--c-ink)] cursor-pointer whitespace-nowrap"
                    >
                      Ground Comps →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DirectorAnalyticsModal() {
  const [open, setOpen] = useState(false);
  const [focusId, setFocusId] = useState<string>('all');

  useEffect(() => {
    window.openDirectorAnalytics = (filmId = 'all') => {
      setFocusId(filmId || 'all');
      setOpen(true);
    };
    window.closeDirectorAnalytics = () => setOpen(false);
    return () => {
      delete window.openDirectorAnalytics;
      delete window.closeDirectorAnalytics;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/82 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Director Analytics Dashboard"
        className="w-full max-w-6xl my-auto shadow-2xl"
      >
        <DirectorAnalyticsDashboard
          initialFocusId={focusId}
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
}

const mountedDashboards = new Map<HTMLElement, Root>();

export function registerDirectorAnalyticsMount() {
  window.mountDirectorAnalytics = (container, props = {}) => {
    if (!container) return;
    let root = mountedDashboards.get(container);
    if (!root) {
      root = createRoot(container);
      mountedDashboards.set(container, root);
    }
    root.render(<DirectorAnalyticsDashboard {...props} />);
    return () => {
      const existing = mountedDashboards.get(container);
      if (existing) {
        mountedDashboards.delete(container);
        setTimeout(() => existing.unmount(), 0);
      }
    };
  };
}
