import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AnimeCard from "@/components/AnimeCard";
import { searchAnime, type AnimeSearchResult } from "@/lib/api";
import { Search as SearchIcon, Loader2 } from "lucide-react";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<AnimeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q) {
      setQuery(q);
      setLoading(true);
      searchAnime(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
          Search Anime
        </h1>

        <form onSubmit={handleSearch} className="mb-10">
          <div className="relative max-w-xl">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for anime..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {results.map((item, i) => (
              <AnimeCard
                key={item.id}
                title={item.title.english || item.title.romaji}
                image={item.coverImage.large}
                id={item.id}
                delay={i * 60}
              />
            ))}
          </div>
        ) : q ? (
          <p className="text-muted-foreground text-center py-20">No results found for "{q}"</p>
        ) : (
          <p className="text-muted-foreground text-center py-20">Start typing to search for anime</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
