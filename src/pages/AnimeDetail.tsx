import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { getAnimeById, getRecommendations, stripHtml, formatScore, type AniListMedia } from "@/lib/anilist";
import AnimeCard from "@/components/AnimeCard";
import { getImdbId } from "@/lib/api";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";
import { useAuth } from "@/hooks/useAuth";
import { Play, Plus, Check, Share2, Loader2, Calendar, Film, Clock, Star, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AnimeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || "0", 10);
  const { user } = useAuth();

  const [anime, setAnime] = useState<AniListMedia | null>(null);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [inList, setInList] = useState(false);

  useEffect(() => {
    if (!animeId) return;
    setLoading(true);

    getAnimeById(animeId)
      .then((data) => {
        setAnime(data);
        // Also fetch IMDB ID using the title
        const title = data.title.english || data.title.romaji;
        getImdbId(title)
          .then((res) => setImdbId(res.imdb))
          .catch(() => setImdbId(null));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [animeId]);

  useEffect(() => {
    if (user && animeId) {
      isInWatchlist(user.id, animeId).then(setInList);
    }
  }, [user, animeId]);

  const toggleWatchlist = async () => {
    if (!user) {
      toast.error("Sign in to add to your watchlist");
      return;
    }
    if (!anime) return;

    if (inList) {
      await removeFromWatchlist(user.id, animeId);
      setInList(false);
      toast.success("Removed from watchlist");
    } else {
      await addToWatchlist(user.id, anime);
      setInList(true);
      toast.success("Added to watchlist");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

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

  if (!anime) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center pt-32 text-muted-foreground">Anime not found</div>
      </div>
    );
  }

  const title = anime.title.english || anime.title.romaji;
  const jpTitle = anime.title.english ? anime.title.romaji : null;
  const episodeCount = anime.episodes || anime.nextAiringEpisode?.episode || 12;
  const studio = anime.studios?.nodes?.[0]?.name;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <div className="relative w-full h-[40vh] sm:h-[45vh]">
        <img
          src={anime.bannerImage || anime.coverImage.extraLarge}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-16">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Poster */}
          <div className="flex-shrink-0 w-40 sm:w-48">
            <img
              src={anime.coverImage.extraLarge || anime.coverImage.large}
              alt={title}
              className="w-full rounded-xl shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 animate-fade-in-up">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1 leading-[1.1]">
              {title}
            </h1>
            {jpTitle && (
              <p className="text-sm text-muted-foreground mb-3">{jpTitle}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-muted-foreground">
              {anime.averageScore && (
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <Star size={12} fill="currentColor" />
                  {formatScore(anime.averageScore)}
                </span>
              )}
              {anime.seasonYear && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {anime.seasonYear}
                </span>
              )}
              {anime.episodes && (
                <span className="flex items-center gap-1">
                  <Film size={12} /> {anime.episodes} episodes
                </span>
              )}
              {anime.duration && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {anime.duration} min/ep
                </span>
              )}
              {studio && <span>{studio}</span>}
            </div>

            {/* Status badge */}
            {anime.status && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 mb-3">
                {anime.status.replace(/_/g, " ")}
              </span>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {anime.genres.map((g) => (
                <span key={g} className="text-xs px-2.5 py-0.5 rounded-full border border-border text-muted-foreground">
                  {g}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-5 max-w-2xl leading-relaxed">
              {stripHtml(anime.description)}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              {imdbId ? (
                <Link
                  to={`/watch/${animeId}?imdb=${imdbId}&ep=1&title=${encodeURIComponent(title)}&img=${encodeURIComponent(anime.coverImage.large)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-accent text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]"
                >
                  <Play size={16} fill="currentColor" />
                  Watch Now
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-muted-foreground text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Loading stream...
                </div>
              )}

              <button
                onClick={toggleWatchlist}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg glass border border-white/10 text-foreground font-medium text-sm hover:bg-white/10 transition-colors active:scale-[0.97]"
              >
                {inList ? <Check size={16} /> : <Plus size={16} />}
                {inList ? "In List" : "Add to List"}
              </button>

              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:bg-white/10 transition-colors active:scale-95"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Episodes */}
        <h2 className="font-display text-lg font-semibold text-foreground mt-10 mb-4">Episodes</h2>
        {imdbId ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => (
              <Link
                key={ep}
                to={`/watch/${animeId}?imdb=${imdbId}&ep=${ep}&title=${encodeURIComponent(title)}&img=${encodeURIComponent(anime.coverImage.large)}`}
                className="glass glass-hover rounded-lg px-3 py-2.5 text-center text-xs font-medium text-foreground active:scale-[0.97] transition-all"
              >
                EP {ep}
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">Episode streaming is available via the Kogemi API integration.</p>
            <p className="text-xs text-muted-foreground">Connect a Kogemi API endpoint to enable episode playback.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeDetail;
