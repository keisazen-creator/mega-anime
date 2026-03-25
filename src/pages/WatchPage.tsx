import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import { getStreamLinks, type StreamResult } from "@/lib/api";
import { saveContinueWatching } from "@/lib/watchlist";
import { upsertWatchStat, getWatchStats, checkAndAwardBadges } from "@/lib/gamification";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

// Paginated episode grid component
const EpisodeGrid = ({ totalEps, currentEp, buildUrl }: { totalEps: number; currentEp: number; buildUrl: (ep: number) => string }) => {
  const CHUNK = 100;
  const totalChunks = Math.ceil(totalEps / CHUNK);
  const currentChunkIndex = Math.floor((currentEp - 1) / CHUNK);
  const [activeChunk, setActiveChunk] = useState(currentChunkIndex);

  const start = activeChunk * CHUNK + 1;
  const end = Math.min((activeChunk + 1) * CHUNK, totalEps);

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">Episodes ({totalEps})</h3>

      {/* Range selector for large episode counts */}
      {totalChunks > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Array.from({ length: totalChunks }, (_, i) => {
            const rangeStart = i * CHUNK + 1;
            const rangeEnd = Math.min((i + 1) * CHUNK, totalEps);
            return (
              <button
                key={i}
                onClick={() => setActiveChunk(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
                  activeChunk === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {rangeStart}–{rangeEnd}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((ep) => (
          <Link
            key={ep}
            to={buildUrl(ep)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
              ep === currentEp
                ? "bg-primary text-primary-foreground glow-accent-sm"
                : "glass glass-hover text-foreground"
            }`}
          >
            {ep}
          </Link>
        ))}
      </div>
    </div>
  );
};

const WatchPage = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || "0", 10);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const imdbId = searchParams.get("imdb") || "";
  const episode = parseInt(searchParams.get("ep") || "1", 10);
  const title = searchParams.get("title") || "Anime";
  const img = searchParams.get("img") || "";
  const totalEps = parseInt(searchParams.get("total") || "0", 10);

  const [stream, setStream] = useState<StreamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imdbId) return;
    setLoading(true);
    setError(false);
    getStreamLinks(imdbId, 1, episode)
      .then(async (data) => {
        setStream(data);
        const decodedTitle = decodeURIComponent(title);
        const decodedImg = decodeURIComponent(img);
        saveContinueWatching({
          animeId,
          animeTitle: decodedTitle,
          animeImage: decodedImg,
          episode,
          imdbId,
          timestamp: Date.now(),
        });
        // Track stats + award badges
        if (user) {
          const genres = searchParams.get("genres")?.split(",") || [];
          await upsertWatchStat(user.id, {
            id: animeId,
            title: decodedTitle,
            image: decodedImg,
            genres,
            episodes: totalEps || null,
            duration: null,
          }, episode);
          const stats = await getWatchStats(user.id);
          const newBadges = await checkAndAwardBadges(user.id, stats);
          if (newBadges.length > 0) {
            toast.success(`🏆 New badge${newBadges.length > 1 ? "s" : ""} earned!`);
          }
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [imdbId, episode, animeId, title, img]);

  const buildUrl = (ep: number) =>
    `/watch/${animeId}?imdb=${imdbId}&ep=${ep}&title=${encodeURIComponent(title)}&img=${encodeURIComponent(img)}${totalEps ? `&total=${totalEps}` : ""}`;

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
          <VideoPlayer
            primaryUrl={stream.primary}
            backupUrl={stream.backup}
            episode={episode}
            hasPrev={episode > 1}
            hasNext={totalEps ? episode < totalEps : true}
            onPrevEp={() => episode > 1 && navigate(buildUrl(episode - 1))}
            onNextEp={() => navigate(buildUrl(episode + 1))}
          />
        )}

        {/* Quick episode navigation */}
        {totalEps > 0 && <EpisodeGrid totalEps={totalEps} currentEp={episode} buildUrl={buildUrl} />}
      </div>
    </div>
  );
};

export default WatchPage;
