import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import AnimeRow from "@/components/AnimeRow";
import MoodPicker from "@/components/MoodPicker";
import { getTrending, getPopular, getTopRated, getNewReleases, getAiringSchedule, getRandomAnime, getCurrentSeason, type AniListMedia } from "@/lib/anilist";
import { getContinueWatching, removeContinueWatching, type ContinueWatchingItem } from "@/lib/watchlist";
import { ChevronLeft, ChevronRight, Play, X, Shuffle, Clock, Calendar } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

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
  { name: "Sports", bg: "bg-blue-900/40 border-blue-800/40" },
  { name: "Mystery", bg: "bg-indigo-900/40 border-indigo-800/40" },
  { name: "Psychological", bg: "bg-violet-900/40 border-violet-800/40" },
  { name: "Drama", bg: "bg-amber-900/40 border-amber-800/40" },
  { name: "Supernatural", bg: "bg-emerald-900/40 border-emerald-800/40" },
  { name: "Music", bg: "bg-rose-900/40 border-rose-800/40" },
  { name: "Thriller", bg: "bg-stone-900/40 border-stone-800/40" },
  { name: "Ecchi", bg: "bg-fuchsia-900/40 border-fuchsia-800/40" },
  { name: "Mahou Shoujo", bg: "bg-pink-900/40 border-pink-800/40" },
];

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Airing now";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const ContinueWatchingRow = () => {
  const [items, setItems] = useState<ContinueWatchingItem[]>(getContinueWatching());
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleRemove = (animeId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeContinueWatching(animeId);
    setItems((prev) => prev.filter((i) => i.animeId !== animeId));
    toast.success("Removed from continue watching");
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
              to={`/watch/${item.animeId}?imdb=${item.imdbId}&ep=${item.episode}&title=${encodeURIComponent(item.animeTitle)}&img=${encodeURIComponent(item.animeImage)}`}
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
                <button
                  onClick={(e) => handleRemove(item.animeId, e)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/70 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Remove"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="px-2 pb-2 pt-6 bg-gradient-to-t from-background/90 to-transparent">
                    <div className="text-[10px] text-foreground font-medium mb-1.5">EP {item.episode}</div>
                    <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(((item.episode) / 12) * 100, 95)}%` }} />
                    </div>
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

// Airing Schedule Section
const AiringSection = ({ anime }: { anime: AniListMedia[] }) => {
  if (anime.length === 0) return null;
  return (
    <section className="py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            Airing Schedule
          </h2>
          <Link to="/seasonal" className="text-xs text-primary hover:underline flex items-center gap-1">
            <Calendar size={12} /> Seasonal
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {anime.slice(0, 6).map((item, i) => {
            const nae = item.nextAiringEpisode as any;
            return (
              <Link
                key={item.id}
                to={`/anime/${item.id}`}
                className="flex gap-3 glass rounded-xl p-3 border border-white/5 hover:border-primary/20 transition-all group animate-fade-in-up active:scale-[0.98]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-14 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img src={item.coverImage.large} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title.english || item.title.romaji}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.genres?.slice(0, 2).join(" • ")}</p>
                  {nae && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 font-semibold">
                        EP {nae.episode}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={8} />
                        {formatCountdown(nae.timeUntilAiring)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<AniListMedia[]>([]);
  const [popular, setPopular] = useState<AniListMedia[]>([]);
  const [topRated, setTopRated] = useState<AniListMedia[]>([]);
  const [newReleases, setNewReleases] = useState<AniListMedia[]>([]);
  const [airing, setAiring] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomLoading, setRandomLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      getTrending(1, 20),
      getPopular(1, 20),
      getTopRated(1, 20),
      getNewReleases(1, 20),
      getAiringSchedule(12),
    ]).then(([t, p, tr, nr, air]) => {
      if (t.status === "fulfilled") setTrending(t.value);
      if (p.status === "fulfilled") setPopular(p.value);
      if (tr.status === "fulfilled") setTopRated(tr.value);
      if (nr.status === "fulfilled") setNewReleases(nr.value);
      if (air.status === "fulfilled") setAiring(air.value);
      setLoading(false);
    });
  }, []);

  const handleRandomAnime = async () => {
    setRandomLoading(true);
    try {
      const anime = await getRandomAnime();
      if (anime) navigate(`/anime/${anime.id}`);
    } catch {
      toast.error("Could not fetch random anime");
    }
    setRandomLoading(false);
  };

  const currentSeason = getCurrentSeason();
  const seasonLabel = currentSeason.season.charAt(0) + currentSeason.season.slice(1).toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSlider items={trending.slice(0, 6)} />

      <div className="relative z-10 -mt-12">
        {/* Discovery Bar */}
        <section className="py-5">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass rounded-2xl border border-border p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleRandomAnime}
                disabled={randomLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground text-base font-bold active:scale-[0.97] transition-all disabled:opacity-50 shadow-lg hover:shadow-primary/30 hover:scale-[1.02]"
              >
                <Shuffle size={20} className={randomLoading ? "animate-spin" : "animate-bounce"} />
                {randomLoading ? "Finding..." : "🎲 Random Anime"}
              </button>
              <div className="hidden sm:block w-px h-10 bg-border" />
              <Link
                to="/seasonal"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors active:scale-[0.97]"
              >
                <Calendar size={16} />
                {seasonLabel} {currentSeason.year}
              </Link>
              <Link
                to="/search"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors active:scale-[0.97]"
              >
                <SlidersHorizontal size={16} />
                Advanced Search
              </Link>
            </div>
          </div>
        </section>

        <ContinueWatchingRow />

        {/* Airing Schedule */}
        <AiringSection anime={airing} />

        <AnimeRow title="Trending Now" emoji="🔥" items={trending} loading={loading} viewAllLink="/view/trending" />
        <AnimeRow title="Top Rated" emoji="⭐" items={topRated} loading={loading} viewAllLink="/view/top-rated" />

        <MoodPicker />

        <AnimeRow title="Most Popular" emoji="💎" items={popular} loading={loading} viewAllLink="/view/popular" />
        <AnimeRow title="New Releases" emoji="🆕" items={newReleases} loading={loading} viewAllLink="/view/new-releases" />

        {/* Browse by Genre */}
        <section className="py-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-base sm:text-lg font-semibold text-foreground mb-4">
              Browse by Genre
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {genres.map((genre, i) => (
                <Link
                  key={genre.name}
                  to={`/search?q=${encodeURIComponent(genre.name)}&genre=true`}
                  className={`rounded-xl border p-4 sm:p-5 text-center font-display font-semibold text-sm text-foreground hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${genre.bg} animate-fade-in-up`}
                  style={{ animationDelay: `${i * 30}ms` }}
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
                  <Link to="/view/trending" className="hover:text-foreground transition-colors">Trending</Link>
                  <Link to="/view/popular" className="hover:text-foreground transition-colors">Popular</Link>
                  <Link to="/view/top-rated" className="hover:text-foreground transition-colors">Top Rated</Link>
                  <Link to="/seasonal" className="hover:text-foreground transition-colors">Seasonal</Link>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Features</h3>
                <div className="flex flex-col gap-1">
                  <Link to="/identity-card" className="hover:text-foreground transition-colors">Identity Card</Link>
                  <Link to="/watchlist" className="hover:text-foreground transition-colors">Watchlist</Link>
                  <Link to="/profile" className="hover:text-foreground transition-colors">Profile</Link>
                  <Link to="/settings" className="hover:text-foreground transition-colors">Settings</Link>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Genres</h3>
                <div className="flex flex-col gap-1">
                  <Link to="/search?q=Action&genre=true" className="hover:text-foreground transition-colors">Action</Link>
                  <Link to="/search?q=Romance&genre=true" className="hover:text-foreground transition-colors">Romance</Link>
                  <Link to="/search?q=Fantasy&genre=true" className="hover:text-foreground transition-colors">Fantasy</Link>
                  <Link to="/search?q=Psychological&genre=true" className="hover:text-foreground transition-colors">Psychological</Link>
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
