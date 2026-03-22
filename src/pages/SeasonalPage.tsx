import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AnimeCard from "@/components/AnimeCard";
import { getSeasonalAnime, getCurrentSeason, type AniListMedia } from "@/lib/anilist";
import { Loader2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
const SEASON_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  WINTER: { label: "Winter", emoji: "❄️", color: "from-blue-900/40 to-cyan-900/40" },
  SPRING: { label: "Spring", emoji: "🌸", color: "from-pink-900/40 to-rose-900/40" },
  SUMMER: { label: "Summer", emoji: "☀️", color: "from-amber-900/40 to-yellow-900/40" },
  FALL: { label: "Fall", emoji: "🍂", color: "from-orange-900/40 to-red-900/40" },
};

const SeasonalPage = () => {
  const current = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState<typeof SEASONS[number]>(current.season);
  const [selectedYear, setSelectedYear] = useState(current.year);
  const [anime, setAnime] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSeasonalAnime(selectedSeason, selectedYear, 1, 30)
      .then(setAnime)
      .catch(() => setAnime([]))
      .finally(() => setLoading(false));
  }, [selectedSeason, selectedYear]);

  const info = SEASON_LABELS[selectedSeason];
  const years = Array.from({ length: 6 }, (_, i) => current.year - i + 1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Calendar size={22} className="text-primary" />
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">Seasonal Anime</h1>
            <p className="text-xs text-muted-foreground">Browse anime by season and year</p>
          </div>
        </div>

        {/* Season Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SEASONS.map((s) => {
            const si = SEASON_LABELS[s];
            const isActive = s === selectedSeason;
            return (
              <button
                key={s}
                onClick={() => setSelectedSeason(s)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.97] ${
                  isActive
                    ? "bg-gradient-to-r " + si.color + " border border-white/10 text-foreground"
                    : "bg-secondary/50 border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{si.emoji}</span>
                {si.label}
              </button>
            );
          })}
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
                  y === selectedYear
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Current Selection Label */}
        <div className={`rounded-xl bg-gradient-to-r ${info.color} border border-white/5 p-4 mb-6`}>
          <span className="text-2xl mr-2">{info.emoji}</span>
          <span className="font-display font-bold text-foreground text-lg">{info.label} {selectedYear}</span>
          <span className="text-xs text-muted-foreground ml-2">
            {selectedSeason === current.season && selectedYear === current.year && "— Current Season"}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : anime.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">No anime found for {info.label} {selectedYear}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {anime.map((item, i) => (
              <Link
                key={item.id}
                to={`/anime/${item.id}`}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                  <img
                    src={item.coverImage.large}
                    alt={item.title.english || item.title.romaji}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {item.averageScore && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-xs font-semibold text-yellow-400">
                      ⭐ {(item.averageScore / 10).toFixed(1)}
                    </div>
                  )}
                  {item.status === "RELEASING" && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-green-500/80 text-[9px] font-bold text-white">
                      AIRING
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs sm:text-sm text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title.english || item.title.romaji}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {item.genres?.slice(0, 2).join(" • ")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalPage;
