import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { getAnimeInfo, getImdbId, searchAnime, type AnimeInfo, type AnimeSearchResult } from "@/lib/api";
import { Play, Loader2, Calendar, Film, Clock } from "lucide-react";

const AnimeDetail = () => {
  const { title } = useParams<{ title: string }>();
  const decodedTitle = decodeURIComponent(title || "");
  const [info, setInfo] = useState<AnimeInfo | null>(null);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!decodedTitle) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [infoRes, imdbRes, searchRes] = await Promise.allSettled([
          getAnimeInfo(decodedTitle),
          getImdbId(decodedTitle),
          searchAnime(decodedTitle),
        ]);

        if (infoRes.status === "fulfilled") setInfo(infoRes.value);
        if (imdbRes.status === "fulfilled") setImdbId(imdbRes.value.imdb);
        if (searchRes.status === "fulfilled" && searchRes.value.length > 0) {
          setPoster(searchRes.value[0].coverImage.large);
        }
      } catch {
        // handled individually
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [decodedTitle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </div>
    );
  }

  const episodeCount = info?.episodes || 12;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero section */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Poster */}
          <div className="flex-shrink-0 w-48 sm:w-56 mx-auto md:mx-0">
            {poster ? (
              <img
                src={poster}
                alt={decodedTitle}
                className="w-full rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-secondary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 animate-fade-in-up">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-[1.1]">
              {decodedTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
              {info?.year && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {info.year}
                </span>
              )}
              {info?.episodes && (
                <span className="flex items-center gap-1.5">
                  <Film size={14} />
                  {info.episodes} Episodes
                </span>
              )}
              {info?.status && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {info.status}
                </span>
              )}
            </div>

            {imdbId && (
              <Link
                to={`/watch/${encodeURIComponent(decodedTitle)}?imdb=${imdbId}&ep=1`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-accent text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97] glow-accent-sm"
              >
                <Play size={18} fill="currentColor" />
                Watch Now
              </Link>
            )}
          </div>
        </div>

        {/* Episode List */}
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">Episodes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => (
            <Link
              key={ep}
              to={
                imdbId
                  ? `/watch/${encodeURIComponent(decodedTitle)}?imdb=${imdbId}&ep=${ep}`
                  : "#"
              }
              className="glass glass-hover rounded-lg px-4 py-3 text-center text-sm font-medium text-foreground active:scale-[0.97] transition-all"
            >
              Episode {ep}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimeDetail;
