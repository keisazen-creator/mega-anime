import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import { getStreamLinks, type StreamResult } from "@/lib/api";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const WatchPage = () => {
  const { title } = useParams<{ title: string }>();
  const [searchParams] = useSearchParams();
  const imdbId = searchParams.get("imdb") || "";
  const episode = parseInt(searchParams.get("ep") || "1", 10);
  const decodedTitle = decodeURIComponent(title || "");

  const [stream, setStream] = useState<StreamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imdbId) return;
    setLoading(true);
    setError(false);
    getStreamLinks(imdbId, 1, episode)
      .then(setStream)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [imdbId, episode]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1100px] mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          to={`/anime/${encodeURIComponent(decodedTitle)}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          Back to {decodedTitle}
        </Link>

        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1">
          {decodedTitle}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Episode {episode}</p>

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

        {/* Episode navigation */}
        <div className="flex items-center justify-between mt-6">
          {episode > 1 ? (
            <Link
              to={`/watch/${encodeURIComponent(decodedTitle)}?imdb=${imdbId}&ep=${episode - 1}`}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg glass glass-hover text-sm text-foreground font-medium active:scale-[0.97]"
            >
              <ChevronLeft size={16} />
              Episode {episode - 1}
            </Link>
          ) : (
            <div />
          )}
          <Link
            to={`/watch/${encodeURIComponent(decodedTitle)}?imdb=${imdbId}&ep=${episode + 1}`}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg glass glass-hover text-sm text-foreground font-medium active:scale-[0.97]"
          >
            Episode {episode + 1}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
