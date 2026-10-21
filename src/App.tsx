import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Server,
  Globe,
  Terminal,
  ExternalLink,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Code2,
  Bookmark,
  Compass,
  ArrowLeft,
  X,
  Sliders,
  Type,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface SourceMetadata {
  id: string;
  name: string;
  site: string;
  version: string;
  icon?: string;
  description?: string;
  type: string;
  languages: string[];
  features: {
    popular: boolean;
    search: boolean;
    novelDetails: boolean;
    chapters: boolean;
    reader: boolean;
    filters?: boolean;
  };
  cloudProtected: boolean;
  notes?: string;
}

interface NovelItem {
  id?: string;
  name: string;
  path: string;
  cover?: string;
  sourceId?: string;
  sourceName?: string;
}

interface ChapterItem {
  name: string;
  path: string;
  releaseTime?: string | null;
  chapterNumber?: number;
}

interface SourceNovel extends NovelItem {
  genres?: string;
  summary?: string;
  author?: string;
  artist?: string;
  status?: string;
  rating?: number;
  chapters?: ChapterItem[];
}

export default function App() {
  const [sources, setSources] = useState<SourceMetadata[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'explorer' | 'docs' | 'cross-search'>('sources');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loadingSources, setLoadingSources] = useState(true);

  // Novel & Explorer State
  const [novels, setNovels] = useState<NovelItem[]>([]);
  const [loadingNovels, setLoadingNovels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalQuery, setGlobalQuery] = useState('Cultivation');
  const [globalResults, setGlobalResults] = useState<NovelItem[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  // Selected Novel Modal
  const [selectedNovel, setSelectedNovel] = useState<SourceNovel | null>(null);
  const [loadingNovelDetails, setLoadingNovelDetails] = useState(false);

  // Reader Modal
  const [activeChapter, setActiveChapter] = useState<{ title: string; path: string; sourceId: string } | null>(null);
  const [chapterContent, setChapterContent] = useState<string>('');
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState<number>(18);

  // API Playground State
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/sources');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Fetch all registered sources
  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      if (data.sources) {
        setSources(data.sources);
        if (!selectedSource && data.sources.length > 0) {
          setSelectedSource(data.sources[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load sources', err);
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // Fetch popular novels for a source
  const loadPopularNovels = async (source: SourceMetadata, page: number = 1) => {
    setSelectedSource(source);
    setActiveTab('explorer');
    setLoadingNovels(true);
    setSearchQuery('');
    try {
      const res = await fetch(`/api/sources/${source.id}/popular?page=${page}`);
      const data = await res.json();
      setNovels(data.novels || []);
    } catch (err) {
      console.error(err);
      setNovels([]);
    } finally {
      setLoadingNovels(false);
    }
  };

  // Search within selected source
  const handleSourceSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSource || !searchQuery.trim()) return;

    setLoadingNovels(true);
    try {
      const res = await fetch(`/api/sources/${selectedSource.id}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setNovels(data.novels || []);
    } catch (err) {
      console.error(err);
      setNovels([]);
    } finally {
      setLoadingNovels(false);
    }
  };

  // Global Cross-Source Search
  const handleGlobalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!globalQuery.trim()) return;

    setLoadingGlobal(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(globalQuery)}&limit=6`);
      const data = await res.json();
      setGlobalResults(data.results || []);
    } catch (err) {
      console.error(err);
      setGlobalResults([]);
    } finally {
      setLoadingGlobal(false);
    }
  };

  // Open Novel Details
  const openNovelDetails = async (novel: NovelItem, sourceId?: string) => {
    const sId = sourceId || novel.sourceId || selectedSource?.id;
    if (!sId) return;

    setLoadingNovelDetails(true);
    setSelectedNovel(null);
    try {
      const res = await fetch(`/api/sources/${sId}/novel?path=${encodeURIComponent(novel.path)}`);
      const data = await res.json();
      if (data.novel) {
        setSelectedNovel({ ...data.novel, sourceId: sId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNovelDetails(false);
    }
  };

  // Open Chapter Reader
  const openChapterReader = async (chapter: ChapterItem, sourceId: string) => {
    setActiveChapter({ title: chapter.name, path: chapter.path, sourceId });
    setLoadingChapter(true);
    setChapterContent('');
    try {
      const res = await fetch(`/api/sources/${sourceId}/chapter?path=${encodeURIComponent(chapter.path)}`);
      const data = await res.json();
      setChapterContent(data.content || '<p class="text-gray-400">No content found.</p>');
    } catch (err: any) {
      setChapterContent(`<div class="p-6 text-rose-400 bg-rose-950/30 rounded border border-rose-800/40">Error fetching chapter: ${err.message || 'Unknown error'}</div>`);
    } finally {
      setLoadingChapter(false);
    }
  };

  // Test API endpoint
  const testApi = async (endpoint: string) => {
    setApiEndpoint(endpoint);
    setLoadingApi(true);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoadingApi(false);
    }
  };

  const filteredSources = sources.filter((s) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'direct') return !s.cloudProtected;
    if (categoryFilter === 'cloud') return s.cloudProtected;
    return s.type === categoryFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  NovelStream
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Backend Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Unified Web Novel & Light Novel Scraper Provider API
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'sources'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Sources ({sources.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('explorer');
                if (novels.length === 0 && selectedSource) {
                  loadPopularNovels(selectedSource);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'explorer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Explorer
            </button>
            <button
              onClick={() => {
                setActiveTab('cross-search');
                if (globalResults.length === 0) handleGlobalSearch();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'cross-search'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Cross-Search
            </button>
            <button
              onClick={() => {
                setActiveTab('docs');
                if (!apiResponse) testApi('/api/sources');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'docs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              REST API
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: SOURCES DIRECTORY */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20">
                <div className="flex items-center justify-between text-indigo-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Connected Modules</span>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold">{sources.length} Mega Sources</div>
                <p className="text-xs text-slate-400 mt-1">Ready for unified querying & scraping</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Direct Fast API</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold">
                  {sources.filter((s) => !s.cloudProtected).length} Direct Providers
                </div>
                <p className="text-xs text-slate-400 mt-1">CoteReader, Wuxiaworld, Baka-Tsuki, DDL, Inkitt</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Aggregator CMS</span>
                  <Server className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold">ReadNovelFull & Madara</div>
                <p className="text-xs text-slate-400 mt-1">NovelFull, NovelBin, BoxNovel, DaoNovel</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20">
                <div className="flex items-center justify-between text-purple-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Server Status</span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-2xl font-bold text-emerald-400">Online 200 OK</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Port 3000 • Vite & Express mounted</p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'All Sources', value: 'all' },
                  { label: 'Direct Fast API', value: 'direct' },
                  { label: 'Mega Aggregators', value: 'mega-aggregator' },
                  { label: 'Original Platforms', value: 'original-platform' },
                  { label: 'Official / Translations', value: 'translation-group' },
                  { label: 'MTL Engines', value: 'mtl' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setCategoryFilter(f.value)}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                      categoryFilter === f.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400">
                Showing {filteredSources.length} of {sources.length} sources
              </span>
            </div>

            {/* Sources Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="group p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                          {source.name}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                            v{source.version}
                          </span>
                        </h3>
                        <a
                          href={source.site}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5"
                        >
                          {source.site.replace('https://', '').replace('www.', '')}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      {source.cloudProtected ? (
                        <span
                          title="Cloudflare protected aggregator"
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          Cloudflare
                        </span>
                      ) : (
                        <span
                          title="Direct high-speed API or unblocked"
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Direct Fast
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {source.description || 'Web Novel & Light Novel content provider module.'}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {source.features.popular && (
                        <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300">
                          Popular
                        </span>
                      )}
                      {source.features.search && (
                        <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300">
                          Search
                        </span>
                      )}
                      {source.features.novelDetails && (
                        <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300">
                          Metadata
                        </span>
                      )}
                      {source.features.chapters && (
                        <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300">
                          Chapters
                        </span>
                      )}
                      {source.features.reader && (
                        <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300">
                          Reader
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => loadPopularNovels(source)}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Compass className="w-3 h-3" />
                      Browse Novels
                    </button>
                    <button
                      onClick={() => testApi(`/api/sources/${source.id}`)}
                      className="p-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Inspect API"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EXPLORER & NOVEL BROWSER */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            {/* Top Source Header & Search */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">{selectedSource?.name || 'Novel Explorer'}</h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      ID: {selectedSource?.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedSource?.site}</p>
                </div>
              </div>

              {/* Source Switcher & Local Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedSource?.id || ''}
                  onChange={(e) => {
                    const src = sources.find((s) => s.id === e.target.value);
                    if (src) loadPopularNovels(src);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {!s.cloudProtected ? '⚡ (Fast)' : ''}
                    </option>
                  ))}
                </select>

                <form onSubmit={handleSourceSearch} className="flex items-center gap-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search in ${selectedSource?.name || 'source'}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedSource && loadPopularNovels(selectedSource)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Reload Popular"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Novels Grid */}
            {loadingNovels ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-slate-400">Scraping novel list from {selectedSource?.name}...</p>
              </div>
            ) : novels.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="font-medium text-slate-300">No novels returned</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  This source might require specific search keywords or might be protected by Cloudflare. Try
                  another source like CoteReader, Wuxiaworld, Baka-Tsuki, or Divine Dao Library!
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      const cote = sources.find((s) => s.id === 'cotereader');
                      if (cote) loadPopularNovels(cote);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    Load CoteReader (1,000+ LNs)
                  </button>
                  <button
                    onClick={() => {
                      const wx = sources.find((s) => s.id === 'wuxiaworld');
                      if (wx) loadPopularNovels(wx);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
                  >
                    Load Wuxiaworld
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {novels.map((novel, idx) => (
                  <div
                    key={`${novel.path}-${idx}`}
                    onClick={() => openNovelDetails(novel)}
                    className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 flex flex-col hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                  >
                    <div className="aspect-[3/4] w-full bg-slate-800 relative overflow-hidden">
                      {novel.cover ? (
                        <img
                          src={novel.cover}
                          alt={novel.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <BookOpen className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                        {novel.name}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate">{selectedSource?.name}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GLOBAL CROSS-SEARCH */}
        {activeTab === 'cross-search' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Federated Cross-Provider Search
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Search Across All Connected Sources Simultaneously</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Enter any light novel, web novel, or keyword. The engine executes queries in parallel across multiple
                high-speed scrapers and merges results with uniform metadata.
              </p>

              <form onSubmit={handleGlobalSearch} className="flex gap-2 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    placeholder="Try 'Martial', 'Classroom', 'Reincarnation', 'Solo', 'Cultivation'..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingGlobal}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {loadingGlobal ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>Quick suggestions:</span>
                {['Lord of the Mysteries', 'Classroom of the Elite', 'Re:Zero', 'Martial Peak', 'Overlord'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setGlobalQuery(q);
                      setLoadingGlobal(true);
                      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
                        .then((r) => r.json())
                        .then((d) => setGlobalResults(d.results || []))
                        .finally(() => setLoadingGlobal(false));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 hover:text-indigo-200 border border-slate-700/60 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {loadingGlobal ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-slate-400">Querying providers simultaneously...</p>
              </div>
            ) : globalResults.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
                <p className="text-slate-400 text-sm">No results found. Try a different search term.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-200">
                    Search Results ({globalResults.length} novels found)
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {globalResults.map((novel, idx) => (
                    <div
                      key={`global-${novel.path}-${idx}`}
                      onClick={() => openNovelDetails(novel, novel.sourceId)}
                      className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 flex flex-col hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                    >
                      <div className="aspect-[3/4] w-full bg-slate-800 relative overflow-hidden">
                        {novel.cover ? (
                          <img
                            src={novel.cover}
                            alt={novel.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <BookOpen className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/20">
                          {novel.sourceName || novel.sourceId}
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                          {novel.name}
                        </h4>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate text-indigo-400/80">{novel.sourceName}</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REST API PLAYGROUND & DOCUMENTATION */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    REST API Documentation & Interactive Console
                  </h2>
                  <p className="text-xs text-slate-400">
                    Use these endpoints in your mobile app, frontend client, or external service.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`curl -X GET "${window.location.origin}${apiEndpoint}"`);
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCurl ? 'Copied cURL!' : 'Copy cURL'}
                  </button>
                </div>
              </div>

              {/* Endpoint Preset Selector */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                {[
                  { label: 'GET /api/sources', path: '/api/sources' },
                  { label: 'GET /api/sources/cotereader/popular', path: '/api/sources/cotereader/popular' },
                  { label: 'GET /api/sources/wuxiaworld/popular', path: '/api/sources/wuxiaworld/popular' },
                  { label: 'GET /api/sources/bakatsuki/popular', path: '/api/sources/bakatsuki/popular' },
                  { label: 'GET /api/sources/cotereader/novel?path=lotm', path: '/api/sources/cotereader/novel?path=lotm' },
                  { label: 'GET /api/search?q=Cultivation', path: '/api/search?q=Cultivation' },
                  { label: 'GET /api/health', path: '/api/health' },
                ].map((ep) => (
                  <button
                    key={ep.path}
                    onClick={() => testApi(ep.path)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                      apiEndpoint === ep.path
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {ep.label}
                  </button>
                ))}
              </div>
            </div>

            {/* API Console Box */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Endpoint Request Bar */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Target Endpoint
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => testApi(apiEndpoint)}
                      disabled={loadingApi}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {loadingApi ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Terminal className="w-3.5 h-3.5" />
                      )}
                      Send Request
                    </button>
                  </div>
                </div>

                {/* API Specs Documentation Table */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Complete Specification
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-mono text-emerald-400 font-semibold">GET /api/sources</div>
                      <p className="text-slate-400 mt-0.5">Returns array of all registered sources with metadata.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-mono text-indigo-400 font-semibold">
                        GET /api/sources/:sourceId/popular?page=1
                      </div>
                      <p className="text-slate-400 mt-0.5">Scrapes latest/popular novels from the specified provider.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-mono text-amber-400 font-semibold">
                        GET /api/sources/:sourceId/search?q=query&page=1
                      </div>
                      <p className="text-slate-400 mt-0.5">Queries novels within the selected source.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-mono text-purple-400 font-semibold">
                        GET /api/sources/:sourceId/novel?path=novelSlug
                      </div>
                      <p className="text-slate-400 mt-0.5">
                        Fetches title, author, cover, synopsis, and full chapter list.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-mono text-pink-400 font-semibold">
                        GET /api/sources/:sourceId/chapter?path=chapterSlug
                      </div>
                      <p className="text-slate-400 mt-0.5">
                        Scrapes clean, ad-free reader content (HTML/Text) for reading.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-mono text-cyan-400 font-semibold">GET /api/search?q=query</div>
                      <p className="text-slate-400 mt-0.5">
                        Cross-queries all fast sources in parallel and aggregates results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* JSON Response Viewer */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[520px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    Live JSON Response
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
                      alert('Copied response JSON');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Copy JSON
                  </button>
                </div>
                <div className="flex-1 overflow-auto mt-3 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300">
                  {loadingApi ? (
                    <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      Executing request...
                    </div>
                  ) : apiResponse ? (
                    <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600">
                      Click "Send Request" to test an endpoint
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* NOVEL DETAILS MODAL */}
      {(selectedNovel || loadingNovelDetails) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/20 text-indigo-300">
                  {selectedNovel?.sourceName || selectedNovel?.sourceId}
                </span>
                <span className="text-xs text-slate-400">Novel Metadata</span>
              </div>
              <button
                onClick={() => setSelectedNovel(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {loadingNovelDetails ? (
                <div className="p-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-slate-400">Parsing novel metadata and chapter list...</p>
                </div>
              ) : selectedNovel ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-32 sm:w-40 aspect-[3/4] bg-slate-800 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                      {selectedNovel.cover ? (
                        <img
                          src={selectedNovel.cover}
                          alt={selectedNovel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <BookOpen className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-100">{selectedNovel.name}</h3>
                      {selectedNovel.author && (
                        <p className="text-xs text-slate-300">
                          <span className="text-slate-500">Author:</span> {selectedNovel.author}
                        </p>
                      )}
                      {selectedNovel.status && (
                        <p className="text-xs text-slate-300">
                          <span className="text-slate-500">Status:</span> {selectedNovel.status}
                        </p>
                      )}
                      {selectedNovel.genres && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {selectedNovel.genres.split(',').map((g, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {g.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      {selectedNovel.summary && (
                        <div className="pt-2 text-xs text-slate-400 max-h-32 overflow-y-auto pr-1 leading-relaxed">
                          {selectedNovel.summary}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chapter List */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-200">
                        Chapters List ({selectedNovel.chapters?.length || 0})
                      </h4>
                      <span className="text-xs text-slate-400">Click to test reader</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {selectedNovel.chapters && selectedNovel.chapters.length > 0 ? (
                        selectedNovel.chapters.map((ch, idx) => (
                          <div
                            key={`${ch.path}-${idx}`}
                            onClick={() => openChapterReader(ch, selectedNovel.sourceId || '')}
                            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-600/20 border border-slate-800/80 hover:border-indigo-500/40 transition-colors flex items-center justify-between cursor-pointer group"
                          >
                            <span className="text-xs text-slate-300 group-hover:text-indigo-300 transition-colors truncate">
                              {ch.name}
                            </span>
                            <div className="flex items-center gap-2 text-slate-500 shrink-0">
                              {ch.releaseTime && <span className="text-[10px]">{ch.releaseTime}</span>}
                              <ChevronRight className="w-3.5 h-3.5 group-hover:text-indigo-400" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-6">No chapters indexed.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER READER MODAL */}
      {activeChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col">
          {/* Reader Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveChapter(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-semibold text-sm text-slate-200 line-clamp-1">{activeChapter.title}</h3>
                <span className="text-[10px] text-slate-400">Source: {activeChapter.sourceId}</span>
              </div>
            </div>

            {/* Font Size Adjuster */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReaderFontSize((s) => Math.max(14, s - 2))}
                className="p-1.5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
              >
                A-
              </button>
              <span className="text-xs text-slate-400 font-mono">{readerFontSize}px</span>
              <button
                onClick={() => setReaderFontSize((s) => Math.min(28, s + 2))}
                className="p-1.5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
              >
                A+
              </button>
              <button
                onClick={() => setActiveChapter(null)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reader Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950">
            <div className="max-w-3xl w-full">
              {loadingChapter ? (
                <div className="p-20 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-slate-400">Scraping chapter content from provider...</p>
                </div>
              ) : (
                <div
                  style={{ fontSize: `${readerFontSize}px` }}
                  className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-serif tracking-wide"
                  dangerouslySetInnerHTML={{ __html: chapterContent }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
