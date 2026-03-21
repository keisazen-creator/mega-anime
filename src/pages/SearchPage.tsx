import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AnimeCard from "@/components/AnimeCard";
import { searchAniList, getByGenre, type AniListMedia } from "@/lib/anilist";
import { getSearchHistory, addSearchHistory, removeSearchHistoryItem, clearSearchHistory } from "@/lib/searchHistory";
import { Search as SearchIcon, Loader2, Clock, X, Trash2 } from "lucide-react";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const isGenre = searchParams.get("genre") === "true";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(getSearchHistory());
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!q) return;
    setQuery(q);
    setLoading(true);
    if (!isGenre) addSearchHistory(q);
    setHistory(getSearchHistory());
    const fetcher = isGenre ? getByGenre(q) : searchAniList(q);
    fetcher
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q, isGenre]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowHistory(false);
      setSearchParams({ q: query.trim() });
    }
  };

  const handleClearAll = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const handleRemoveItem = (item: string) => {
    removeSearchHistoryItem(item);
    setHistory(getSearchHistory());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-5">
          {isGenre ? `${q} Anime` : "Search Anime"}
        </h1>

        <form onSubmit={handleSearch} className="mb-8 relative">
          <div className="relative max-w-xl">
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

          {/* Search history dropdown */}
          {showHistory && history.length > 0 && !q && (
            <div className="absolute top-full mt-1 max-w-xl w-full glass rounded-xl border border-border z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Clock size={12} /> Recent Searches
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleClearAll(); }}
                  className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={10} /> Clear all
                </button>
              </div>
              {history.map((item) => (
                <div key={item} className="flex items-center group">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setQuery(item);
                      setSearchParams({ q: item });
                      setShowHistory(false);
                    }}
                    className="flex-1 text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleRemoveItem(item); }}
                    className="px-3 py-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>

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
        ) : q ? (
          <p className="text-muted-foreground text-center py-20">No results for "{q}"</p>
        ) : (
          <p className="text-muted-foreground text-center py-20">Start typing to search</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
