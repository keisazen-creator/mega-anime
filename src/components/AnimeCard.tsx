import { Link } from "react-router-dom";
import { Play, Star } from "lucide-react";
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
}

const AnimeCard = ({ id, title, image, score, genres, year, delay = 0 }: AnimeCardProps) => {
  const animeData = {
    id,
    title: { romaji: title, english: title },
    coverImage: { large: image },
    genres: genres || [],
    averageScore: score ?? null,
    seasonYear: year ?? null,
  };

  return (
    <Link
      to={`/anime/${id}`}
      className="group relative flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[175px] animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {score && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-xs font-semibold text-yellow-400">
            <Star size={10} fill="currentColor" />
            {formatScore(score)}
          </div>
        )}

        <div className="absolute top-2 right-2 z-10">
          <QuickAddButton anime={animeData} />
        </div>

        <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center glow-accent-sm">
            <Play size={18} fill="currentColor" className="text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs sm:text-sm text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </p>
      {(genres || year) && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {genres?.slice(0, 2).join(" • ")}{genres && year ? " • " : ""}{year || ""}
        </p>
      )}
    </Link>
  );
};

export default AnimeCard;
