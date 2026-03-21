import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import { getStreamLinks, type StreamResult } from "@/lib/api";
import { saveContinueWatching } from "@/lib/watchlist";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || "0", 10);
  const [searchParams] = useSearchParams();
  const imdbId = searchParams.get("imdb") || "";
  const episode = parseInt(searchParams.get("ep") || "1", 10);
  const title = searchParams.get("title") || "Anime";
  const img = searchParams.get("img") || "";

  const [stream, setStream] = useState<StreamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imdbId) return;
    setLoading(true);
    setError(false);
    getStreamLinks(imdbId, 1, episode)
      .then((data) => {
        setStream(data);
        // Save to continue watching
        saveContinueWatching({
          animeId,
          animeTitle: title,
          animeImage: img,
          episode,
          imdbId,
          timestamp: Date.now(),
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [imdbId, episode, animeId, title, img]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 pb-16 max-w-[1100px] mx-auto px-4 sm:px-6">
        <Link
          to={`/anime/${animeId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft size={16} />
          Back to {decodeURIComponent(title)}
        </Link>

        <h1 className="font-display text-lg sm:text-xl font-bold text-foreground mb-0.5">
          {decodeURIComponent(title)}
        </h1>
        <p className="text-xs text-muted-foreground mb-4">Episode {episode}</p>

        {loading ? (
          <div className="w-full aspect-video rounded-xl bg-secondary flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : error || !stream ? (
          <div className="w-full aspect-video rounded-xl bg-secondary flex items-center justify-center">
            <p className="text-muted-foreground">Failed to load stream</p>
          </div>
        ) : (
          <VideoPlayer primaryUrl={stream.primary} backupUrl={stream.backup} />
        )}

        {/* Episode nav */}
        <div className="flex items-center justify-between mt-4">
          {episode > 1 ? (
            <Link
              to={`/watch/${animeId}?imdb=${imdbId}&ep=${episode - 1}&title=${encodeURIComponent(title)}&img=${encodeURIComponent(img)}`}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg glass glass-hover text-sm text-foreground font-medium active:scale-[0.97]"
            >
              <ChevronLeft size={16} /> EP {episode - 1}
            </Link>
          ) : <div />}
          <Link
            to={`/watch/${animeId}?imdb=${imdbId}&ep=${episode + 1}&title=${encodeURIComponent(title)}&img=${encodeURIComponent(img)}`}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg glass glass-hover text-sm text-foreground font-medium active:scale-[0.97]"
          >
            EP {episode + 1} <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
