import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AnimeCard from "@/components/AnimeCard";
import { searchAniList, getByGenre, advancedSearch, type AniListMedia } from "@/lib/anilist";
import { getSearchHistory, addSearchHistory, removeSearchHistoryItem, clearSearchHistory } from "@/lib/searchHistory";
import { Search as SearchIcon, Loader2, Clock, X, Trash2, SlidersHorizontal, ChevronDown } from "lucide-react";

const ALL_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror",
  "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance",
  "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
const STATUSES = [
  { value: "RELEASING", label: "Airing" },
  { value: "FINISHED", label: "Finished" },
  { value: "NOT_YET_RELEASED", label: "Upcoming" },
  { value: "CANCELLED", label: "Cancelled" },
];
const FORMATS = [
  { value: "TV", label: "TV" },
  { value: "MOVIE", label: "Movie" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Special" },
  { value: "TV_SHORT", label: "TV Short" },
  { value: "MUSIC", label: "Music" },
];
const SORTS = [
  { value: "POPULARITY_DESC", label: "Most Popular" },
  { value: "SCORE_DESC", label: "Highest Rated" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "FAVOURITES_DESC", label: "Most Favorited" },
];
const SCORE_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 60, label: "60+" },
  { value: 70, label: "70+" },
  { value: 80, label: "80+" },
  { value: 90, label: "90+" },
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const isGenre = searchParams.get("genre") === "true";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(getSearchHistory());
  const [showHistory, setShowHistory] = useState(false);

  // Advanced filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(isGenre && q ? [q] : []);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedFormat, setSelectedFormat] = useState<string | undefined>();
  const [selectedSort, setSelectedSort] = useState("POPULARITY_DESC");
  const [minScore, setMinScore] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Run search on mount if params exist
  useEffect(() => {
    if (!q && !isGenre) return;
    setQuery(q);
    if (isGenre && q) {
      setSelectedGenres([q]);
      runFilteredSearch([q]);
    } else if (q) {
      setLoading(true);
      addSearchHistory(q);
      setHistory(getSearchHistory());
      searchAniList(q).then(setResults).catch(() => setResults([])).finally(() => { setLoading(false); setHasSearched(true); });
    }
  }, []);

  const runFilteredSearch = async (genresOverride?: string[]) => {
    setLoading(true);
    setHasSearched(true);
    const genres = genresOverride || selectedGenres;
    try {
      const res = await advancedSearch({
        query: query.trim() || undefined,
        genres: genres.length > 0 ? genres : undefined,
        year: selectedYear,
        status: selectedStatus as any,
        format: selectedFormat as any,
        sort: selectedSort,
        minScore: minScore || undefined,
        perPage: 30,
      });
      setResults(res);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHistory(false);
    if (query.trim()) addSearchHistory(query.trim());
    setHistory(getSearchHistory());
    runFilteredSearch();
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedYear(undefined);
    setSelectedStatus(undefined);
    setSelectedFormat(undefined);
    setSelectedSort("POPULARITY_DESC");
    setMinScore(0);
  };

  const activeFilterCount = [
    selectedGenres.length > 0,
    !!selectedYear,
    !!selectedStatus,
    !!selectedFormat,
    selectedSort !== "POPULARITY_DESC",
    minScore > 0,
  ].filter(Boolean).length;

  const handleClearAll = () => { clearSearchHistory(); setHistory([]); };
  const handleRemoveItem = (item: string) => { removeSearchHistoryItem(item); setHistory(getSearchHistory()); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-5">
          Browse Anime
        </h1>

        {/* Search bar + filter toggle */}
        <form onSubmit={handleSearch} className="mb-4 relative">
          <div className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                placeholder="Search for anime..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                filtersOpen || activeFilterCount > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-foreground hover:bg-muted"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary-foreground/20 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search history dropdown */}
          {showHistory && history.length > 0 && !q && (
            <div className="absolute top-full mt-1 max-w-xl w-full glass rounded-xl border border-border z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Clock size={12} /> Recent Searches
                </span>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); handleClearAll(); }}
                  className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                  <Trash2 size={10} /> Clear all
                </button>
              </div>
              {history.map((item) => (
                <div key={item} className="flex items-center group">
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); setQuery(item); setSearchParams({ q: item }); setShowHistory(false); }}
                    className="flex-1 text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    {item}
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); handleRemoveItem(item); }}
                    className="px-3 py-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Filter Panel */}
        {filtersOpen && (
          <div className="mb-6 glass rounded-xl border border-border p-4 sm:p-5 animate-fade-in space-y-4">
            {/* Genre chips */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {ALL_GENRES.map((genre) => (
                  <button key={genre} onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedGenres.includes(genre)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-foreground hover:bg-muted border border-border"
                    }`}>
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdowns row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Year */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Year</label>
                <select value={selectedYear || ""} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Any Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
                <select value={selectedStatus || ""} onChange={(e) => setSelectedStatus(e.target.value || undefined)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Any Status</option>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Format</label>
                <select value={selectedFormat || ""} onChange={(e) => setSelectedFormat(e.target.value || undefined)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Any Format</option>
                  {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Sort By</label>
                <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Min Score */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Min Score</label>
                <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  {SCORE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Filter actions */}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => runFilteredSearch()}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                Apply Filters
              </button>
              <button onClick={clearFilters}
                className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors">
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {(selectedGenres.length > 0 || selectedYear || selectedStatus || selectedFormat) && !filtersOpen && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedGenres.map((g) => (
              <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-[11px] font-medium">
                {g}
                <button onClick={() => { toggleGenre(g); setTimeout(() => runFilteredSearch(selectedGenres.filter(x => x !== g)), 0); }}>
                  <X size={10} />
                </button>
              </span>
            ))}
            {selectedYear && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/20 text-accent text-[11px] font-medium">
                {selectedYear} <button onClick={() => { setSelectedYear(undefined); }}><X size={10} /></button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {results.map((item, i) => (
              <AnimeCard
                key={item.id}
                id={item.id}
                title={item.title.english || item.title.romaji}
                image={item.coverImage.large}
                score={item.averageScore}
                genres={item.genres}
                year={item.seasonYear}
                delay={i * 50}
              />
            ))}
          </div>
        ) : hasSearched ? (
          <p className="text-muted-foreground text-center py-20">No results found. Try different filters.</p>
        ) : (
          <div className="text-center py-20">
            <SearchIcon size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Search or use filters to browse anime</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
