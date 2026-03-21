import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AnimeCard from "@/components/AnimeCard";
import { getTrending, getPopular, getTopRated, getNewReleases, type AniListMedia } from "@/lib/anilist";
import { Loader2 } from "lucide-react";

const categoryMap: Record<string, { title: string; emoji: string; fetcher: (page: number, perPage: number) => Promise<AniListMedia[]> }> = {
  trending: { title: "Trending Now", emoji: "🔥", fetcher: getTrending },
  popular: { title: "Most Popular", emoji: "💎", fetcher: getPopular },
  "top-rated": { title: "Top Rated", emoji: "⭐", fetcher: getTopRated },
  "new-releases": { title: "New Releases", emoji: "🆕", fetcher: getNewReleases },
};

const ViewAllPage = () => {
  const { category } = useParams<{ category: string }>();
  const config = categoryMap[category || ""] || categoryMap.trending;
  const [items, setItems] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    config.fetcher(page, 30)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, page]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-6">
          {config.emoji} {config.title}
        </h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {items.map((item, i) => (
                <AnimeCard
                  key={item.id}
                  id={item.id}
                  title={item.title.english || item.title.romaji}
                  image={item.coverImage.large}
                  score={item.averageScore}
                  genres={item.genres}
                  year={item.seasonYear}
                  delay={i * 30}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-8">
              {page > 1 && (
                <button
                  onClick={() => setPage((p) => p - 1)}
                  className="px-5 py-2 rounded-lg glass glass-hover text-sm text-foreground font-medium active:scale-[0.97]"
                >
                  Previous
                </button>
              )}
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-5 py-2 rounded-lg glass glass-hover text-sm text-foreground font-medium active:scale-[0.97]"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewAllPage;
