import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { getAnimeById, getRecommendations, getRelatedSeasons, stripHtml, formatScore, type AniListMedia } from "@/lib/anilist";
import AnimeCard from "@/components/AnimeCard";
import Comments from "@/components/Comments";
import { getImdbId } from "@/lib/api";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";
import { useAuth } from "@/hooks/useAuth";
import { Play, Plus, Check, Share2, Loader2, Calendar, Film, Clock, Star, ArrowLeft, Layers, Dna, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const AnimeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || "0", 10);
  const { user } = useAuth();

  const [anime, setAnime] = useState<AniListMedia | null>(null);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AniListMedia[]>([]);
  const [relatedSeasons, setRelatedSeasons] = useState<{ id: number; title: string; relationType: string; format: string | null; status: string | null; coverImage: string; seasonYear: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inList, setInList] = useState(false);
  const [activeChunk, setActiveChunk] = useState(0);

  const loadAnime = () => {
    if (!animeId) return;
    setLoading(true);
    setError(false);
    setImdbId(null);
    setRecommendations([]);
    setRelatedSeasons([]);

    getAnimeById(animeId)
      .then((data) => {
        setAnime(data);
        const title = data.title.english || data.title.romaji;
        getImdbId(title)
          .then((res) => setImdbId(res.imdb))
          .catch(() => setImdbId(null));
        getRecommendations(data.genres, animeId)
          .then(setRecommendations)
          .catch(() => setRecommendations([]));
        getRelatedSeasons(animeId)
          .then(setRelatedSeasons)
          .catch(() => setRelatedSeasons([]));
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnime();
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
        <div className="flex flex-col items-center justify-center pt-32 gap-3">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-sm text-muted-foreground">Loading anime details...</p>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-32 gap-4">
          <p className="text-muted-foreground">Couldn't load this anime. The API may be temporarily busy.</p>
          <button
            onClick={loadAnime}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const title = anime.title.english || anime.title.romaji;
  const jpTitle = anime.title.english ? anime.title.romaji : null;
  const episodeCount = anime.episodes || anime.nextAiringEpisode?.episode || 12;
  const studio = anime.studios?.nodes?.[0]?.name;

  // Episode pagination for detail page
  const CHUNK = 100;
  const totalChunks = Math.ceil(episodeCount / CHUNK);

  const [activeChunk, setActiveChunk] = useState(0);
  const epStart = activeChunk * CHUNK + 1;
  const epEnd = Math.min((activeChunk + 1) * CHUNK, episodeCount);

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
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0 w-40 sm:w-48">
            <img
              src={anime.coverImage.extraLarge || anime.coverImage.large}
              alt={title}
              className="w-full rounded-xl shadow-2xl"
            />
          </div>

          <div className="flex-1 animate-fade-in-up">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1 leading-[1.1]">
              {title}
            </h1>
            {jpTitle && <p className="text-sm text-muted-foreground mb-3">{jpTitle}</p>}

            <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-muted-foreground">
              {anime.averageScore && (
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <Star size={12} fill="currentColor" />
                  {formatScore(anime.averageScore)}
                </span>
              )}
              {anime.seasonYear && (
                <span className="flex items-center gap-1"><Calendar size={12} /> {anime.seasonYear}</span>
              )}
              {anime.episodes && (
                <span className="flex items-center gap-1"><Film size={12} /> {anime.episodes} episodes</span>
              )}
              {anime.duration && (
                <span className="flex items-center gap-1"><Clock size={12} /> {anime.duration} min/ep</span>
              )}
              {studio && <span>{studio}</span>}
            </div>

            {anime.status && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 mb-3">
                {anime.status.replace(/_/g, " ")}
              </span>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {anime.genres.map((g) => (
                <Link key={g} to={`/search?q=${encodeURIComponent(g)}&genre=true`} className="text-xs px-2.5 py-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  {g}
                </Link>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mb-5 max-w-2xl leading-relaxed">
              {stripHtml(anime.description)}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {imdbId ? (
                <Link
                  to={`/watch/${animeId}?imdb=${imdbId}&ep=1&title=${encodeURIComponent(title)}&img=${encodeURIComponent(anime.coverImage.large)}&total=${episodeCount}`}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg glass border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors active:scale-[0.97]"
              >
                {inList ? <Check size={16} /> : <Plus size={16} />}
                {inList ? "In List" : "Add to List"}
              </button>

              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full glass border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                <Share2 size={14} />
              </button>

              <Link
                to={`/dna/${animeId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg glass border border-primary/20 text-primary font-medium text-sm hover:bg-primary/10 transition-colors active:scale-[0.97]"
              >
                <Dna size={16} />
                AnimeDNA
              </Link>
            </div>
          </div>
        </div>

        {/* Related Seasons */}
        {relatedSeasons.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers size={18} className="text-primary" /> Related Seasons
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {relatedSeasons.map((rel, i) => (
                <Link
                  key={rel.id}
                  to={`/anime/${rel.id}`}
                  className="flex-shrink-0 w-32 group animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                    <img src={rel.coverImage} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/90 text-primary-foreground">
                        {rel.relationType.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{rel.title}</p>
                  <p className="text-[10px] text-muted-foreground">{rel.seasonYear || ""} {rel.format ? `• ${rel.format}` : ""}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Episodes with pagination */}
        <h2 className="font-display text-lg font-semibold text-foreground mt-10 mb-4">Episodes</h2>
        {imdbId ? (
          <div>
            {totalChunks > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Array.from({ length: totalChunks }, (_, i) => {
                  const rs = i * CHUNK + 1;
                  const re = Math.min((i + 1) * CHUNK, episodeCount);
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveChunk(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeChunk === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {rs}–{re}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Array.from({ length: epEnd - epStart + 1 }, (_, i) => epStart + i).map((ep, idx) => (
                <Link
                  key={ep}
                  to={`/watch/${animeId}?imdb=${imdbId}&ep=${ep}&title=${encodeURIComponent(title)}&img=${encodeURIComponent(anime.coverImage.large)}&total=${episodeCount}`}
                  className="glass glass-hover rounded-xl p-3 flex items-center gap-3 group active:scale-[0.97] transition-all animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(idx * 15, 300)}ms` }}
                >
                  <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={anime.coverImage.large} alt={`EP ${ep}`} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play size={12} fill="currentColor" className="text-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Episode {ep}</p>
                    <p className="text-[10px] text-muted-foreground">{anime.duration || 24} min</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
            <p className="text-muted-foreground text-sm">Loading episodes...</p>
          </div>
        )}

        <Comments animeId={animeId} />

        {recommendations.length > 0 && (
          <>
            <h2 className="font-display text-lg font-semibold text-foreground mt-10 mb-4">✨ More Like This</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {recommendations.map((item, i) => (
                <AnimeCard
                  key={item.id}
                  id={item.id}
                  title={item.title.english || item.title.romaji}
                  image={item.coverImage.large}
                  score={item.averageScore}
                  genres={item.genres}
                  year={item.seasonYear}
                  delay={i * 50}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnimeDetail;
