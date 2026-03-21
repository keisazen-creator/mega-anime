import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import AnimeRow from "@/components/AnimeRow";
import AnimeCard from "@/components/AnimeCard";
import { getTrending, getPopular, getTopRated, getNewReleases, type AniListMedia } from "@/lib/anilist";
import { getContinueWatching, type ContinueWatchingItem } from "@/lib/watchlist";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useRef } from "react";

const genres = [
  { name: "Action", bg: "bg-red-900/40 border-red-800/40" },
  { name: "Adventure", bg: "bg-teal-900/40 border-teal-800/40" },
  { name: "Fantasy", bg: "bg-purple-900/40 border-purple-800/40" },
  { name: "Romance", bg: "bg-pink-900/40 border-pink-800/40" },
  { name: "Comedy", bg: "bg-yellow-900/40 border-yellow-800/40" },
  { name: "Horror", bg: "bg-gray-900/40 border-gray-800/40" },
  { name: "Sci-Fi", bg: "bg-cyan-900/40 border-cyan-800/40" },
  { name: "Slice of Life", bg: "bg-green-900/40 border-green-800/40" },
  { name: "Mecha", bg: "bg-orange-900/40 border-orange-800/40" },
];

const ContinueWatchingRow = () => {
  const items = getContinueWatching();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-5">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            ▶️ Continue Watching
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => scroll("left")} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"><ChevronLeft size={18} /></button>
            <button onClick={() => scroll("right")} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {items.map((item, i) => (
            <Link
              key={item.animeId}
              to={`/watch/${item.animeId}?imdb=${item.imdbId}&ep=${item.episode}`}
              className="group relative flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[175px] animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                <img src={item.animeImage} alt={item.animeTitle} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center glow-accent-sm">
                    <Play size={18} fill="currentColor" className="text-primary-foreground ml-0.5" />
                  </div>
                </div>
                {/* Episode badge */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] text-foreground font-medium">
                    EP {item.episode}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-foreground font-medium line-clamp-2">{item.animeTitle}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const [trending, setTrending] = useState<AniListMedia[]>([]);
  const [popular, setPopular] = useState<AniListMedia[]>([]);
  const [topRated, setTopRated] = useState<AniListMedia[]>([]);
  const [newReleases, setNewReleases] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getTrending(1, 20),
      getPopular(1, 20),
      getTopRated(1, 20),
      getNewReleases(1, 20),
    ]).then(([t, p, tr, nr]) => {
      if (t.status === "fulfilled") setTrending(t.value);
      if (p.status === "fulfilled") setPopular(p.value);
      if (tr.status === "fulfilled") setTopRated(tr.value);
      if (nr.status === "fulfilled") setNewReleases(nr.value);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSlider items={trending.slice(0, 6)} />

      <div className="relative z-10 -mt-12">
        <ContinueWatchingRow />
        <AnimeRow title="Trending Now" emoji="🔥" items={trending} loading={loading} />
        <AnimeRow title="Top Rated" emoji="⭐" items={topRated} loading={loading} />
        <AnimeRow title="Most Popular" emoji="💎" items={popular} loading={loading} />
        <AnimeRow title="New Releases" emoji="🆕" items={newReleases} loading={loading} />

        {/* Browse by Genre */}
        <section className="py-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-base sm:text-lg font-semibold text-foreground mb-4">
              Browse by Genre
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {genres.map((genre, i) => (
                <Link
                  key={genre.name}
                  to={`/search?q=${encodeURIComponent(genre.name)}&genre=true`}
                  className={`rounded-xl border p-4 sm:p-5 text-center font-display font-semibold text-sm text-foreground hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${genre.bg} animate-fade-in-up`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 border-t border-border">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-gradient-accent flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-xs">O</span>
              </div>
              <span className="font-display font-semibold text-foreground">OtakuCloud</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Your premium anime streaming platform. Watch thousands of anime titles for free.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Browse</h3>
                <div className="flex flex-col gap-1">
                  <Link to="/" className="hover:text-foreground transition-colors">Trending</Link>
                  <Link to="/" className="hover:text-foreground transition-colors">Popular</Link>
                  <Link to="/" className="hover:text-foreground transition-colors">Top Rated</Link>
                  <Link to="/" className="hover:text-foreground transition-colors">New Releases</Link>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Genres</h3>
                <div className="flex flex-col gap-1">
                  <Link to="/search?q=Action&genre=true" className="hover:text-foreground transition-colors">Action</Link>
                  <Link to="/search?q=Romance&genre=true" className="hover:text-foreground transition-colors">Romance</Link>
                  <Link to="/search?q=Fantasy&genre=true" className="hover:text-foreground transition-colors">Fantasy</Link>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-6">
              OtakuCloud © {new Date().getFullYear()} — Powered by AniList & Kogemi API
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
