import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  BookOpen,
  ExternalLink,
  Film,
  Globe,
  Newspaper,
  Search,
  Star,
  X,
} from 'lucide-react';
import { authFetch } from '../lib/firebase';

export type CinemaSearchCategory = 'all' | 'news' | 'reviews' | 'film_data';

export interface GroundedSource {
  title: string;
  uri: string;
}

export interface CinemaSearchResult {
  summary: string;
  sources: GroundedSource[];
  searchQueries: string[];
  category: CinemaSearchCategory;
  model: string;
}

declare global {
  interface Window {
    openCinemaSearch?: (
      query?: string,
      category?: CinemaSearchCategory,
      autoRun?: boolean,
      filmTitle?: string
    ) => void;
    closeCinemaSearch?: () => void;
    mountCinemaSearchPanel?: (
      container: HTMLElement | null,
      props?: CinemaSearchPanelProps
    ) => (() => void) | void;
  }
}

export interface CinemaSearchPanelProps {
  initialQuery?: string;
  initialCategory?: CinemaSearchCategory;
  filmTitle?: string;
  autoRun?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

const CATEGORIES: Array<{
  id: CinemaSearchCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}> = [
  {
    id: 'all',
    label: 'All Cinema',
    icon: Globe,
    placeholder: 'Search real-time cinema news, film reviews, box office, festival winners…',
  },
  {
    id: 'news',
    label: 'News & Festivals',
    icon: Newspaper,
    placeholder: 'e.g. Cannes 2026 Palme d’Or lineup, Sundance acquisitions, A24 release dates…',
  },
  {
    id: 'reviews',
    label: 'Reviews & Reception',
    icon: Star,
    placeholder: 'e.g. Critical consensus and reviews for Sinners, Anora, or Dune: Part Two…',
  },
  {
    id: 'film_data',
    label: 'Film & Box Office Data',
    icon: Film,
    placeholder: 'e.g. Cast, cinematographer, runtime, and global box office for The Brutalist…',
  },
];

const QUICK_PRESETS: Array<{
  label: string;
  query: string;
  category: CinemaSearchCategory;
}> = [
  {
    label: 'Festival & Indie Film News',
    query: 'Latest independent cinema festival winners, Cannes and Venice highlights, and theatrical distribution news',
    category: 'news',
  },
  {
    label: 'Recent Acclaimed Film Reviews',
    query: 'Critical consensus and top film critic reviews for recent acclaimed independent and arthouse cinema releases',
    category: 'reviews',
  },
  {
    label: 'Box Office & Theatrical Slate',
    query: 'Current specialty and independent cinema box office performance and upcoming A24 / Neon release dates',
    category: 'film_data',
  },
  {
    label: 'Cinematography & Craft Trends',
    query: 'Notable 35mm, 65mm, and anamorphic cinematography releases and director interviews this season',
    category: 'all',
  },
];

function formatHost(uri: string): string {
  try {
    return new URL(uri).hostname.replace(/^www\./, '');
  } catch {
    return uri;
  }
}

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={keyPrefix} className="space-y-1.5 pl-4 my-2.5 list-disc marker:text-[var(--c-amber)]">
        {listItems.map((item, idx) => (
          <li key={idx} className="text-[0.88rem] leading-relaxed text-[var(--c-ink-2)]">
            {renderInlineEmphasis(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(`list-${idx}`);
      return;
    }

    if (/^#{1,4}\s+/.test(line)) {
      flushList(`list-${idx}`);
      const heading = line.replace(/^#{1,4}\s+/, '');
      blocks.push(
        <h4
          key={`h-${idx}`}
          className="mt-4 mb-1.5 font-[family-name:var(--f-display)] italic text-[1.12rem] text-[var(--c-ink)] tracking-tight"
        >
          {renderInlineEmphasis(heading)}
        </h4>
      );
      return;
    }

    if (/^[-*•]\s+/.test(line)) {
      listItems.push(line.replace(/^[-*•]\s+/, ''));
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s+/, ''));
      return;
    }

    flushList(`list-${idx}`);
    blocks.push(
      <p key={`p-${idx}`} className="my-2 text-[0.9rem] leading-relaxed text-[var(--c-ink-2)]">
        {renderInlineEmphasis(line)}
      </p>
    );
  });

  flushList('list-end');
  return blocks;
}

function renderInlineEmphasis(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[var(--c-ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function CinemaSearchPanel({
  initialQuery = '',
  initialCategory = 'all',
  filmTitle = '',
  autoRun = false,
  compact = false,
  onClose,
}: CinemaSearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CinemaSearchCategory>(initialCategory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CinemaSearchResult | null>(null);
  const lastAutoRunRef = useRef<string>('');

  const runSearch = useCallback(
    async (overrideQuery?: string, overrideCategory?: CinemaSearchCategory) => {
      const targetQuery = (overrideQuery ?? query).trim();
      const targetCategory = overrideCategory ?? category;
      if (!targetQuery) {
        setError('Enter a film title, critic review query, or cinema news topic.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/ai/ground/search', {
          method: 'POST',
          body: JSON.stringify({
            query: targetQuery,
            category: targetCategory,
            filmTitle: filmTitle || undefined,
            persist: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to reach live cinema search grounding.');
        }
        setResult({
          summary: data.summary || '',
          sources: Array.isArray(data.sources) ? data.sources : [],
          searchQueries: Array.isArray(data.searchQueries) ? data.searchQueries : [],
          category: data.category || targetCategory,
          model: data.model || 'gemini-4-hydrogen',
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Live search lookup failed.');
      } finally {
        setLoading(false);
      }
    },
    [query, category, filmTitle]
  );

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    const key = `${initialQuery}::${initialCategory}::${autoRun}`;
    if (autoRun && initialQuery.trim() && lastAutoRunRef.current !== key) {
      lastAutoRunRef.current = key;
      void runSearch(initialQuery, initialCategory);
    }
  }, [autoRun, initialQuery, initialCategory, runSearch]);

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  return (
    <div
      className={`border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-ink)] ${
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--c-line)] pb-4">
        <div>
          <div className="font-[family-name:var(--f-mono)] text-[0.68rem] tracking-[0.18em] uppercase text-[var(--c-amber)]">
            Live Web Grounding · Real-Time Cinema Desk
          </div>
          <h3 className="mt-1 font-[family-name:var(--f-display)] italic text-[clamp(1.3rem,2.1vw,1.85rem)] leading-tight text-[var(--c-ink)]">
            {filmTitle ? `Cinema Intelligence · ${filmTitle}` : 'Cinema News, Reviews & Film Data'}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--f-mono)] text-[0.65rem] tracking-[0.14em] uppercase text-[var(--c-ink-4)]">
            Google Search Grounded
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close live cinema search"
              className="flex h-8 w-8 items-center justify-center border border-[var(--c-line-2)] text-[var(--c-ink-3)] hover:border-[var(--c-amber)] hover:text-[var(--c-ink)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Switcher — zero-radius hairline tabs */}
      <div className="mt-3 flex flex-wrap items-center gap-1 border-b border-[var(--c-line)]">
        {CATEGORIES.map((cat) => {
          const IconComp = cat.icon;
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'border-[var(--c-amber)] text-[var(--c-ink)]'
                  : 'border-transparent text-[var(--c-ink-3)] hover:text-[var(--c-ink)]'
              }`}
            >
              <IconComp className={`h-3.5 w-3.5 ${active ? 'text-[var(--c-amber)]' : ''}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
        className="mt-4 flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--c-ink-4)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeCategoryMeta.placeholder}
            className="h-10 w-full border border-[var(--c-line-2)] bg-[var(--c-bg)] pl-9 pr-3 text-sm text-[var(--c-ink)] placeholder:text-[var(--c-ink-4)] focus:border-[var(--c-amber)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 bg-[var(--c-amber)] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#0b0806] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer whitespace-nowrap"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{loading ? 'Searching Live Web…' : 'Lookup Live Data'}</span>
        </button>
      </form>

      {/* Preset Chips (zero-radius hairline links) */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-[family-name:var(--f-mono)] text-[0.64rem] uppercase tracking-[0.14em] text-[var(--c-ink-4)]">
          Quick Desks:
        </span>
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={loading}
            onClick={() => {
              setQuery(preset.query);
              setCategory(preset.category);
              void runSearch(preset.query, preset.category);
            }}
            className="border border-[var(--c-line)] bg-[var(--c-panel-2)] px-2.5 py-1 text-[0.72rem] text-[var(--c-ink-2)] hover:border-[var(--c-amber)] hover:text-[var(--c-ink)] transition-colors cursor-pointer whitespace-nowrap"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Status / Results */}
      {error && (
        <div className="mt-4 border border-red-500/40 bg-red-950/30 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-5 border border-[var(--c-line)] bg-[var(--c-bg)] p-6 space-y-3">
          <div className="font-[family-name:var(--f-mono)] text-[0.68rem] uppercase tracking-[0.16em] text-[var(--c-amber)]">
            Querying real-time cinema index…
          </div>
          <div className="h-3 w-3/4 bg-[var(--c-panel-2)]" />
          <div className="h-3 w-full bg-[var(--c-panel-2)]" />
          <div className="h-3 w-5/6 bg-[var(--c-panel-2)]" />
        </div>
      )}

      {!loading && result && (
        <div className="mt-5 space-y-5 border-t border-[var(--c-line)] pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-[family-name:var(--f-mono)] text-[0.68rem] uppercase tracking-[0.16em] text-[var(--c-amber)]">
              Grounded Briefing · {CATEGORIES.find((c) => c.id === result.category)?.label || 'All Cinema'}
            </span>
            <span className="font-[family-name:var(--f-mono)] text-[0.66rem] text-[var(--c-ink-4)] tabular-nums">
              {result.sources.length} verified {result.sources.length === 1 ? 'source' : 'sources'}
            </span>
          </div>

          <div className="border border-[var(--c-line)] bg-[var(--c-bg)] p-5">
            {result.summary ? (
              renderFormattedText(result.summary)
            ) : (
              <p className="text-xs text-[var(--c-ink-3)]">No editorial synthesis returned for this query.</p>
            )}
          </div>

          {result.searchQueries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[0.7rem]">
              <span className="font-[family-name:var(--f-mono)] text-[0.64rem] uppercase tracking-[0.14em] text-[var(--c-ink-4)]">
                Queries Executed:
              </span>
              {result.searchQueries.map((sq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(sq);
                    void runSearch(sq, category);
                  }}
                  className="border border-[var(--c-line)] bg-[var(--c-bg)] px-2 py-0.5 font-[family-name:var(--f-mono)] text-[0.68rem] text-[var(--c-ink-3)] hover:border-[var(--c-amber)] hover:text-[var(--c-ink)] cursor-pointer"
                >
                  {sq}
                </button>
              ))}
            </div>
          )}

          {result.sources.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-[family-name:var(--f-mono)] text-[0.68rem] uppercase tracking-[0.16em] text-[var(--c-ink-3)]">
                <BookOpen className="h-3.5 w-3.5 text-[var(--c-amber)]" />
                <span>Grounded Sources ({result.sources.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {result.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between gap-3 border border-[var(--c-line)] bg-[var(--c-bg)] p-3 hover:border-[var(--c-amber)] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--c-ink)] group-hover:text-[var(--c-amber)] transition-colors truncate">
                        {String(idx + 1).padStart(2, '0')} · {src.title}
                      </div>
                      <div className="mt-0.5 font-[family-name:var(--f-mono)] text-[0.65rem] text-[var(--c-ink-4)] truncate">
                        {formatHost(src.uri)}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--c-ink-4)] group-hover:text-[var(--c-amber)]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !result && !error && (
        <div className="mt-4 border border-[var(--c-line)] bg-[var(--c-bg)] px-5 py-6 text-xs text-[var(--c-ink-3)] flex flex-wrap items-center justify-between gap-4">
          <span>
            Look up real-time film reviews, festival coverage, cast &amp; crew credits, and box-office data grounded in Google Search.
          </span>
          <button
            type="button"
            onClick={() => {
              const sample = QUICK_PRESETS[0];
              setQuery(sample.query);
              setCategory(sample.category);
              void runSearch(sample.query, sample.category);
            }}
            className="font-[family-name:var(--f-mono)] text-[0.68rem] uppercase tracking-[0.14em] text-[var(--c-amber)] hover:underline cursor-pointer"
          >
            Run Sample Dispatch →
          </button>
        </div>
      )}
    </div>
  );
}

export function CinemaSearchModal() {
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [initialCategory, setInitialCategory] = useState<CinemaSearchCategory>('all');
  const [filmTitle, setFilmTitle] = useState('');
  const [autoRun, setAutoRun] = useState(false);

  useEffect(() => {
    window.openCinemaSearch = (
      query = '',
      category: CinemaSearchCategory = 'all',
      shouldAutoRun = false,
      title = ''
    ) => {
      setInitialQuery(query);
      setInitialCategory(category);
      setFilmTitle(title);
      setAutoRun(shouldAutoRun);
      setOpen(true);
    };
    window.closeCinemaSearch = () => setOpen(false);
    return () => {
      delete window.openCinemaSearch;
      delete window.closeCinemaSearch;
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
      className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Live Cinema Search Grounding"
        className="w-full max-w-4xl my-auto shadow-2xl"
      >
        <CinemaSearchPanel
          initialQuery={initialQuery}
          initialCategory={initialCategory}
          filmTitle={filmTitle}
          autoRun={autoRun}
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
}

const mountedPanels = new Map<HTMLElement, Root>();

export function registerCinemaSearchMount() {
  window.mountCinemaSearchPanel = (container, props = {}) => {
    if (!container) return;
    let root = mountedPanels.get(container);
    if (!root) {
      root = createRoot(container);
      mountedPanels.set(container, root);
    }
    root.render(<CinemaSearchPanel {...props} />);
    return () => {
      const existing = mountedPanels.get(container);
      if (existing) {
        mountedPanels.delete(container);
        setTimeout(() => existing.unmount(), 0);
      }
    };
  };
}
