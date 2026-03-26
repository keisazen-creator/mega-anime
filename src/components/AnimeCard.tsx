import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Star, Info } from "lucide-react";
import { formatScore } from "@/lib/anilist";
import QuickAddButton from "@/components/QuickAddButton";

interface AnimeCardProps {
  id: number;
  title: string;
  image: string;
  score?: number | null;
  genres?: string[];
  year?: number | null;
  delay?: number;
  description?: string | null;
}

const AnimeCard = ({ id, title, image, score, genres, year, delay = 0, description }: AnimeCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const animeData = {
    id,
    title: { romaji: title, english: title },
    coverImage: { large: image },
    genres: genres || [],
    averageScore: score ?? null,
    seasonYear: year ?? null,
  };

  return (
    <div
      className="group relative flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[175px] animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <Link to={`/anime/${id}`}>
        <div
          className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary transition-all duration-300 ease-out ${
            expanded ? "scale-105 shadow-2xl shadow-primary/20 z-20 ring-1 ring-primary/30" : "shadow-lg shadow-black/20"
          }`}
        >
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-500 ${expanded ? "scale-110" : ""}`}
            loading="lazy"
          />

          {score && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-xs font-semibold text-yellow-400">
              <Star size={10} fill="currentColor" />
              {formatScore(score)}
            </div>
          )}

          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
            <QuickAddButton anime={animeData} />
          </div>

          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent transition-opacity duration-300 ${expanded ? "opacity-100" : "opacity-0"}`} />

          {/* Play button on hover */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${expanded ? "opacity-100" : "opacity-0"}`}>
            <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center glow-accent-sm">
              <Play size={20} fill="currentColor" className="text-primary-foreground ml-0.5" />
            </div>
          </div>

          {/* Expanded info overlay */}
          {expanded && (
            <div className="absolute bottom-0 left-0 right-0 p-2.5 animate-fade-in">
              <div className="flex flex-wrap gap-1 mb-1">
                {genres?.slice(0, 2).map((g) => (
                  <span key={g} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Link>

      <Link to={`/anime/${id}`}>
        <p className="mt-2 text-xs sm:text-sm text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </p>
      </Link>
      {(genres || year) && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {genres?.slice(0, 2).join(" • ")}{genres && year ? " • " : ""}{year || ""}
        </p>
      )}
    </div>
  );
};

export default AnimeCard;
